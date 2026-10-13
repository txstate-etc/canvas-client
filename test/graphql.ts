import { describe, it } from 'node:test'
import { expect } from 'chai'
import { canvasAPI } from '../src'
import { createCanvasGraphQLClient } from '../src/graphql.js'

describe('graphql', () => {
  it('should be able to get all the enrollments in a site', { timeout: 30000 }, async () => {
    const courseId = '1042050'
    const { course } = await canvasAPI.graphql(`query getEnrollments ($courseId: ID!) {
      course(id: $courseId) {
        sectionsConnection {
          nodes {
            _id
            name
          }
        }
        usersConnection {
          nodes {
            _id
            name
            sisId
          }
        }
        enrollmentsConnection {
          nodes {
            section {
              _id
            }
            user {
              _id
            }
          }
        }
      }
    }
    `, { courseId })
    expect(course.usersConnection.nodes.length).to.be.greaterThan(0)
  })

  it('should be able to query with the typed client', { timeout: 30000 }, async () => {
    const client = createCanvasGraphQLClient(canvasAPI)
    const { course } = await client.query({
      course: {
        __args: { id: '1042050' },
        _id: true,
        name: true,
        usersConnection: { __args: {}, nodes: { _id: true, name: true } }
      }
    })
    expect(course?._id).to.equal('1042050')
    expect(course?.usersConnection?.nodes?.length).to.be.greaterThan(0)
  })

  it('should fetch every page of a connection with queryAll', { timeout: 60000 }, async () => {
    const client = createCanvasGraphQLClient(canvasAPI)
    const { course } = await client.queryAll({
      course: { __args: { id: '2740812' }, name: true, usersConnection: { __args: {}, nodes: { _id: true, name: true } } }
    })
    const ids = course!.usersConnection!.nodes!.map(u => u!._id)
    expect(ids.length, 'test course needs more than one page of 100 users').to.be.greaterThan(100)
    expect(new Set(ids).size).to.equal(ids.length)
    // the fields queryAll needed for paging shouldn't leak into the result
    expect(course).to.have.all.keys('name', 'usersConnection')
    expect(course!.usersConnection).to.have.all.keys('nodes')
  })

  it('should finish nested connections with queryAll', { timeout: 120000 }, async () => {
    const client = createCanvasGraphQLClient(canvasAPI)
    const request = (first: number) => ({
      course: {
        __args: { id: '1042050' },
        assignmentsConnection: {
          __args: { first },
          nodes: { _id: true, submissionsConnection: { __args: { first }, nodes: { _id: true } } }
        }
      }
    })
    // tiny pages force queryAll to page through both the outer and inner connections
    const paged = await client.queryAll(request(2))
    const whole = await client.query(request(100))
    const summarize = (res: typeof whole) => res.course!.assignmentsConnection!.nodes!.map(a => ({ _id: a!._id, submissions: a!.submissionsConnection!.nodes!.map(s => s!._id).sort() }))
    const expected = summarize(whole)
    expect(expected.length, 'test course needs more than 2 assignments').to.be.greaterThan(2)
    expect(expected.some(a => a.submissions.length > 2), 'test course needs an assignment with more than 2 submissions').to.equal(true)
    expect(summarize(paged)).to.deep.equal(expected)
  })

  it('should page through a root-level connection with queryAll', { timeout: 60000 }, async () => {
    const client = createCanvasGraphQLClient(canvasAPI)
    const request = (first: number) => ({
      courseInstructorsConnection: { __args: { courseIds: ['2740812', '1042050'], first }, nodes: { user: { _id: true } } }
    })
    const paged = await client.queryAll(request(1))
    const whole = await client.query(request(100))
    expect(whole.courseInstructorsConnection!.nodes!.length, 'test courses need more than one instructor').to.be.greaterThan(1)
    expect(paged.courseInstructorsConnection!.nodes).to.deep.equal(whole.courseInstructorsConnection!.nodes)
  })

  it('should fetch every page of a single connection with paginate', { timeout: 60000 }, async () => {
    const client = createCanvasGraphQLClient(canvasAPI)
    const users = await client.paginate(
      after => ({ course: { __args: { id: '2740812' }, usersConnection: { __args: { first: 100, after }, nodes: { _id: true }, pageInfo: { hasNextPage: true, endCursor: true } } } }),
      res => res.course?.usersConnection
    )
    expect(users.length).to.be.greaterThan(100)
    expect(new Set(users.map(u => u._id)).size).to.equal(users.length)
  })

  // https://github.com/instructure/canvas-lms/issues/2504
  // If this starts failing, Canvas has fixed the bug and we can stop working around it.
  it('should still return a null loginId for users reached through assignment submissions', { timeout: 10000 }, async () => {
    const courseId = '1042050'
    const { course } = await canvasAPI.graphql(`query getSubmissionLogins ($courseId: ID!) {
      course(id: $courseId) {
        usersConnection {
          nodes {
            _id
            loginId
          }
        }
        assignmentsConnection {
          nodes {
            submissionsConnection {
              nodes {
                user {
                  _id
                  loginId
                }
              }
            }
          }
        }
      }
    }
    `, { courseId })
    const courseLoginIds = new Map<string, string | null>(course.usersConnection.nodes.map((u: any) => [u._id, u.loginId]))
    const submissionUsers: { _id: string, loginId: string | null }[] = course.assignmentsConnection.nodes
      .flatMap((a: any) => a.submissionsConnection.nodes.map((s: any) => s.user))
      .filter((u: any) => u != null && courseLoginIds.get(u._id) != null)
    expect(submissionUsers.length, 'test course needs submissions from users who have a loginId').to.be.greaterThan(0)
    expect(submissionUsers.filter(u => u.loginId != null).length, 'submission users with a non-null loginId').to.equal(0)
  })
})
