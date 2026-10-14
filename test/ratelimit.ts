import { describe, it, mock, afterEach } from 'node:test'
import { expect } from 'chai'
import { CanvasConnector } from '../src/canvas.js'
import { CanvasAPIError } from '../src/utils/errors.js'

// Canvas throttles with a 403 and a plain text body, then serves the request normally once the
// bucket refills. `throttled` is how many requests get turned away before that happens.
function throttledCanvas (throttled: number, method = 'GET') {
  let calls = 0
  mock.method(globalThis, 'fetch', async () => {
    calls++
    if (calls <= throttled) {
      return new Response(method === 'HEAD' ? null : '403 Forbidden (Rate Limit Exceeded)\n', { status: 403, headers: { 'X-Rate-Limit-Remaining': '0.0' } })
    }
    return new Response(method === 'HEAD' ? null : JSON.stringify({ id: '1' }), { headers: { 'X-Rate-Limit-Remaining': '600.0' } })
  })
  return () => calls
}

describe('rate limit backoff', () => {
  afterEach(() => { mock.restoreAll() })

  it('should retry after Canvas says the rate limit was exceeded', async () => {
    const calls = throttledCanvas(2)
    const connector = new CanvasConnector('https://canvas.test', 'token')
    expect(await connector.get('/things')).to.deep.equal({ id: '1' })
    expect(calls()).to.equal(3)
  })

  it('should recognize throttling on HEAD requests, which have no body', async () => {
    const calls = throttledCanvas(1, 'HEAD')
    const connector = new CanvasConnector('https://canvas.test', 'token')
    expect(await connector.head('/things')).to.equal(true)
    expect(calls()).to.equal(2)
  })

  it('should give up after rateLimitRetries', async () => {
    const calls = throttledCanvas(10)
    const connector = new CanvasConnector('https://canvas.test', 'token', { rateLimitRetries: 1 })
    try {
      await connector.get('/things')
      expect.fail('request should have failed')
    } catch (e: any) {
      expect(e).to.be.instanceOf(CanvasAPIError)
      expect(e.status).to.equal(403)
    }
    expect(calls()).to.equal(2)
  })

  it('should not retry a 403 that is not about rate limiting', async () => {
    let calls = 0
    mock.method(globalThis, 'fetch', async () => {
      calls++
      return new Response(JSON.stringify({ status: 'unauthorized', errors: [{ message: 'user not authorized to perform that action' }] }), { status: 403, headers: { 'X-Rate-Limit-Remaining': '600.0' } })
    })
    try {
      await new CanvasConnector('https://canvas.test', 'token').get('/things')
      expect.fail('request should have failed')
    } catch (e: any) {
      expect(e.status).to.equal(403)
    }
    expect(calls).to.equal(1)
  })
})
