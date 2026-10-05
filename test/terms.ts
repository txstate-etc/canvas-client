import { describe, it } from 'node:test'
import { expect } from 'chai'
import { canvasAPI } from '../src'

describe('terms', function () {
  it('should retrieve enrollment terms from the root account', async () => {
    const terms = await canvasAPI.getEnrollmentTerms()
    for (const term of terms) {
      expect(term.id).to.match(/^[1-9][0-9]*$/)
      expect(term.created_at).to.be.a('date')
    }
  })
  it('should be able to create a new term', async () => {
    const term = await canvasAPI.createEnrollmentTerm(undefined, {
      enrollment_term: {
        name: `Test Term ${Math.random().toString(32)}`,
        start_at: new Date(),
        end_at: new Date()
      }
    })
    expect(term?.id).to.match(/^[1-9][0-9]*$/)
    expect(term?.start_at).to.be.a('date')
    expect(term?.end_at).to.be.a('date')
  })
})
