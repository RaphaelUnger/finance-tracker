# Finance Tracker (app)

Small dev README for the app folder.

Scripts
- `npm test` — run the unit and integration tests
- `npm run typecheck` — run TypeScript check
- `node app/bin/cli.js ...` — run the simple CLI for manual transaction operations

CLI usage examples
- Create: `node app/bin/cli.js create my-id 1000 2025-06-01 Food Cafe "Lunch"`
- Update: `node app/bin/cli.js update my-id amount 1200`
- Delete: `node app/bin/cli.js delete my-id`
- List: `node app/bin/cli.js list`
