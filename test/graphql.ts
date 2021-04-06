import { expect } from 'chai'
import dotenv from 'dotenv'
dotenv.config()
// eslint-disable-next-line import/first
import { canvasAPI } from '../src'

describe('graphql', () => {
  it('should be able to get all the enrollments in a site', async () => {
    const courseId = '1638648'
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
  }).timeout(5000)
})
