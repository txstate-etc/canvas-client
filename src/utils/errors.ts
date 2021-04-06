export class GraphQLError extends Error {
  constructor (message: string, public errors: { [keys: string]: any, message: string }[]) {
    super(message)
  }
}
