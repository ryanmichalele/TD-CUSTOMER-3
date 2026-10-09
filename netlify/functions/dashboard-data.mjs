import { readSession, sanity, json, fail } from './_lib.mjs';

export const handler = async (event) => {
  const session = readSession(event);
  if (!session) return fail('Not authenticated', 401);

  try {
    const user = await sanity().fetch(
      '*[_type == "accountHolder" && userId == $userId][0]',
      { userId: session.sub }
    );

    if (!user) return fail('Account not found', 404);

    const { passwordHash, ...safe } = user;
    return json(200, { authenticated: true, ...safe });
  } catch (err) {
    console.error('dashboard-data error', err);
    return fail('Could not load your dashboard. Please try again.', 500);
  }
};
