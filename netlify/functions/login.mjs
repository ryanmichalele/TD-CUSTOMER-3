import bcrypt from 'bcryptjs';
import { sanity, signSession, sessionCookie, json, fail } from './_lib.mjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail('Method not allowed', 405);

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (_) {
    return fail('Invalid request body');
  }

  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  if (!email || !password) return fail('Email and password are required');

  try {
    const user = await sanity().fetch(
      '*[_type == "accountHolder" && email == $email][0]{ userId, firstName, middleName, lastName, fullName, email, accountNumber, passwordHash }',
      { email }
    );

    if (!user || !user.passwordHash) return fail('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return fail('Invalid credentials', 401);

    const name =
      user.fullName || [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || 'User';

    const token = signSession({
      sub: user.userId,
      email: user.email,
      name,
      accountNumber: user.accountNumber,
    });

    return json(
      200,
      {
        success: true,
        userId: user.userId,
        email: user.email,
        name,
        accountNumber: user.accountNumber,
        redirect: '/dashboard/',
      },
      { 'Set-Cookie': sessionCookie(token, event) }
    );
  } catch (err) {
    console.error('login error', err);
    return fail('Could not sign you in. Please try again.', 500);
  }
};
