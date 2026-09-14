import { COLORS, ROUTES, STATIONS, type Card, type Color, type Route } from './map';
export type Side = 0 | 1;
export type Ticket = { id: number; depot: number; plant: number; points: number };
export type Player = { hand: Card[]; trains: number; tickets: Ticket[]; ticketDeck: Ticket[]; routePoints: number };
export type Run = { phase: 'intro' | 'tickets' | 'playing' | 'won'; turn: Side; players: [Player, Player]; deck: Card[]; discard: Card[]; market: Card[]; owners: (Side | null)[]; seed: number; drawn: number; turns: number; finalTurns: number | null; ticketOffer: Ticket[]; initialTickets: boolean; message: string; revision: number; passes: number };
const POINTS = [0, 1, 2, 4, 7, 10, 15];
function random(r: Run) { r.seed = (Math.imul(r.seed, 1664525) + 1013904223) >>> 0; return r.seed / 4294967296; }
function shuffle<T>(r: Run, array: T[]) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(random(r) * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }
function take(r: Run): Card | undefined { if (!r.deck.length) r.deck = shuffle(r, r.discard.splice(0)); return r.deck.pop(); }
export function refillMarket(r: Run) {
  // If too few non-wild cards remain, keep a usable market rather than looping forever.
  for (let tries = 0; tries < 100; tries++) {
    while (r.market.length < 5) { const card = take(r); if (!card) break; r.market.push(card); }
    if (r.market.filter((c) => c === 'wild').length < 3 || [...r.deck, ...r.discard, ...r.market].filter((c) => c !== 'wild').length < 3) return;
    r.discard.push(...r.market.splice(0));
  }
}
export function newRun(seed = Math.floor(Math.random() * 0xFFFFFFFF)): Run {
  const player = (): Player => ({ hand: [], trains: 45, tickets: [], ticketDeck: [], routePoints: 0 });
  const r: Run = { phase: 'intro', turn: 0, players: [player(), player()], deck: [], discard: [], market: [], owners: ROUTES.map(() => null), seed, drawn: 0, turns: 0, finalTurns: null, ticketOffer: [], initialTickets: true, message: 'Build a route to a cleaner future.', revision: 0, passes: 0 };
  r.deck = shuffle(r, [...COLORS.flatMap((c) => Array<Card>(12).fill(c)), ...Array<Card>(14).fill('wild')]);
  for (const side of [0, 1] as const) {
    r.players[side].hand = Array.from({ length: 4 }, () => take(r)!);
    r.players[side].ticketDeck = shuffle(r, STATIONS.filter((s) => s.kind === (side === 0 ? 'bio' : 'cogen')).map((s) => ({ id: s.id, depot: s.region * 8, plant: s.id, points: 6 + s.id % 3 * 2 })));
  }
  const aiOffer = r.players[1].ticketDeck.splice(0, 3);
  r.players[1].tickets = aiOffer.slice(0, 2); r.players[1].ticketDeck.push(aiOffer[2]);
  refillMarket(r); return r;
}
export function start(r: Run) { if (r.phase !== 'intro') return; r.phase = 'tickets'; r.ticketOffer = r.players[0].ticketDeck.splice(0, 3); r.revision++; }
export function connected(r: Run, side: Side, a: number, b: number) {
  const seen = new Set([a]), queue = [a];
  while (queue.length) { const at = queue.shift()!; if (at === b) return true; for (const route of ROUTES) if (r.owners[route.id] === side) { const next = route.a === at ? route.b : route.b === at ? route.a : -1; if (next >= 0 && !seen.has(next)) { seen.add(next); queue.push(next); } } }
  return false;
}
export function connections(r: Run, side: Side) { return STATIONS.filter((s) => s.kind === (side === 0 ? 'bio' : 'cogen') && connected(r, side, s.region * 8, s.id)).length; }
export function completedTickets(r: Run, side: Side) { return r.players[side].tickets.filter((t) => connected(r, side, t.depot, t.plant)).length; }
export function longest(r: Run, side: Side) {
  const owned = ROUTES.filter((route) => r.owners[route.id] === side);
  const walk = (at: number, used: Set<number>): number => {
    let best = 0;
    for (const route of owned) if (!used.has(route.id) && (route.a === at || route.b === at)) {
      used.add(route.id); best = Math.max(best, route.length + walk(route.a === at ? route.b : route.a, used)); used.delete(route.id);
    }
    return best;
  };
  return Math.max(0, ...STATIONS.map((s) => walk(s.id, new Set())));
}
export function totals(r: Run) {
  const lengths = [longest(r, 0), longest(r, 1)];
  return ([0, 1] as const).map((side) => ({ connections: connections(r, side), tickets: completedTickets(r, side), longest: lengths[side], points: r.players[side].routePoints + r.players[side].tickets.reduce((sum, t) => sum + (connected(r, side, t.depot, t.plant) ? t.points : -t.points), 0) + (lengths[side] > 0 && lengths[side] >= lengths[1 - side] ? 10 : 0) }));
}
export function winner(r: Run): Side | null {
  const t = totals(r);
  for (const key of ['connections', 'points', 'tickets', 'longest'] as const) if (t[0][key] !== t[1][key]) return t[0][key] > t[1][key] ? 0 : 1;
  return null;
}
function endTurn(r: Run, pass = false) {
  r.passes = pass ? r.passes + 1 : 0;
  r.turns++; r.drawn = 0;
  if (r.finalTurns !== null) { r.finalTurns--; if (r.finalTurns === 0) r.phase = 'won'; }
  else if (r.players[r.turn].trains <= 2) r.finalTurns = 2;
  if (r.owners.every((owner) => owner !== null) || r.passes >= 2) r.phase = 'won';
  r.turn = r.turn === 0 ? 1 : 0; r.revision++;
}
export function keepTickets(r: Run, ids: number[]) {
  if (r.phase !== 'tickets') return false;
  const kept = r.ticketOffer.filter((t) => ids.includes(t.id));
  if (kept.length < Math.min(r.initialTickets ? 2 : 1, r.ticketOffer.length)) return false;
  r.players[0].tickets.push(...kept); r.players[0].ticketDeck.push(...r.ticketOffer.filter((t) => !ids.includes(t.id)));
  r.ticketOffer = []; r.phase = 'playing'; r.message = 'Your turn: draw cards, claim a route, or take tickets.';
  if (!r.initialTickets) endTurn(r); r.initialTickets = false; r.revision++; return true;
}
export function drawTickets(r: Run) {
  if (r.phase !== 'playing' || r.drawn || !r.players[r.turn].ticketDeck.length) return false;
  if (r.turn === 1) { const offer = r.players[1].ticketDeck.splice(0, 3); offer.sort((a, b) => Number(connected(r, 1, b.depot, b.plant)) - Number(connected(r, 1, a.depot, a.plant))); r.players[1].tickets.push(offer[0]); r.players[1].ticketDeck.push(...offer.slice(1)); endTurn(r); return true; }
  r.ticketOffer = r.players[0].ticketDeck.splice(0, 3); r.phase = 'tickets'; r.revision++; return true;
}
export function drawCard(r: Run, index: number) {
  if (r.phase !== 'playing') return false;
  if (index >= 0 && (index >= r.market.length || (r.drawn > 0 && r.market[index] === 'wild'))) return false;
  const card = index < 0 ? take(r) : r.market.splice(index, 1)[0];
  if (!card) return false;
  r.players[r.turn].hand.push(card); r.drawn += index >= 0 && card === 'wild' ? 2 : 1;
  refillMarket(r); r.message = r.drawn < 2 ? 'Take one more card. A face-up WILD cannot be your second card.' : 'Cards collected.';
  if (r.drawn >= 2 || (!r.deck.length && !r.discard.length && !r.market.some((c) => c !== 'wild'))) endTurn(r);
  r.revision++; return true;
}
export function payment(r: Run, side: Side, route: Route, color?: Color): Card[] | null {
  if (r.owners[route.id] !== null || r.players[side].trains < route.length) return null;
  const hand = r.players[side].hand;
  const colors = route.color === 'gray' ? color ? [color] : [...COLORS].sort((a, b) => hand.filter((c) => c === b).length - hand.filter((c) => c === a).length) : [route.color];
  for (const c of colors) {
    const same = hand.filter((v) => v === c).slice(0, route.length), wild = hand.filter((v) => v === 'wild').slice(0, route.length - same.length);
    if (same.length + wild.length === route.length) return [...same, ...wild];
  }
  return null;
}
export function claimRoute(r: Run, id: number, color?: Color) {
  if (r.phase !== 'playing' || r.drawn) return false;
  const route = ROUTES[id]; if (!route) return false;
  const cards = payment(r, r.turn, route, color); if (!cards) { r.message = 'Collect the matching cards first, or choose another open route.'; r.revision++; return false; }
  const p = r.players[r.turn]; for (const card of cards) p.hand.splice(p.hand.indexOf(card), 1);
  r.discard.push(...cards); p.trains -= route.length; p.routePoints += POINTS[route.length]; r.owners[id] = r.turn;
  r.message = `${r.turn === 0 ? 'Biocarbon' : 'Cogen'} claimed ${STATIONS[route.a].name} / ${STATIONS[route.b].name}.`;
  refillMarket(r); endTurn(r); return true;
}
export function canPass(r: Run) { return !r.drawn && !r.deck.length && !r.discard.length && !r.market.length && !r.players[r.turn].ticketDeck.length && !ROUTES.some((route) => payment(r, r.turn, route)); }
export function pass(r: Run) { if (r.phase !== 'playing' || !canPass(r)) return false; endTurn(r, true); return true; }
// Dijkstra across owned and still-open corridors; the opponent's claims are blocked.
function path(r: Run, side: Side, from: number, to: number): number[] {
  const cost = STATIONS.map(() => Infinity), paths: number[][] = STATIONS.map(() => []), visited = new Set<number>(); cost[from] = 0;
  for (;;) {
    let at = -1; for (const s of STATIONS) if (!visited.has(s.id) && (at < 0 || cost[s.id] < cost[at])) at = s.id;
    if (at < 0 || cost[at] === Infinity) return []; if (at === to) return paths[at]; visited.add(at);
    for (const route of ROUTES) {
      if (r.owners[route.id] !== null && r.owners[route.id] !== side) continue;
      const next = route.a === at ? route.b : route.b === at ? route.a : -1; if (next < 0) continue;
      const w = r.owners[route.id] === side ? 0 : route.length;
      if (cost[at] + w < cost[next]) { cost[next] = cost[at] + w; paths[next] = [...paths[at], route.id]; }
    }
  }
}
export function aiTurn(r: Run) {
  if (r.phase !== 'playing' || r.turn !== 1) return;
  const goals = STATIONS.filter((s) => s.kind === 'cogen' && !connected(r, 1, s.region * 8, s.id));
  const scores = new Map<number, number>();
  for (const goal of goals) {
    const routes = path(r, 1, goal.region * 8, goal.id).filter((id) => r.owners[id] === null);
    const cost = routes.reduce((n, id) => n + ROUTES[id].length, 0);
    for (const id of routes) scores.set(id, (scores.get(id) ?? 0) + 30 / Math.max(1, cost) + (r.players[1].tickets.some((t) => t.plant === goal.id) ? 3 : 0));
  }
  const ordered = ROUTES.filter((route) => r.owners[route.id] === null && route.length <= r.players[1].trains).sort((a, b) => ((scores.get(b.id) ?? 0) + 1 / b.length) - ((scores.get(a.id) ?? 0) + 1 / a.length));
  const affordable = ordered.find((route) => payment(r, 1, route));
  if (affordable && !r.drawn) { claimRoute(r, affordable.id); return; }
  const target = ordered[0];
  for (let i = 0; i < 2 && r.turn === 1; i++) {
    const hand = r.players[1].hand;
    const color = target?.color === 'gray' ? [...COLORS].sort((a, b) => hand.filter((v) => v === b).length - hand.filter((v) => v === a).length)[0] : target?.color;
    let index = r.market.findIndex((c) => c === color);
    if (index < 0 && !r.drawn) index = r.market.indexOf('wild');
    if (index < 0 && !r.deck.length && !r.discard.length) index = r.market.findIndex((c) => c !== 'wild');
    if (!drawCard(r, index)) { if (!drawTickets(r)) pass(r); break; }
  }
}
