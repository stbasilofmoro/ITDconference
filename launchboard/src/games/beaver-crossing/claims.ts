export type PrizeClaim = { name: string; company: string; phone: string; address: string };
// Public form URL; an environment override can point a separate kiosk at another form.
export const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT || 'https://formspree.io/f/mrpzlqab';
export function validEndpoint(endpoint: string): boolean {
  return /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint);
}
export function validateClaim(claim: PrizeClaim): string | null {
  if (!claim.name.trim() || !claim.company.trim() || !claim.address.trim()) return 'Please complete your name, company, and full mailing address.';
  if (claim.name.length > 120 || claim.company.length > 160 || claim.address.length > 600) return 'Please shorten the details to fit the form.';
  const digits = claim.phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 18 || claim.phone.length > 40) return 'Please enter a valid phone number, including the area or country code.';
  return null;
}
export async function submitClaim(endpoint: string, claim: PrizeClaim, claimId: string, signal: AbortSignal, send: typeof fetch = fetch, leaderboard?: { runId: string; score: number; firstName: string; lastName: string }): Promise<void> {
  const error = validateClaim(claim);
  if (error) throw new Error(error);
  if (!validEndpoint(endpoint)) throw new Error('Prize claims are not connected yet. Please ask the ITD booth team to arrange your syrup.');
  const response = await send(endpoint, {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ name: claim.name.trim(), company: claim.company.trim(), phone: claim.phone.trim(), address: claim.address.trim(), _subject: 'AREMA — Beaver Crossing maple syrup prize', game: 'Beaver Crossing', levelsCompleted: 5, claimId, ...(leaderboard ? { ...leaderboard, gameId: 'beaver-crossing', submissionType: 'prize-and-leaderboard' } : {}) }),
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'The prize service is busy. Please wait a moment, then try again.' : 'Your claim was not accepted. Please try again or ask the ITD booth team for help.');
}
