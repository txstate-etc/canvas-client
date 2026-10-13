export class GraphQLError extends Error {
  constructor (message: string, public errors: { [keys: string]: any, message: string }[]) {
    super(message)
  }
}

/**
 * Thrown when Canvas responds with a non-2xx status. `body` is the parsed JSON response
 * when Canvas sent JSON, otherwise the raw text.
 */
export class CanvasAPIError extends Error {
  constructor (message: string, public status: number, public method: string, public url: string, public body: any) {
    super(message)
  }
}
