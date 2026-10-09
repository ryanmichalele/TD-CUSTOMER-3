import { clearCookie } from './_lib.mjs';

export const handler = async (event) => ({
  statusCode: 303,
  headers: {
    Location: '/log-in/',
    'Set-Cookie': clearCookie(event),
    'Cache-Control': 'no-store',
  },
  body: '',
});
