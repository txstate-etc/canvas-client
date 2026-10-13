import { describe, it, mock, afterEach } from 'node:test'
import { expect } from 'chai'
import { CanvasConnector } from '../src/canvas.js'

// Canvas decides per endpoint whether to send a `last` link, so we fake the responses to make sure
// both styles of pagination get exercised.
function fakeCanvas (pages: any[], withLast: boolean) {
  const requested: URL[] = []
  mock.method(globalThis, 'fetch', async (input: URL | string) => {
    const url = new URL(input)
    requested.push(url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const link = (p: number, rel: string) => `<https://canvas.test/api/v1/things?page=${p}&per_page=100>; rel="${rel}"`
    const links = [link(1, 'first')]
    if (page < pages.length) links.push(link(page + 1, 'next'))
    if (withLast) links.push(link(pages.length, 'last'))
    return new Response(JSON.stringify(pages[page - 1]), { headers: { link: links.join(',') } })
  })
  return requested
}

describe('getall', () => {
  afterEach(() => { mock.restoreAll() })

  it('should follow next links for endpoints that wrap their results in a key', async () => {
    fakeCanvas([{ enrollment_terms: [{ id: '1' }, { id: '2' }] }, { enrollment_terms: [{ id: '3' }] }], false)
    const connector = new CanvasConnector('https://canvas.test', 'token')
    expect(await connector.getall('/things', {}, 'enrollment_terms')).to.deep.equal([{ id: '1' }, { id: '2' }, { id: '3' }])
  })

  it('should fetch every page up to the last link', async () => {
    fakeCanvas([[{ id: '1' }], [{ id: '2' }], [{ id: '3' }]], true)
    const connector = new CanvasConnector('https://canvas.test', 'token')
    expect(await connector.getall('/things')).to.deep.equal([{ id: '1' }, { id: '2' }, { id: '3' }])
  })

  it('should return an empty array when the key is missing', async () => {
    fakeCanvas([{}], false)
    const connector = new CanvasConnector('https://canvas.test', 'token')
    expect(await connector.getall('/things', {}, 'enrollment_terms')).to.deep.equal([])
  })

  it('should ask for 100 per page, since that is the most Canvas will send', async () => {
    const requested = fakeCanvas([[]], false)
    await new CanvasConnector('https://canvas.test', 'token').getall('/things')
    expect(requested[0].searchParams.get('per_page')).to.equal('100')
  })
})
