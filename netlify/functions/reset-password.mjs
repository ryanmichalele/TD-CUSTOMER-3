import bcrypt from 'bcryptjs';

const PROJECT_ID = 'egk3glqj';
const DATASET = 'production';
const TOKEN = process.env.SANITY_API_TOKEN;

async function patch(email, plainPassword) {
  const q = encodeURIComponent(`*[_type == "accountHolder" && email == "${email}"][0]._id`);
  const res = await fetch(`https://${PROJECT_ID}.api.sanity.io/v2021-06-07/data/query/${DATASET}?query=${q}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = await res.json();
  const id = data.result;
  if (!id) return { ok: false, error: 'no user found' };

  const hash = await bcrypt.hash(plainPassword, 12);
  const body = JSON.stringify({ set: { plainPassword, passwordHash: hash } });
  const mut = await fetch(`https://${PROJECT_ID}.api.sanity.io/v2021-06-07/data/mutate/${DATASET}?mutationId=rp${Date.now()}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body,
  });
  const mutData = await mut.json();
  if (!mut.ok) return { ok: false, error: JSON.stringify(mutData) };
  return { ok: true, id };
}

const email = process.argv[2];
const pw = process.argv[3];
if (!email || !pw) {
  console.log('Usage: node reset-password.mjs <email> <newPassword>');
  process.exit(1);
}
const r = await patch(email, pw);
console.log(r.ok ? `Updated ${r.id}` : `FAILED: ${r.error}`);