# canvas-client
Typescript library to make accessing the Canvas API more convenient.

# Features
## Typescript
The canvas client provided by this library has a lot of pre-built methods where we have carefully observed the behavior of the Canvas RESTful API and provided types that accurately reflect what it accepts and returns. The pre-built methods are not complete but they should cover the most common endpoints for server-to-server integrations like course, user, and assignment management.

## Rate-limiting and token-splitting
Canvas rate-limits incoming requests to about 20 simultaneous requests per account. This can be rather problematic if you are performing server-to-server operations on behalf of the entire campus via a single service account. This library's solution is two-fold:
* Rate-limit on the client side to ensure canvas never gets overloaded. This way requests to Canvas never fail simply for rate-limiting.
  * The default client-side rate limit is a conservative 10 simultaneous requests. It's configurable. If multiple instances of your app share the same token, you may want to reduce this number.
* Support multiple tokens (each MUST come from a separate user account) and load-balance requests across the tokens. This increases your total capacity.
  * Note that if you run multiple instances, you STILL want to reduce the max simultaneous requests per token, to avoid getting errors when you have a backlog of requests overwhelming the capacity of your tokens.

## GraphQL
We've provided a very simple method for making queries against Canvas' GraphQL API. It only takes care of the fundamentals of GraphQL. We do not provide types for
graphql queries, but the `graphql` method does accept a generic so that you can provide the expected return type yourself. GraphQL requests also benefit from token splitting and rate limiting. Tokens and rate limits are shared with RESTful requests.

# Testing
Duplicate `.env.example`, rename it to `.env` and fill in good values for each of the variables. This will allow you to run `npm test` successfully.

# 2.0
The breaking change for 2.0 is node 18+ is required since I got rid of axios in favor of the native fetch api.
