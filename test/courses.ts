import { expect } from 'chai'
import { type CanvasCourse, CanvasEnrollmentShortType } from '../src/interfaces'
import { DateTime } from 'luxon'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI } from '../src'

describe('courses', function () {
  it('should retrieve user current courses', async () => {
    const courses = await canvasAPI.getUserCourses()
    expect(courses).to.have.length.greaterThan(0)
  })
  let selfcourse: CanvasCourse
  it('should retrieve current courses that a user is teaching', async () => {
    const courses = await canvasAPI.getUserCourses('self', { roles: [CanvasEnrollmentShortType.teacher] })
    expect(courses).to.have.length.greaterThan(0)
    selfcourse = courses[0]
    for (const course of courses) {
      expect(course.enrollments).to.have.length.greaterThan(0)
      expect((course.enrollments ?? []).map(e => e.type)).to.include(CanvasEnrollmentShortType.teacher)
    }
  })
  it('should retrieve course users', async () => {
    const users = await canvasAPI.getCourseUsers(selfcourse.id)
    expect(users).to.have.length.greaterThan(0)
  })
  it('should retrieve more than 100 courses in the root account', async () => {
    const now = DateTime.local()
    const lastspring = DateTime.fromObject({ year: now.month < 3 ? now.year - 1 : now.year, month: 3, day: 10, hour: 12, minute: 0, second: 0 })
    const term = await canvasAPI.getEnrollmentTermCurrent(lastspring.toJSDate())
    expect(term?.id).to.be.greaterThan(0)
    const courses = await canvasAPI.getCourses(undefined, {
      enrollment_type: [CanvasEnrollmentShortType.student],
      enrollment_term_id: term!.id
    })
    expect(courses).to.have.length.greaterThan(100)
  }).timeout(45000)
})
