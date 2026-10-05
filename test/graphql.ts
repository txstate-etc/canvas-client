import { describe, it } from 'node:test'
import { expect } from 'chai'
import { canvasAPI } from '../src'

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
