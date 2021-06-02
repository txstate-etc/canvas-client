/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI, CanvasAssignment, CanvasAssignmentGradingType, CanvasAssignmentSubmissionType, CanvasCourse, CanvasEnrollmentShortType } from '../src'

describe('grades', function () {
  let course: CanvasCourse
  it('requires the user to have a course they are teaching', async () => {
    const courses = await canvasAPI.getUserCourses('self', { roles: [CanvasEnrollmentShortType.teacher] })
    expect(courses).to.have.length.greaterThan(0)
    course = courses[0]
  })

  const assignmentName = 'assignment created during canvas-client automated testing of grade submissions'

  it('should be able to clean up any assignments created during previous test runs', async () => {
    try {
      const assignments = await canvasAPI.getCourseAssignments(course.id)
      if (assignments?.length) {
        for (const assignment of assignments) {
          if (assignment.name === assignmentName) {
            await canvasAPI.deleteCourseAssignment(course.id, assignment.id)
          }
        }
      }
    } catch (e) {
      console.error('Exception encountered during old assignment cleanup', e)
    }
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

    It also seems that points_possible is required, in order to record a grade.
    */
    assignment = await canvasAPI.createCourseAssignment(course.id, {
      name: assignmentName,
      published: true,
      points_possible: 100,
      grading_type: CanvasAssignmentGradingType.percent,
      submission_types: [CanvasAssignmentSubmissionType.external_tool],
      external_tool_tag_attributes: {
        url: `${process.env.PUBLISHED_BASEURL ?? 'http://localhost'}/api/lti`,
        new_tab: false
      }
    })
  })

  it('requires the user to have an assignment on their course', async () => {
    const assignments = await canvasAPI.getCourseAssignments(course.id)
    expect(assignments).to.be.an('array').with.length.greaterThan(0)

    // we already assigned the response from assignment creation, so this
    // is just re-fetching it to ensure it's able to fetch it after creation.
    const createdAssignmentId = assignment.id
    assignment = await canvasAPI.getCourseAssignment(course.id, createdAssignmentId)
    expect(assignment).to.have.property('id', createdAssignmentId)
    expect(assignment).to.have.property('course_id', course.id)
  })

  it('should be able to update grades for the newly created assignment', async () => {
    const students = await canvasAPI.getGradeableStudents(course.id, assignment.id)
    expect(students).to.have.length.greaterThan(0, `No gradeable students found for assignment_id ${assignment.id}`)

    for (const user of students) {
      // between 5% and 95%
      const postedGrade = `${5 + 5 * Math.floor(Math.random() * 19)}%`

      // post the grade
      try {
        const submission = await canvasAPI.updateAssignmentSubmission({
          course_id: course.id,
          assignment_id: assignment.id,
          user_id: user.id,
          posted_grade: postedGrade
        })

        // if something went wrong, this will almost certainly not be set to 'graded'
        expect(submission).to.have.property('workflow_state', 'graded')

        // fetch assignment submission data, and verify grade matches what we sent
        const fetchedSubmission = await canvasAPI.getAssignmentSubmission(course.id, assignment.id, user.id)

        expect(fetchedSubmission).to.have.property('grade', postedGrade)
      } catch (e) {
        console.error('Failed to update assignment submission', e)
        expect.fail(`Failed to update assignment submission (user_id:${user.id},course_id:${course.id},assignment_id:${assignment.id},grade:${postedGrade})`)
      }
    }
  }).timeout(10000)
})
