import { type CanvasAPI } from './canvas.js'
import { createClient } from './typed-client/index.js'
export * from './typed-client/index.js'

/**
 * Create a typed GraphQL client for Canvas. Requests go through the given CanvasAPI's graphql
 * method, so they share its tokens and rate limits with RESTful requests.
 */
export function createCanvasGraphQLClient (api: CanvasAPI) {
  return createClient({
    fetcher: async operation => {
      if (Array.isArray(operation)) throw new Error('Batching not supported')
      return { data: await api.graphql(operation.query, operation.variables) }
    }
  })
}
