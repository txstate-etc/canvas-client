/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI, CanvasAssignment, CanvasAssignmentSubmissionType, CanvasCourse, CanvasEnrollmentShortType, CanvasUpdateGradeRecord, CanvasUser } from '../src'

describe('grades', function () {
  let course: CanvasCourse
  it('requires the user to have a course they are teaching', async () => {
    const courses = await canvasAPI.getUserCourses('self', { roles: [CanvasEnrollmentShortType.teacher] })
    expect(courses).to.have.length.greaterThan(0)
    course = courses[0]
  })

  let assignment: CanvasAssignment
  it('should be able to publish a new assignment for grades', async () => {
    /*
    The use of PUBLISHED_BASEURL below isn't strictly necessary,
    but it's useful to use a valid URL for the assignment, otherwise
    the canvas UI will error out when you attempt to view the assignment.
    If this isn't set, or is set to something bogus, tests will still
    pass, but it might be annoying if you're playing with the results of
    these tests in the canvas test instance.
    */
    assignment = await canvasAPI.createCourseAssignment(course.id, {
      assignment: {
        name: 'assignment#3 created during canvas-client automated testing of grades',
        published: true,
        submission_types: [CanvasAssignmentSubmissionType.external_tool],
        external_tool_tag_attributes: {
          url: `${process.env.PUBLISHED_BASEURL ?? 'http://localhost'}/api/lti`,
          new_tab: false
        }
      }
    })
  })

  it('requires the user to have an assignment on their course', async () => {
    const assignments = await canvasAPI.getCourseAssignments(course.id)
    expect(assignments).to.be.an('array').with.length.greaterThan(0)
    assignment = assignments.find(a => a.name?.match(/^assignment#3/)) ?? assignments[0]
    expect(assignment?.id).to.be.greaterThan(0)
    expect(assignment).to.have.property('course_id', course.id)
  })

  let courseUsers: CanvasUser[]
  it('should be able to update grades for the newly created assignment', async () => {
    courseUsers = await canvasAPI.getCourseUsers(course.id, { enrollment_type: [CanvasEnrollmentShortType.student] })
    const gradeData: { [keys: string]: CanvasUpdateGradeRecord } = {}
    for (const user of courseUsers) {
      gradeData[user.id] = { posted_grade: `${5 * Math.floor(Math.random() * 20)}%` }
    }
    const gradePromise = await canvasAPI.updateGrades(course.id, assignment.id, gradeData)
    expect(gradePromise).to.have.property('workflow_state')
  })
})
