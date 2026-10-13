# TODO for 3.x

None of these are breaking, so they can land in any 3.x release.

## Nice-to-haves

- Request timeout via `AbortSignal.timeout` in `send`, so a hung Canvas connection doesn't hold a rate-limit slot forever. Make it configurable in `CanvasAPIOptions`.
- Automatic retry with backoff when Canvas returns 403 "Rate Limit Exceeded" (check the `X-Rate-Limit-Remaining` header). `CanvasAPIError.status` makes this easy to detect.
- `index.ts` creates the `canvasAPI` singleton from env vars at import time, which doesn't fit `"sideEffects": false` in package.json. Decide whether that's acceptable or whether to make it lazy.
- Responses that still aren't typed or converted: `createEnrollment` returns `any`, and `CanvasEnrollment` doesn't declare Canvas's date fields (`created_at`, `updated_at`, `last_activity_at`, etc.).
- Assignment overrides in responses keep string dates because `CanvasAssignmentOverride` is shared with the input type (`due_at: Date | string`). Split it into input and response types so responses can return `Date`.
- Term `overrides` in responses have the same problem: their `start_at`/`end_at` are typed `Date | null` but arrive as strings.

## genql `__args` quirk

genql 6.3.4 decides whether `__args` is optional by regex-matching the rendered TypeScript for a colon not preceded by `?` (`render/requestTypes/objectType.js`). When an argument's description contains a colon, like Canvas's "use `filter: {userIds}` instead", `__args` becomes required even though every argument is optional. In the current schema this affects 5 of 301 fields with args: `Course.usersConnection`, `Course.usersConnectionCount`, `Query.assignment`, `SubmissionStatistics.missingSubmissionsCount`, and `User.courseWorkSubmissionsConnection`. Passing `__args: {}` works around it.

The fix is merged upstream in https://github.com/remorses/genql/pull/202 but hasn't been released yet. Once a version after 6.3.4 is out:

- Rerun `npm run genclient`. It calls `npx @genql/cli` without a version, so check that it actually picked up the new release.
- Remove the `__args: {}` workarounds from the README examples and `test/graphql.ts`, and make sure everything still type-checks.
