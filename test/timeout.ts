import { describe, it, mock, afterEach } from 'node:test'
import { expect } from 'chai'
import { CanvasConnector } from '../src/canvas.js'

// A Canvas that never answers, but gives up when the request is aborted the way real fetch does.
function hungCanvas () {
  const signals: (AbortSignal | undefined)[] = []
  mock.method(globalThis, 'fetch', async (_input: URL | string, init?: RequestInit) => {
    const signal = init?.signal ?? undefined
    signals.push(signal)
    return await new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener('abort', () => { reject(signal.reason) })
    })
  })
  return signals
}

describe('requestTimeout', () => {
  afterEach(() => { mock.restoreAll() })

  it('should fail a request that takes longer than the timeout', async () => {
    hungCanvas()
    const connector = new CanvasConnector('https://canvas.test', 'token', { requestTimeout: 50 })
    try {
      await connector.get('/things')
      expect.fail('request should have timed out')
    } catch (e: any) {
      expect(e.name).to.equal('TimeoutError')
    }
  })

  it('should not set a signal when no timeout is configured', async () => {
    const signals = hungCanvas()
    void new CanvasConnector('https://canvas.test', 'token').get('/things')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(signals).to.deep.equal([undefined])
  })
})
