# TODO for 3.x

None of these are breaking, so they can land in any 3.x release.

## genql `__args` quirk

genql 6.3.4 decides whether `__args` is optional by regex-matching the rendered TypeScript for a colon not preceded by `?` (`render/requestTypes/objectType.js`). When an argument's description contains a colon, like Canvas's "use `filter: {userIds}` instead", `__args` becomes required even though every argument is optional. In the current schema this affects 5 of 301 fields with args: `Course.usersConnection`, `Course.usersConnectionCount`, `Query.assignment`, `SubmissionStatistics.missingSubmissionsCount`, and `User.courseWorkSubmissionsConnection`. Passing `__args: {}` works around it.

The fix is merged upstream in https://github.com/remorses/genql/pull/202 but hasn't been released yet. Once a version after 6.3.4 is out:

- Rerun `npm run genclient`. It calls `npx @genql/cli` without a version, so check that it actually picked up the new release.
- Remove the `__args: {}` workarounds from the README examples and `test/graphql.ts`, and make sure everything still type-checks.
