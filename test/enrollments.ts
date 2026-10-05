import { describe, it } from 'node:test'
import { expect } from 'chai'
import { canvasAPI, CanvasEnrollmentType } from '../src'

describe('enrollments', function () {
  it('should retrieve enrollments from a course', async () => {
    const courses = await canvasAPI.getUserCourses()
    const courseId = courses[0].id
    const enrollments = await canvasAPI.getCourseEnrollments(courseId)
    expect(enrollments).to.have.length.greaterThan(0)
    for (const enrollment of enrollments) {
      expect(enrollment.id).to.match(/^[1-9][0-9]*$/)
      expect(enrollment.course_id).to.equal(courseId)
    }
  })
  it('should retrieve more than 100 enrollments from a section', { timeout: 30000 }, async () => {
    const enrollments = await canvasAPI.getSectionEnrollmentsBySIS('202130.30375')
    expect(enrollments).to.have.length.greaterThan(100)
    for (const enrollment of enrollments) {
      expect(enrollment.id).to.match(/^[1-9][0-9]*$/)
      expect(enrollment.course_id).to.match(/^[1-9][0-9]*$/)
    }
  })
  it('should retrieve enrollments from a user', async () => {
    const enrollments = await canvasAPI.getUserEnrollments('self')
    expect(enrollments).to.have.length.greaterThan(0)
  })
  it('should retrieve teacher enrollments for a user', async () => {
    const enrollments = await canvasAPI.getUserEnrollments('self', { roles: [CanvasEnrollmentType.Teacher] })
    expect(enrollments).to.have.length.greaterThan(0)
    for (const enrollment of enrollments) {
      expect(enrollment.type).to.equal(CanvasEnrollmentType.Teacher)
    }
  })
})
