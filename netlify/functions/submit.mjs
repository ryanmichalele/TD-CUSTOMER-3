const verifyURL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export const handler = async (event) => {
  const params = new URLSearchParams(event.body || '')
  const token = params.get('cf-turnstile-response')
  const secretKey = process.env.TURNSTILE_SECRET

  if (!secretKey) {
    return { statusCode: 500, body: 'Turnstile secret is not configured' }
  }

  if (!token) {
    return { statusCode: 400, body: 'Missing Turnstile token' }
  }

  const body = new URLSearchParams({
    secret: secretKey,
    response: token
  })

  const result = await fetch(verifyURL, {
    method: 'POST',
    body
  }).then(r => r.json())

  if (!result.success) {
    return { statusCode: 403, body: 'Verification failed' }
  }

  return {
    statusCode: 303,
    headers: { Location: '/dashboard/', 'Cache-Control': 'no-store' },
    body: ''
  }
}
