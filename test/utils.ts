import { describe, it } from 'node:test'
import { expect } from 'chai'
import { stringifyParams } from '../src/utils/utils.js'

describe('utils', function () {
  it('should send dates in query strings as ISO strings', () => {
    const date = new Date('2026-01-15T12:00:00Z')
    expect(stringifyParams({ starts_before: date, filter: { since: date } }))
      .to.equal('?starts_before=2026-01-15T12%3A00%3A00.000Z&filter%5Bsince%5D=2026-01-15T12%3A00%3A00.000Z')
  })
})
