import { expect } from 'chai'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI, CanvasAssignment, CanvasCourse, CanvasEnrollmentShortType } from '../src'

describe('assignments', function () {
  let selfcourse: CanvasCourse
  it('requires the user to have a course they are teaching', async () => {
    const courses = await canvasAPI.getUserCourses('self', { roles: [CanvasEnrollmentShortType.teacher] })
    expect(courses).to.have.length.greaterThan(0)
    selfcourse = courses[0]
  })

  let newAssignment: CanvasAssignment
  it('should be able to create a new assignment with minimal details for a course the user is teaching', async () => {
    newAssignment = await canvasAPI.createCourseAssignment(selfcourse.id, {
      name: 'assignment created during canvas-client automated testing'
    })
    expect(newAssignment?.id).to.be.greaterThan(0)
  })

  it('should be able to retrieve the newly created assignment', async () => {
    const createdAssignment = await canvasAPI.getCourseAssignment(selfcourse.id, newAssignment.id)
    expect(createdAssignment?.id).to.equal(newAssignment.id)
    expect(createdAssignment.created_at).to.be.a('Date')
  })

  it('should be able to retrieve list of assignments for a course user is teaching', async () => {
    const courseAssignments = await canvasAPI.getCourseAssignments(selfcourse.id)
    expect(courseAssignments).to.have.length.greaterThan(0)
  })

  it('should be able to delete the newly created assignment', async () => {
    const deletedAssignment = await canvasAPI.deleteCourseAssignment(selfcourse.id, newAssignment.id)
    expect(deletedAssignment).to.have.property('workflow_state', 'deleted')
  })

  const integrationDetails = {
    integration_id: '1234567',
    integration_data: {
      testField1: true,
      testField2: 'a string',
      testField3: 1234
    }
  }

  let myAssignment: CanvasAssignment
  it('should be able to create a new assignment with integration details', async () => {
    myAssignment = await canvasAPI.createCourseAssignment(selfcourse.id, {
      name: 'assignment#2 created during canvas-client automated testing',
      ...integrationDetails
    })
  })

  it('should be able to retrieve the assignment with integration details', async () => {
    const myCreatedAssignment = await canvasAPI.getCourseAssignment(selfcourse.id, myAssignment.id)
    expect(myCreatedAssignment?.id).to.equal(myAssignment.id)
    expect(myCreatedAssignment?.name).to.contain('assignment#2')
    expect(myCreatedAssignment?.integration_id).to.equal(integrationDetails.integration_id)
    expect(myCreatedAssignment?.integration_data).to.deep.equal(integrationDetails.integration_data)
  })

  it('should be able to delete the assignment that contains integration details', async () => {
    const deletedAssignment = await canvasAPI.deleteCourseAssignment(selfcourse.id, myAssignment.id)
    expect(deletedAssignment).to.have.property('workflow_state', 'deleted')
  })
})
