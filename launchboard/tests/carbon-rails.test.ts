import { describe, expect, it } from 'vitest';
import { aiTurn, claimRoute, connections, drawCard, drawTickets, keepTickets, newRun, payment, refillMarket, start, totals, winner } from '../src/games/carbon-rails/engine';
import { COLORS, ROUTES, STATIONS } from '../src/games/carbon-rails/map';
import { landPolygons, onLand, spherePoint } from '../src/geography/earth';

describe('Carbon Rails rules', () => {
  const playing = (seed = 7) => { const r = newRun(seed); start(r); keepTickets(r, r.ticketOffer.map((t) => t.id)); return r; };
  it('deals a full deck, 45 trains, four cards, five market cards and initial tickets', () => {
    const r = newRun(7); expect(r.players.map((p) => p.trains)).toEqual([45, 45]); expect(r.players.map((p) => p.hand.length)).toEqual([4, 4]);
    expect(r.market).toHaveLength(5); expect([...r.deck, ...r.discard, ...r.market, ...r.players.flatMap((p) => p.hand)]).toHaveLength(110);
    start(r); expect(keepTickets(r, [r.ticketOffer[0].id])).toBe(false); expect(keepTickets(r, r.ticketOffer.slice(0, 2).map((t) => t.id))).toBe(true); expect(r.turn).toBe(0);
  });
  it('enforces two draws, the face-up wild exception, and one action per turn', () => {
    const r = playing(); r.market = ['wild', 'orange', 'green', 'blue', 'red'];
    drawCard(r, 0); expect(r.turn).toBe(1);
    r.turn = 0; r.market = ['orange', 'wild', 'green', 'blue', 'red']; drawCard(r, 0);
    expect(r.drawn).toBe(1); expect(drawCard(r, 0)).toBe(false); expect(claimRoute(r, 0)).toBe(false); expect(drawTickets(r)).toBe(false);
    r.deck.push('wild'); expect(drawCard(r, -1)).toBe(true); expect(r.turn).toBe(1);
  });
  it('refreshes a three-wild market and recycles spent cards', () => {
    const r = playing(); r.market = ['wild', 'wild', 'wild', 'red', 'green']; refillMarket(r); expect(r.market.filter((c) => c === 'wild').length).toBeLessThan(3);
    r.deck = []; r.discard = ['orange', 'blue']; drawCard(r, -1); expect(r.players[0].hand).toContain('orange');
  });
  it('claims one route with a single color and wilds, blocks occupied routes and reduces stock', () => {
    const r = playing(); r.players[0].hand = ['orange', 'wild'];
    expect(payment(r, 0, ROUTES[0], 'orange')).toEqual(['orange', 'wild']); expect(claimRoute(r, 0, 'orange')).toBe(true);
    expect(r.players[0].trains).toBe(43); expect(r.owners[0]).toBe(0); expect(r.turn).toBe(1); expect(claimRoute(r, 0)).toBe(false);
    r.turn = 0; r.players[0].hand = ['red', 'green']; expect(payment(r, 0, ROUTES[8])).toBeNull();
  });
  it('requires at least one new destination and spends the turn', () => {
    const r = playing(); expect(drawTickets(r)).toBe(true); expect(keepTickets(r, [])).toBe(false); expect(keepTickets(r, [r.ticketOffer[0].id])).toBe(true); expect(r.turn).toBe(1);
  });
  it('counts each connected plant once, through only that side’s railways', () => {
    const r = playing(); r.owners[0] = 0; r.owners[1] = 0; expect(connections(r, 0)).toBe(1); expect(connections(r, 1)).toBe(0);
    r.owners[1] = 1; expect(connections(r, 0)).toBe(0); expect(connections(r, 1)).toBe(0);
  });
  it('gives both sides a final turn and ranks plant connections ahead of points', () => {
    const r = playing(); r.players[0].trains = 4; r.players[0].hand = ['orange', 'orange']; claimRoute(r, 0, 'orange'); expect(r.finalTurns).toBe(2);
    drawCard(r, -1); drawCard(r, -1); expect(r.finalTurns).toBe(1); drawCard(r, -1); drawCard(r, -1); expect(r.phase).toBe('won');
    r.owners[1] = 0; r.players[1].routePoints = 9999; expect(winner(r)).toBe(0); expect(totals(r)[0].connections).toBe(1);
  });
  it('computer builds legally, completes connections, and full games terminate', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const r = playing(seed);
      for (let turn = 0; turn < 400 && r.phase !== 'won'; turn++) {
        if (r.turn === 1) aiTurn(r);
        else {
          const route = ROUTES.find((route) => payment(r, 0, route));
          if (route) claimRoute(r, route.id); else { drawCard(r, -1); if (r.turn === 0) drawCard(r, -1); }
        }
      }
      expect(r.phase, `seed ${seed}`).toBe('won'); expect(connections(r, 1)).toBeGreaterThan(0);
      expect(r.players.every((p) => p.trains >= 0)).toBe(true);
      const cards = [...r.deck, ...r.market, ...r.discard, ...r.players.flatMap((p) => p.hand)];
      expect(cards).toHaveLength(110); for (const color of COLORS) expect(cards.filter((c) => c === color)).toHaveLength(12);
    }
  });
});
describe('real globe / land-only corridors', () => {
  it('keeps actual land polygons, including Antarctica and Greenland, on an undistorted sphere', () => {
    expect(landPolygons.length).toBeGreaterThan(100); expect(onLand(-42, 73)).toBe(true); expect(onLand(0, -85)).toBe(true); expect(onLand(-30, 0)).toBe(false);
    expect(spherePoint(0, 0).length()).toBeCloseTo(1); expect(spherePoint(180, 80).length()).toBeCloseTo(1);
  });
  it('places every station and every sampled rail corridor on land', () => {
    for (const s of STATIONS) expect(onLand(s.lon, s.lat), s.name).toBe(true);
    for (const route of ROUTES) {
      const a = STATIONS[route.a], b = STATIONS[route.b]; expect(a.region).toBe(b.region);
      for (let i = 0; i <= 100; i++) expect(onLand(a.lon + (b.lon - a.lon) * i / 100, a.lat + (b.lat - a.lat) * i / 100), `${a.name} / ${b.name} at ${i}%`).toBe(true);
    }
  });
});
