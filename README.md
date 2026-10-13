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
Canvas has a GraphQL API that is often far more efficient than REST, since one request can pull a course, its sections, users, and enrollments. GraphQL requests get the same token splitting and rate limiting as RESTful requests, sharing the same tokens and limits.

The simplest way in is the `graphql` method. It accepts a generic for the response type, but you'll have to write that type yourself and keep it in sync with your query:
```typescript
const { course } = await canvasAPI.graphql<{ course: { name: string } }>(`query getCourse ($courseId: ID!) {
  course(id: $courseId) { name }
}`, { courseId: '12345' })
```

Writing those interfaces by hand gets old fast, so there's also a fully typed client generated with [genql](https://genql.dev). You select fields with an object instead of a query string, and the response type follows from whatever you selected:
```typescript
import { createCanvasGraphQLClient } from 'canvas-client/graphql'

const client = createCanvasGraphQLClient(canvasAPI)
const { course } = await client.query({
  course: {
    __args: { id: '12345' },
    name: true,
    usersConnection: { __args: {}, nodes: { _id: true, name: true } }
  }
})
// course?.usersConnection?.nodes is ({ _id: string, name: string | null } | null)[] | null
// Canvas marks most things nullable, so expect a lot of optional chaining
```
It lives in its own `canvas-client/graphql` export because the generated schema is large, and I didn't want everyone else paying for it in their bundles.

### Pagination
That example has a problem you won't notice until it bites you. Canvas paginates every connection, and when you don't pass `first`, it quietly hands back the first 20 items with no error. Passing `first` only gets you to 100, which is the most Canvas will return in one page. So a course with 240 students gives you 20 of them, and nothing tells you so.

Following `pageInfo.endCursor` yourself is tedious, and it gets genuinely painful when connections are nested, like submissions inside assignments. So the client has a `queryAll` method. It takes the same request as `query`, returns the same type, and every connection in the response comes back complete:
```typescript
const { course } = await client.queryAll({
  course: {
    __args: { id: '12345' },
    usersConnection: { __args: {}, nodes: { _id: true, name: true } },
    assignmentsConnection: {
      nodes: { _id: true, submissionsConnection: { nodes: { _id: true, score: true } } }
    }
  }
})
// all 240 users, every assignment, and every submission for each assignment
```
Pages are 100 items unless you pass `first` yourself, in which case your value is the page size. It's not a limit, so `first: 10` still gets you everything, just 10 at a time. To continue a connection, `queryAll` comes back to its parent with `node(id: ...)`, so the parent has to implement Canvas's Node interface. Almost everything does, and if yours doesn't you'll get an error saying so.

Every extra page is its own request. A course with 50 assignments that each need a second page of submissions means 50 more requests. They're rate-limited like everything else, so this won't hurt Canvas, but it can take a while.

When you need to page through one connection by hand (say its parent isn't a Node), there's also `paginate`. You build the request for a given cursor and point at the connection, and it returns all the nodes:
```typescript
const users = await client.paginate(
  after => ({ course: { __args: { id: '12345' }, usersConnection: { __args: { first: 100, after }, nodes: { _id: true }, pageInfo: { hasNextPage: true, endCursor: true } } } }),
  res => res.course?.usersConnection
)
```

### Note about schema drift
Every hosted Canvas instance runs the same release, so the types fit yours too, but they're a snapshot from the day we generated them. Instructure adds to the schema with nearly every release, so a brand new field might not be in the types yet. If you need one before we regenerate, use the `graphql` method for that query.

# Testing
Duplicate `.env.example`, rename it to `.env` and fill in good values for each of the variables. This will allow you to run `npm test` successfully, and `npm run genclient` to regenerate `src/typed-client` from your Canvas instance's schema. Never hand-edit `src/typed-client`, since it's overwritten on every run. The tokens should belong to a user (not a service account) who is teaching at least one course and is allowed to create enrollment terms, since many of the tests depend on that.

# 2.0
The breaking change for 2.0 is node 18+ is required since I got rid of axios in favor of the native fetch api.

# 3.0
Canvas ids are now strings instead of numbers. When you have a trust relationship with another Canvas instance, users from that instance show up with ids like `10690000000012345`, which is bigger than `Number.MAX_SAFE_INTEGER`. JSON.parse silently rounds those, so you'd end up talking to Canvas about a user who doesn't exist. Canvas will send ids as strings if you ask nicely with an `Accept: application/json+canvas-string-ids` header, so now every request does that.

Anywhere you pass an id into the client, a number is still accepted (the `CanvasIDInput` type), so most calling code keeps compiling. What will break is anything that treats an id from a response as a number: arithmetic, sorting numerically, comparing with `===` against a number, or a `Map<number, ...>` keyed by id.

Dates in responses are now always `Date` objects. Before, the types promised `Date` everywhere but only a few methods actually converted, so you might have been calling `new Date()` on something that was already a string. A date Canvas leaves empty is now `undefined` instead of `null`, which matters most for enrollment terms: the Default Term used to come back with a `start_at` of January 1, 1970, and now it comes back `undefined`. Dates you pass in query params (like `starts_before`) are now sent as ISO strings, before they were silently dropped.

When Canvas responds with an error, you now get a `CanvasAPIError` with `status`, `method`, `url`, and `body` (parsed JSON when Canvas sent JSON), so you can tell a 404 from a 401 without parsing the message:
```typescript
try {
  await canvasAPI.getUser('sis_user_id:A00123456')
} catch (e) {
  if (e instanceof CanvasAPIError && e.status === 404) return undefined // no such user
  throw e
}
```
Related to that, the `sectionExists` family used to return false for any failure, so a bad token looked exactly like a missing section. Now only a 404 returns false and anything else throws.

Node 22 or newer is required.
