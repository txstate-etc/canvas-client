import { expect } from 'chai'
import { CanvasEnrollmentShortType } from '../src/interfaces'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI } from '../src'

describe('courses', function () {
  this.timeout(20000)
  it('should retrieve user current courses', async () => {
    const courses = await canvasAPI.getUserCourses()
    expect(courses).to.have.length.greaterThan(0)
  })
  it('should retrieve more than 100 courses in the root account', async () => {
    // this is probably not a great test for the long term... once we have term data populating
    // we should be able to filter by an old term id to keep the list predictable
    const courses = await canvasAPI.getCourses(undefined, { enrollment_type: [CanvasEnrollmentShortType.student] })
    expect(courses).to.have.length.greaterThan(100)
  })
})
