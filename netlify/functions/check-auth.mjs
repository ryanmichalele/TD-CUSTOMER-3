import { readSession, json } from './_lib.mjs';

export const handler = async (event) => {
  const session = readSession(event);
  if (!session) return json(200, { authenticated: false });

  return json(200, {
    authenticated: true,
    userId: session.sub,
    email: session.email,
    name: session.name,
    accountNumber: session.accountNumber,
  });
};
