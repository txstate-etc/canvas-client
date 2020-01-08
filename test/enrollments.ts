import { expect } from 'chai'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI } from '../src'

describe('enrollments', function () {
  it('should retrieve enrollments from a course', async () => {
    const courses = await canvasAPI.getUserCourses()
    const enrollments = await canvasAPI.getCourseEnrollments(courses[0].id)
    expect(enrollments).to.have.length.greaterThan(0)
    for (const enrollment of enrollments) {
      expect(enrollment.id).to.be.greaterThan(0)
      expect(enrollment.course_id).to.be.greaterThan(0)
    }
  })
})
