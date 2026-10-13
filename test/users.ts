import { describe, it } from 'node:test'
import assert from 'node:assert'
import { expect } from 'chai'
import { canvasAPI, CanvasAPIError } from '../src'

describe('users', function () {
  it('should be able to retrieve self', async () => {
    const user = await canvasAPI.getUser()
    expect(user.id).to.be.a('string').and.match(/^[1-9][0-9]*$/)
  })
  it('should throw a CanvasAPIError with the status when a user does not exist', async () => {
    await assert.rejects(canvasAPI.getUser('sis_user_id:this-user-does-not-exist'), (e: any) => e instanceof CanvasAPIError && e.status === 404)
  })
})
