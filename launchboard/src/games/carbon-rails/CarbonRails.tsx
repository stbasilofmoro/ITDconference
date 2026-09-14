import { useGameAudio, snapshot } from '../../audio/useGameAudio';
import { phoneGameBlocked, usePhone } from '../../phone/viewport';
import { PhoneButton, PhonePanel, PhonePortal } from '../../phone/PhonePortal';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { fonts } from '../../brand';
import type { GameContext } from '../types';
import { appStore } from '../../state/store';
import { ScoreButton } from '../../leaderboard/ScoreButton';
import { scoreStore } from '../../leaderboard/scores';
import { aiTurn, canPass, claimRoute, completedTickets, connected, connections, drawCard, drawTickets, keepTickets, newRun, pass, payment, start, totals, winner, type Run } from './engine';
import { COLORS, INK, REGIONS, ROUTES, STATIONS, routeLabel, type Color } from './map';
import { RailGlobe } from './RailGlobe';

function Label({ children, x, y, size = 25, width = 650, color = '#433A48', center = false }: { children: ReactNode; x: number; y: number; size?: number; width?: number; color?: string; center?: boolean }) { return <Text position={[x, y, 950]} font={fonts.medium} fontSize={size} maxWidth={width} lineHeight={1.1} color={color} anchorX={center ? 'center' : 'left'} anchorY="top" textAlign={center ? 'center' : 'left'}>{children}</Text>; }
function Plate({ x, y, width, height, color, z = 850 }: { x: number; y: number; width: number; height: number; color: string; z?: number }) { return <mesh position={[x, y, z]}><planeGeometry args={[width, height]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>; }
function Button({ x, y, width = 210, height = 52, children, onClick, disabled = false, color = '#342D39' }: { x: number; y: number; width?: number; height?: number; children: string; onClick(): void; disabled?: boolean; color?: string }) {
  return <group position={[x, y, 1100]} onClick={(e) => { e.stopPropagation(); appStore.getState().markInput(performance.now()); if (!disabled) onClick(); }}>
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial color={disabled ? '#A4A19F' : color} toneMapped={false} /></mesh>
    <Text position={[0, 0, 3]} font={fonts.semibold} fontSize={22} maxWidth={width - 12} textAlign="center" color={color === INK.white || color === INK.yellow || color === INK.orange ? '#302933' : '#F7F0E7'}>{children}</Text>
  </group>;
}
export default function CarbonRails({ ctx }: { ctx: GameContext }) {
  const phone = usePhone();
  const [run] = useState(newRun), [, redraw] = useState(0), [region, setRegion] = useState(0), [selected, setSelected] = useState(0), [zoom, setZoom] = useState(0.94);
  const [kept, setKept] = useState<number[]>([]), [help, setHelp] = useState(false), [paused, setPaused] = useState(false), [payColor, setPayColor] = useState<Color>('orange');
  useGameAudio('carbon-rails', () => snapshot.rails(run, paused || help));
  const [ticketPage, setTicketPage] = useState(0);
  const runId = useRef(crypto.randomUUID()), clock = useRef(0), aiClock = useRef(0);
  const refresh = useCallback(() => redraw((v) => v + 1), []);
  const act = useCallback((action: () => unknown) => { if (scoreStore.getState().open) return; action(); refresh(); }, [refresh]);
  const choose = useCallback((id: number) => { setSelected(id); setRegion(ROUTES[id].region); if (ROUTES[id].color !== 'gray') setPayColor(ROUTES[id].color as Color); }, []);
  const changeRegion = useCallback((i: number) => { const index = (i + REGIONS.length) % REGIONS.length; setRegion(index); choose(index * 12); }, [choose]);
  const begin = () => { start(run); setKept(run.ticketOffer.map((t) => t.id)); refresh(); };
  const restart = () => { Object.assign(run, newRun()); runId.current = crypto.randomUUID(); setTicketPage(0); begin(); };
  const select = () => { if (help) setHelp(false); else if (paused) setPaused(false); else if (run.phase === 'intro') begin(); else if (run.phase === 'won') restart(); else if (run.phase === 'tickets') act(() => keepTickets(run, kept)); else if (run.turn === 0) act(() => claimRoute(run, selected, payColor)); };
  useEffect(() => ctx.input.subscribe((action) => {
    if (scoreStore.getState().open) return;
    if (action === 'select') select();
    else if (!help && !paused && run.phase === 'playing') {
      if (action === 'left') changeRegion(region - 1); if (action === 'right') changeRegion(region + 1);
      if (action === 'up') choose(region * 12 + (selected % 12 + 11) % 12); if (action === 'down') choose(region * 12 + (selected % 12 + 1) % 12);
    }
  }), [ctx.input, region, selected, kept, help, paused, payColor]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-kiosk-form]') || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      if (e.code === 'KeyP') setPaused((v) => !v);
      if (run.phase !== 'playing' || run.turn !== 0 || help || paused) return;
      if (e.code === 'KeyD') act(() => drawCard(run, -1));
      if (e.code === 'KeyT') { act(() => drawTickets(run)); setKept(run.ticketOffer.map((t) => t.id)); }
      if (/^Digit[1-5]$/.test(e.code)) act(() => drawCard(run, Number(e.code.slice(-1)) - 1));
    };
    const hide = () => { if (document.hidden) setPaused(true); };
    window.addEventListener('keydown', key); document.addEventListener('visibilitychange', hide);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', hide); };
  }, [run, help, paused, act]);
  useFrame((_, dt) => {
    if (document.hidden || scoreStore.getState().open || paused || help || phoneGameBlocked()) return;
    if (run.phase === 'playing' && run.turn === 1) { aiClock.current += Math.min(dt, 0.1); if (aiClock.current >= 1.1) { aiClock.current = 0; aiTurn(run); refresh(); } } else aiClock.current = 0;
    clock.current += dt; if (clock.current > 0.1) { clock.current = 0; refresh(); }
  });
  useEffect(() => {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('e2e')) return;
    const w = window as unknown as { __carbonRails?: unknown };
    w.__carbonRails = { getState: () => structuredClone(run), setState: (patch: Partial<Run>) => { Object.assign(run, patch); refresh(); }, action: (a: string, id = 0) => { if (a === 'claim') claimRoute(run, id); if (a === 'draw') drawCard(run, id); refresh(); } };
    return () => { delete w.__carbonRails; };
  }, [run, refresh]);
  const route = ROUTES[selected], available = run.phase === 'playing' && run.turn === 0 && !paused && !help;
  const hand = run.players[0].hand, result = run.phase === 'won' ? totals(run) : null;
  const tickets = run.players[0].tickets, modal = run.phase === 'intro' || run.phase === 'tickets' || run.phase === 'won' || help || paused;
  return <>
    <RailGlobe run={run} region={region} selected={selected} select={choose} zoom={zoom} />
    <PhonePortal><PhonePanel title="Carbon Rails" status={`You: ${connections(run, 0)} plants · Cogen: ${connections(run, 1)}`} modal={modal} exit={ctx.exit} result={result ? { id: runId.current, game: 'carbon-rails', score: result[0].connections, detail: `${result[0].connections} biocarbon plants connected / ${result[0].points} tie-break points` } : undefined}>
      {modal ? <>
        {run.phase === 'tickets' && !help && !paused ? <><p>Choose destinations. Keep at least {run.initialTickets ? 'two' : 'one'}.</p>{run.ticketOffer.map((t) => <label className="phone-check" key={t.id}><input type="checkbox" checked={kept.includes(t.id)} onChange={() => setKept((v) => v.includes(t.id) ? v.filter((id) => id !== t.id) : [...v, t.id])} />{STATIONS[t.depot].name} to {STATIONS[t.plant].name} · {t.points} points</label>)}<PhoneButton disabled={kept.length < (run.initialTickets ? 2 : 1)} onPress={select}>Confirm destinations</PhoneButton></> : <>
          <p>{paused ? 'Paused. The computer will wait.' : result ? `You connected ${result[0].connections} biocarbon plants; Cogen connected ${result[1].connections}. ${winner(run) === 0 ? 'Your cleaner network wins!' : winner(run) === 1 ? 'Cogen wins this round.' : 'An even connection.'}` : 'Connect green biocarbon plants to orange depots. The computer connects smoky cogen plants. Land routes only: never cross an ocean.'}</p>
          {!paused && !result && <><p>Each turn, draw two cards, claim one route with matching cards, or draw three destination tickets and keep at least one. A face-up wild uses both draws.</p><p>Gray routes accept a single color plus wilds. Start with 45 trains and four cards. When someone has two trains left, each side gets a final turn. Most connected plants wins; points, completed tickets, then longest railway break ties.</p><p>Drag the globe to explore. Use the region and route menus to select a connection.</p></>}
          <PhoneButton onPress={select}>{paused ? 'Resume' : help ? 'Back to the globe' : result ? 'Play again' : 'Choose your first tickets'}</PhoneButton>
        </>}
      </> : <>
        <p>{run.turn === 1 ? 'Cogen is planning…' : run.drawn ? 'Draw your second card.' : 'Your turn: draw, claim, or take tickets.'}</p>
        <label>Region<select value={region} onChange={(e) => changeRegion(Number(e.target.value))}>{REGIONS.map((r, i) => <option key={r.name} value={i}>{r.name}</option>)}</select></label>
        <label>Railway<select value={selected} onChange={(e) => choose(Number(e.target.value))}>{ROUTES.filter((r) => r.region === region).map((r) => <option key={r.id} value={r.id}>{routeLabel(r)}</option>)}</select></label>
        <p>{route.length} {route.color} cards · {run.owners[selected] === null ? 'Open' : run.owners[selected] === 0 ? 'Your railway' : 'Cogen railway'}</p>
        <label>Pay with<select value={payColor} onChange={(e) => setPayColor(e.target.value as Color)}>{COLORS.map((color) => <option key={color} value={color}>{color} · {hand.filter((c) => c === color).length}</option>)}</select></label>
        <p>{run.players[0].trains} trains · {hand.filter((c) => c === 'wild').length} wild cards</p>
        <PhoneButton disabled={!available || !!run.drawn || !payment(run, 0, route, payColor)} onPress={() => act(() => claimRoute(run, selected, payColor))}>Claim route</PhoneButton>
        <p role="status">{run.message}</p><h2>Collect cards</h2>
        {run.market.map((card, i) => <PhoneButton key={i} disabled={!available || !!run.drawn && card === 'wild'} onPress={() => act(() => drawCard(run, i))}>{i + 1} · {card}</PhoneButton>)}
        <PhoneButton disabled={!available} onPress={() => act(() => drawCard(run, -1))}>Draw from deck</PhoneButton>
        <h2>Destinations</h2><ul>{tickets.map((t) => <li key={t.id}>{connected(run, 0, t.depot, t.plant) ? 'Done: ' : ''}{STATIONS[t.depot].name} to {STATIONS[t.plant].name} · {t.points}</li>)}</ul>
        <PhoneButton disabled={!available || !!run.drawn || !run.players[0].ticketDeck.length} onPress={() => { act(() => drawTickets(run)); setKept(run.ticketOffer.map((t) => t.id)); }}>Draw tickets</PhoneButton>
        {canPass(run) && <PhoneButton onPress={() => act(() => pass(run))}>No legal action / Pass</PhoneButton>}
        <div className="phone-row"><PhoneButton onPress={() => setZoom((v) => Math.max(0.7, v - 0.15))}>Zoom out</PhoneButton><PhoneButton onPress={() => setZoom((v) => Math.min(1.4, v + 0.15))}>Zoom in</PhoneButton></div>
        <div className="phone-row"><PhoneButton onPress={() => setHelp(true)}>Rules</PhoneButton><PhoneButton onPress={() => setPaused(true)}>Pause</PhoneButton></div>
      </>}
    </PhonePanel></PhonePortal>
    {!phone && <><Label x={-875} y={500} size={22}>ITD / A WORLD OF POSSIBILITIES</Label>
    <Label x={-875} y={463} size={52} color="#2E2735">Carbon Rails</Label>
    <Label x={-875} y={-293} size={21} width={940}>Drag the globe to explore / Real coastlines / Land routes only</Label>
    {REGIONS.map((r, i) => <Button key={r.name} x={-795 + i % 3 * 285} y={-354 - Math.floor(i / 3) * 58} width={272} height={48} color={region === i ? '#32634A' : '#79717B'} onClick={() => changeRegion(i)}>{r.name}</Button>)}
    <Button x={-875} y={100} width={65} onClick={() => setZoom((v) => Math.max(0.7, v - 0.15))}>-</Button>
    <Button x={-875} y={167} width={65} onClick={() => setZoom((v) => Math.min(1.4, v + 0.15))}>+</Button>
    <Label x={-875} y={-453} size={21}>YOUR CARDS / TAP A COLOR TO PAY FOR A GRAY ROUTE</Label>
    {[...COLORS, 'wild' as const].map((color, i) => <group key={color}>
      <Button x={-829 + i * 94} y={-494} width={87} height={42} color={INK[color]} onClick={() => { if (color !== 'wild') setPayColor(color); }}>{`${color.toUpperCase().slice(0, 3)} ${hand.filter((c) => c === color).length}`}</Button>
    </group>)}
    <Plate x={540} y={0} width={718} height={1080} color="#CCCBC7" />
    <Label x={220} y={494} size={22}>BIOCARBON / YOU</Label><Label x={577} y={494} size={22}>COGEN / COMPUTER</Label>
    <Label x={220} y={456} size={59} color="#286244">{`${connections(run, 0)} plants`}</Label><Label x={577} y={456} size={59}>{`${connections(run, 1)} plants`}</Label>
    <Label x={220} y={382} size={21}>{`${run.players[0].trains} trains / ${hand.length} cards`}</Label><Label x={577} y={382} size={21}>{`${run.players[1].trains} trains / ${run.players[1].hand.length} cards`}</Label>
    <Label x={220} y={339} size={26} color="#755069">{run.phase === 'won' ? 'NETWORK COMPLETE' : run.turn === 1 ? 'COMPUTER IS PLANNING...' : run.drawn ? 'DRAW YOUR SECOND CARD' : 'YOUR TURN / CHOOSE ONE ACTION'}</Label>
    <Label x={220} y={301} size={19}>{run.finalTurns === null ? 'Orange depot / Green biocarbon / Smokestacks: cogen' : `FINAL ROUND / ${run.finalTurns} turns remaining`}</Label>
    <Label x={220} y={264} size={22}>1 / COLLECT CARDS</Label>
    {run.market.map((card, i) => <group key={i}><Button x={265 + i * 126} y={207} width={112} height={64} color={INK[card]} disabled={!available || !!run.drawn && card === 'wild'} onClick={() => act(() => drawCard(run, i))}>{`${i + 1} / ${card.toUpperCase()}`}</Button></group>)}
    <Button x={370} y={144} width={300} height={43} disabled={!available} onClick={() => act(() => drawCard(run, -1))}>Draw from deck / D</Button>
    <Label x={545} y={163} size={19} width={315}>Face-up WILD uses both draws.</Label>
    <Label x={220} y={101} size={22}>{`2 / CLAIM A ROUTE / ${REGIONS[region].name.toUpperCase()}`}</Label>
    <Button x={250} y={36} width={55} onClick={() => choose(region * 12 + (selected % 12 + 11) % 12)}>-</Button>
    <Button x={842} y={36} width={55} onClick={() => choose(region * 12 + (selected % 12 + 1) % 12)}>+</Button>
    <Label x={301} y={59} size={26} width={490}>{routeLabel(route)}</Label>
    <Label x={301} y={21} size={21} width={490}>{`${route.length} ${route.color === 'gray' ? payColor.toUpperCase() + ' (gray route)' : route.color.toUpperCase()} cards / ${run.owners[selected] === null ? 'OPEN' : run.owners[selected] === 0 ? 'YOUR RAILWAY' : 'COGEN RAILWAY'}`}</Label>
    <Button x={545} y={-51} width={650} disabled={!available || !!run.drawn || !payment(run, 0, route, payColor)} color="#315C46" onClick={() => act(() => claimRoute(run, selected, payColor))}>Claim selected route / Enter / A</Button>
    <Label x={220} y={-93} size={20} width={650}>{run.message}</Label>
    <Label x={220} y={-153} size={22}>{`3 / DESTINATION TICKETS / ${completedTickets(run, 0)} COMPLETE`}</Label>
    <Button x={425} y={-207} width={410} height={45} disabled={!available || !!run.drawn || !run.players[0].ticketDeck.length} onClick={() => { act(() => drawTickets(run)); setKept(run.ticketOffer.map((t) => t.id)); }}>Draw tickets / T</Button>
    <Button x={763} y={-207} width={212} height={45} onClick={() => setTicketPage((v) => tickets.length ? (v + 1) % Math.ceil(tickets.length / 3) : 0)}>Next page</Button>
    {tickets.slice(ticketPage * 3, ticketPage * 3 + 3).map((t, i) => <Label key={t.id} x={220} y={-251 - i * 36} size={22} width={650} color={connected(run, 0, t.depot, t.plant) ? '#286244' : '#514553'}>{`${connected(run, 0, t.depot, t.plant) ? 'DONE' : 'LINK'} / ${STATIONS[t.depot].name} to ${STATIONS[t.plant].name} / ${t.points}`}</Label>)}
    <Label x={220} y={-366} size={19} width={650}>Most plants linked to their depot wins. Tickets and route points break ties.</Label>
    <Button x={318} y={-438} width={195} onClick={() => setHelp(true)}>Rules</Button>
    <Button x={544} y={-438} width={195} onClick={() => setPaused(true)}>Pause / P</Button>
    <Button x={771} y={-438} width={195} onClick={ctx.exit}>Exit</Button>
    {canPass(run) && <Button x={545} y={-500} width={650} onClick={() => act(() => pass(run))}>No legal action / Pass</Button>}
    {modal && <group position={[0, 0, 1300]}>
      <Plate x={0} y={0} width={1920} height={1080} color="#C9CBC5" z={0} />
      <Label x={-780} y={452} size={24}>CARBON RAILS / CONNECT A CLEANER WORLD</Label>
      <Label x={-780} y={385} size={75} width={1580}>{paused ? 'Take a breather.' : help ? 'Plan. Collect. Connect.' : run.phase === 'tickets' ? 'Choose your destinations.' : result ? winner(run) === 0 ? 'A cleaner network wins.' : winner(run) === 1 ? 'Cogen connected more.' : 'An even connection.' : 'A different kind of power play.'}</Label>
      {run.phase === 'tickets' && !help && !paused ? <>
        <Label x={-780} y={247} size={32} width={1580}>{`Keep at least ${run.initialTickets ? 'two' : 'one'}. These are your private depot-to-biocarbon goals.`}</Label>
        {run.ticketOffer.map((t, i) => <Button key={t.id} x={0} y={127 - i * 120} width={1560} height={88} color={kept.includes(t.id) ? '#315C46' : '#7D7681'} onClick={() => setKept((v) => v.includes(t.id) ? v.filter((id) => id !== t.id) : [...v, t.id])}>{`${kept.includes(t.id) ? 'KEEP' : 'RETURN'} / ${STATIONS[t.depot].name} to ${STATIONS[t.plant].name} / ${t.points} points`}</Button>)}
        <Button x={0} y={-319} width={900} height={78} disabled={kept.length < (run.initialTickets ? 2 : 1)} onClick={() => act(() => keepTickets(run, kept))}>Confirm destinations / Enter</Button>
      </> : <>
        <Label x={-780} y={246} size={33} width={1520}>{paused ? 'The computer will wait. Resume when you are ready.' : result ? `You connected ${result[0].connections} biocarbon plants. The computer connected ${result[1].connections} cogen plants. Tie-break points: you ${result[0].points}, computer ${result[1].points}.` : 'Connect green biocarbon plants to orange regional depots. The computer races to connect its cogen plants, with tall stacks and dark smoke. Build on any continent, but never across an ocean.'}</Label>
        {!paused && !result && <>
          <Label x={-780} y={91} size={28} width={1520}>{'Each turn: take two cards, claim one route with matching cards, or draw three tickets and keep at least one. A face-up WILD takes the whole draw turn. Gray routes accept one color plus wilds.'}</Label>
          <Label x={-780} y={-62} size={28} width={1520}>{'Start with 45 trains and four cards. When either side has two trains left, both get one last turn. Most connected plants wins; points, completed tickets, then longest railway break ties.'}</Label>
          <Label x={-780} y={-204} size={23} width={1500}>Drag globe / Left-right: regions / Up-down: routes / Enter: claim / 1-5 or D: draw / T: tickets</Label>
        </>}
        {result && <Label x={-780} y={70} size={30} width={1500}>{`Completed tickets: ${result[0].tickets} / ${result[1].tickets}. Longest railway: ${result[0].longest} / ${result[1].longest} trains. Play again to try a different network.`}</Label>}
        <Button x={-200} y={-325} width={1100} height={78} onClick={select}>{paused ? 'Resume' : help ? 'Back to the globe' : result ? 'Play again' : 'Choose your first tickets'}</Button>
        <Button x={610} y={-325} width={440} height={78} onClick={ctx.exit}>Launchboard</Button>
        {result && <ScoreButton x={-200} y={-440} z={1150} result={{ id: runId.current, game: 'carbon-rails', score: result[0].connections, detail: `${result[0].connections} biocarbon plants connected / ${result[0].points} tie-break points` }} />}
        <Label x={-780} y={-477} size={19} width={1580}>Made with Natural Earth / Fictional plants and rail corridors / Original ITD game map</Label>
      </>}
    </group>}</>}
  </>;
}
