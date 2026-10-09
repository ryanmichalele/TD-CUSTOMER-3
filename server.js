const http = require('http');
const fs = require('fs');
const path = require('path');

const bcrypt = require('bcrypt');

const PORT = 3000;
const BASE = __dirname;

// In-memory user store for development.
// In production, replace with a proper database (PostgreSQL, MongoDB, etc.).
// Passwords are hashed with bcrypt; never store plaintext.
const users = {};

const sessions = {};

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
  '.map': 'application/octet-stream',
};

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function sendFile(res, filePath) {
  return new Promise((resolve) => {
    fs.readFile(filePath, (err, data) => {
      if (err) { resolve(false); return; }
      const ext = path.extname(filePath);
      const ct = (ext === '.html' || ext === '.htm') ? 'text/html' : getContentType(filePath);
      res.writeHead(200, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*' });
      res.end(data);
      resolve(true);
    });
  });
}

function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('404 Not Found');
}

function send500(res, message = '500 Internal Server Error') {
  res.writeHead(500, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end(message);
}

// ---- Password helpers ----

async function hashPassword(plainPassword) {
  const saltRounds = 12;
  return await bcrypt.hash(plainPassword, saltRounds);
}

async function verifyPassword(plainPassword, hash) {
  return await bcrypt.compare(plainPassword, hash);
}

function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ---- Authentication middleware ----

function withAuth(handler) {
  return async (req, res) => {
    const cookies = req.headers.cookie || '';
    const cookiePair = cookies.split(';').find(c => c.trim().startsWith('session='));
    const sessionId = cookiePair ? cookiePair.split('=')[1].trim() : null;

    if (!sessionId || !sessions[sessionId]) {
      send404(res);
      return;
    }

    const session = sessions[sessionId];
    const now = Date.now();

    if (now > session.expiresAt) {
      delete sessions[sessionId];
      res.writeHead(302, {
        'Location': '/log-in/',
        'Set-Cookie': 'session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict'
      });
      res.end();
      return;
    }

    const user = users[session.email];
    if (!user) {
      send404(res);
      return;
    }

    req.sessionUser = user;
    await handler(req, res);
  };
}

async function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { email, password } = JSON.parse(body || '{}');

      if (!email || !password) {
        send500(res, 'Missing email or password');
        return;
      }

      const user = users[email];
      if (!user) {
        send500(res, 'Invalid credentials');
        return;
      }

      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        send500(res, 'Invalid credentials');
        return;
      }

      const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      sessions[sessionId] = { email, userId: user.userId, expiresAt };

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`
      });
      res.end(JSON.stringify({ success: true, userId: user.userId, email: user.email }));
    } catch (err) {
      console.error('Login error:', err);
      send500(res, 'Internal server error');
    }
  });
}

async function handleRegister(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { email, password, name } = JSON.parse(body || '{}');

      if (!email || !password || !name) {
        send500(res, 'Missing required fields');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        send500(res, 'Invalid email format');
        return;
      }

      const pwRegex = /^.{8,}$/;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      if (!pwRegex.test(password) || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        send500(res, 'Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character');
        return;
      }

      if (users[email]) {
        send500(res, 'Email already registered');
        return;
      }

      const passwordHash = await hashPassword(password);
      const userId = generateUserId();
      const accountNumber = 'ADVP' + Math.random().toString(36).substr(2, 5).toUpperCase();

      users[email] = {
        userId,
        passwordHash,
        name,
        accountNumber,
        createdAt: new Date().toISOString(),
      };

      const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      sessions[sessionId] = { email, userId, expiresAt };

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`
      });
      res.end(JSON.stringify({ success: true, userId, email }));
    } catch (err) {
      console.error('Register error:', err);
      send500(res, 'Internal server error');
    }
  });
}

