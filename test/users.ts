import { describe, it } from 'node:test'
import { expect } from 'chai'
import { canvasAPI } from '../src'

describe('users', function () {
  it('should be able to retrieve self', async () => {
    const user = await canvasAPI.getUser()
    expect(user.id).to.be.a('number')
  })
})
