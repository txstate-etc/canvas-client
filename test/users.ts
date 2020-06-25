import { expect } from 'chai'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI } from '../src'

describe('users', function () {
  it('should be able to retrieve self', async () => {
    const user = await canvasAPI.getUser()
    expect(user.id).to.be.a('number')
  })
})