async function handleCheckAuth(req, res) {
  const cookies = req.headers.cookie || '';
  const cookiePair = cookies.split(';').find(c => c.trim().startsWith('session='));
  const sessionId = cookiePair ? cookiePair.split('=')[1].trim() : null;

  if (!sessionId || !sessions[sessionId]) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }

  const session = sessions[sessionId];
  const now = Date.now();

  if (now > session.expiresAt) {
    delete sessions[sessionId];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }

  const user = users[session.userId];
  if (!user) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    authenticated: true,
    userId: user.userId,
    email: user.email,
    name: user.name,
    accountNumber: user.accountNumber,
  }));
}

async function handleDashboardData(req, res) {
  const userId = req.sessionUserId;
  const user = users[userId];
  if (!user) {
    send404(res);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    userId: user.userId,
    name: user.name,
    email: user.email,
    accountNumber: user.accountNumber,
  }));
}

async function handleLogout(req, res) {
  const cookies = req.headers.cookie || '';
  const cookiePair = cookies.split(';').find(c => c.trim().startsWith('session='));
  const sessionId = cookiePair ? cookiePair.split('=')[1].trim() : null;

  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
  }

  res.writeHead(302, {
    'Location': '/log-in/',
    'Set-Cookie': 'session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict'
  });
  res.end();
}

// ---- HTTP request router ----

const server = http.createServer(async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

    let requestPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);

    if (requestPath.length > 1 && requestPath.endsWith('/')) {
      requestPath = requestPath.slice(0, -1);
    }

    // --- Auth API routes ---

    if (requestPath === '/api/register') {
      await handleRegister(req, res);
      return;
    }

    if (requestPath === '/api/login') {
      await handleLogin(req, res);
      return;
    }

    if (requestPath === '/api/check-auth') {
      await handleCheckAuth(req, res);
      return;
    }

    if (requestPath === '/api/dashboard-data') {
      await handleDashboardData(req, res);
      return;
    }

    if (requestPath === '/api/logout') {
      await handleLogout(req, res);
      return;
    }

    // --- Legacy /RS routes ---

    if (requestPath === '/RS/UN-Display.do' || requestPath === '/RS/UN-Display') {
      sendFile(res, path.join(BASE, 'log-in', 'index.html')).catch(() => send500(res));
      return;
    }

    if (requestPath === '/RS/UN-Submit.do') {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        await handleLogin(req, res);
        return;
      }
      res.writeHead(303, {
        'Location': '/dashboard/',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      });
      res.end();
      return;
    }

    if (requestPath === '/RS/UN-AccountCreate.do' || requestPath === '/open-account') {
      sendFile(res, path.join(BASE, 'open-account', 'index.html')).catch(() => send500(res));
      return;
    }

    if (requestPath === '/dashboard/' || requestPath === '/dashboard') {
      sendFile(res, path.join(BASE, 'dashboard', 'index.html')).catch(() => send500(res));
      return;
    }

    // --- Static files ---

    const filePath = path.join(BASE, requestPath);
    const ext = path.extname(filePath);

    if (ext) {
      sendFile(res, filePath).then((ok) => {
        if (!ok) sendFile(res, path.join(BASE, 'index.html')).then((ok2) => {
          if (!ok2) send500(res);
        });
      });
    } else {
      sendFile(res, filePath).then((ok) => {
        if (!ok) {
          sendFile(res, filePath + '.html').then((ok2) => {
            if (!ok2) sendFile(res, path.join(filePath, 'index.html')).then((ok3) => {
              if (!ok3) send500(res);
            });
          });
        }
      });
    }
  } catch (err) {
    console.error('Server error:', err);
    try { send500(res); } catch (_) {}
  }
});

server.listen(PORT, () => {
  console.log(`TreasuryDirect mirror server running at http://localhost:${PORT}`);
  console.log('Auth endpoints:');
  console.log('  POST /api/register    — register new user (email/password)');
  console.log('  POST /api/login       — login, sets HttpOnly session cookie');
  console.log('  GET /api/check-auth   — check authentication status');
  console.log('  GET /api/logout     — logout, clears session cookie');
  console.log('  GET /api/dashboard-data — user data (session-authenticated)');
});