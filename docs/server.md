## Server Code

Server code is handled by @tanstack/react-start. You should have access to their mcp.

Prefer separate files for server functions. There are extensive examples in the @src/functions directory.

## Database

The database access is done through `drizzle-orm`. The schema is found in the @src/db/schema directory.

When writing new queries, prefer `db.query` over `db._query` as it is deprecated. There are plenty of examples showing how `db.query` works in the codebase already. Because of this, we can ignore defining relationships through anything exported by `drizzle-orm/_relations` in the schema directory. Define relationships in @src/db/schema/relations.ts.
