# TODO for 3.x

None of these are breaking, so they can land in any 3.x release.

## Bugs

- `getall`: the fallback that follows `next` links (used when Canvas doesn't send a `last` link) does `ret.push(...res.data)` and ignores `returnObjKey`. If an endpoint that needs a key (like `/accounts/:id/terms` with `enrollment_terms`) paginates via `next`, it pushes the wrapper object instead of the array. `ret` can also be `undefined` there if the key is missing from the first page.
- `getall` sends `per_page: 1000`, but Canvas caps most endpoints at 100. It works, but it's misleading, so set it to 100.

## Nice-to-haves

- Request timeout via `AbortSignal.timeout` in `send`, so a hung Canvas connection doesn't hold a rate-limit slot forever. Make it configurable in `CanvasAPIOptions`.
- Automatic retry with backoff when Canvas returns 403 "Rate Limit Exceeded" (check the `X-Rate-Limit-Remaining` header). `CanvasAPIError.status` makes this easy to detect.
- `index.ts` creates the `canvasAPI` singleton from env vars at import time, which doesn't fit `"sideEffects": false` in package.json. Decide whether that's acceptable or whether to make it lazy.
- Responses that still aren't typed or converted: `createEnrollment` returns `any`, and `CanvasEnrollment` doesn't declare Canvas's date fields (`created_at`, `updated_at`, `last_activity_at`, etc.).
- Assignment overrides in responses keep string dates because `CanvasAssignmentOverride` is shared with the input type (`due_at: Date | string`). Split it into input and response types so responses can return `Date`.
- Term `overrides` in responses have the same problem: their `start_at`/`end_at` are typed `Date | null` but arrive as strings.

## genql `__args` quirk

genql 6.3.4 decides whether `__args` is optional by regex-matching the rendered TypeScript for a colon not preceded by `?` (`render/requestTypes/objectType.js`). When an argument's description contains a colon, like Canvas's "use `filter: {userIds}` instead", `__args` becomes required even though every argument is optional. In the current schema this affects 5 of 301 fields with args: `Course.usersConnection`, `Course.usersConnectionCount`, `Query.assignment`, `SubmissionStatistics.missingSubmissionsCount`, and `User.courseWorkSubmissionsConnection`. Passing `__args: {}` works around it. Options:

- Report it upstream to genql.
- Post-process in `genclient.sh` (fragile), or strip descriptions before generating (loses the doc comments, which are useful).
