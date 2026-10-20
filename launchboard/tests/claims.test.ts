import { describe, expect, it, vi } from 'vitest';
import { submitClaim, type ClaimContext, type PrizeClaim } from '../src/games/beaver-crossing/claims';

const endpoint = 'https://formspree.io/f/testonly';
const claim: PrizeClaim = {
  name: ' Test Player ', company: ' Example Rail ', phone: ' +1 555 010 2345 ',
  address: ' 123 Example Street, Example, NY 10001, USA ',
};
const allGames: ClaimContext = { kind: 'all-games', firstName: ' Test ', lastName: ' Player ' };

describe('all-games prize claims', () => {
  it('sends fulfillment details and explicitly self-reported challenge metadata without inventing a game result', async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
    const controller = new AbortController();
    await submitClaim(endpoint, claim, 'all-games-claim', controller.signal, send, allGames);

    expect(send).toHaveBeenCalledTimes(1);
    const [url, options] = send.mock.calls[0];
    expect(url).toBe(endpoint);
    expect(options).toMatchObject({ method: 'POST', signal: controller.signal, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });
    const body = JSON.parse(String(options?.body));
    expect(body).toEqual({
      name: 'Test Player', company: 'Example Rail', phone: '+1 555 010 2345',
      address: '123 Example Street, Example, NY 10001, USA', claimId: 'all-games-claim',
      _subject: 'RTA — All games maple syrup prize', submissionType: 'all-games-prize',
      challenge: 'beat-every-game', completionReported: true, game: 'All games',
      firstName: 'Test', lastName: 'Player',
    });
    for (const field of ['score', 'runId', 'gameId', 'levelsCompleted', 'gamesCompleted', 'completionVerified']) expect(body).not.toHaveProperty(field);
  });

  it('preserves legacy single-game prize and leaderboard metadata when an actual result is supplied', async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
    await submitClaim(endpoint, claim, 'legacy-claim', new AbortController().signal, send,
      { runId: 'winning-beaver-run', score: 4250, firstName: 'Test', lastName: 'Player' });
    const body = JSON.parse(String(send.mock.calls[0][1]?.body));
    expect(body).toMatchObject({
      game: 'Beaver Crossing', gameId: 'beaver-crossing', levelsCompleted: 5,
      submissionType: 'prize-and-leaderboard', runId: 'winning-beaver-run', score: 4250,
      firstName: 'Test', lastName: 'Player', claimId: 'legacy-claim',
    });
    expect(body).not.toHaveProperty('challenge');
    expect(body).not.toHaveProperty('completionReported');
  });

  it('retains field validation and rejects disconnected endpoints before attempting a submission', async () => {
    const send = vi.fn<typeof fetch>();
    const signal = new AbortController().signal;
    await expect(submitClaim(endpoint, { ...claim, company: ' ' }, 'invalid-claim', signal, send, allGames)).rejects.toThrow('complete');
    await expect(submitClaim(endpoint, { ...claim, phone: 'not a phone' }, 'invalid-claim', signal, send, allGames)).rejects.toThrow('phone');
    await expect(submitClaim('https://example.com/f/testonly', claim, 'invalid-claim', signal, send, allGames)).rejects.toThrow('not connected');
    expect(send).not.toHaveBeenCalled();
  });

  it('retains the claim identity on a user retry and reports acceptance only after a successful response', async () => {
    const send = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{}', { status: 429 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const signal = new AbortController().signal;
    await expect(submitClaim(endpoint, claim, 'same-claim', signal, send, allGames)).rejects.toThrow('busy');
    await expect(submitClaim(endpoint, claim, 'same-claim', signal, send, allGames)).resolves.toBeUndefined();
    expect(send.mock.calls.map(([, options]) => JSON.parse(String(options?.body)).claimId)).toEqual(['same-claim', 'same-claim']);
  });

  it('passes the abort signal through and never automatically retries an interrupted submission', async () => {
    const controller = new AbortController();
    const interrupted = new DOMException('Request aborted', 'AbortError');
    const send = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      expect(options?.signal).toBe(controller.signal);
      controller.abort();
      throw interrupted;
    });
    await expect(submitClaim(endpoint, claim, 'interrupted-claim', controller.signal, send, allGames)).rejects.toBe(interrupted);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
