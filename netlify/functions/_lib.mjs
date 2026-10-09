import { createClient } from '@sanity/client';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

export const COOKIE_NAME = 'td_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function sanity() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: '2024-10-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });
}

function secret() {
  return process.env.JWT_SECRET || 'dev-only-insecure-jwt-secret-change-me';
}

export function signSession(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '30d' });
}

export function getHeader(event, name) {
  const headers = event.headers || {};
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return '';
}

export function readSession(event) {
  const raw = getHeader(event, 'cookie');
  if (!raw) return null;
  const parsed = cookie.parse(raw);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret());
  } catch (_) {
    return null;
  }
}

export function isSecure(event) {
  const proto = getHeader(event, 'x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return true;
}

export function sessionCookie(token, event) {
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(event),
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearCookie(event) {
  return cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure(event),
    path: '/',
    maxAge: 0,
  });
}

export function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
    body: JSON.stringify(body),
  };
}

export function fail(message, statusCode = 400) {
  return json(statusCode, { success: false, error: message });
}

export function randomAccountNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return 'ADVP' + out;
}

export function randomUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

export async function verifyTurnstile(token) {
  const secretKey = process.env.TURNSTILE_SECRET;
  if (!secretKey) return true;
  if (!token) return true;
  try {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    }).then((r) => r.json());
    return !!result.success;
  } catch (_) {
    return false;
  }
}
