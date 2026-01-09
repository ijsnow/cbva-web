# Permissions Middleware

This document explains how to use the permissions middleware system to protect server functions and routes.

## Overview

The permissions middleware system provides two main functions:

1. **`requirePermissions()`** - Check if a user has specific resource-action permissions
2. **`requireRole()`** - Check if a user has one of the specified roles

Both middleware functions work with TanStack React Start's `createServerFn()` and automatically integrate with the existing `authMiddleware`.

## Available Roles

- `user` - Regular user with read-only access
- `td` - Tournament Director with tournament creation and update permissions
- `admin` - Administrator with full access to most resources
- `superadmin` - Super administrator (defined in database schema)

## Available Permissions

Permissions are defined in `/src/auth/permissions.ts`:

```typescript
{
  tournament: ["create", "update", "delete"],
  venues: ["create", "update", "delete"],
  content: ["update"],
  // ... and default admin permissions
}
```

---

## `requirePermissions()` Middleware

### Basic Usage

```typescript
import { createServerFn } from "@tanstack/react-start"
import { authMiddleware, requirePermissions } from "@/auth/shared"

export const createTournamentFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, requirePermissions({ tournament: ["create"] })])
  .handler(async ({ context, data }) => {
    // User is guaranteed to have tournament:create permission
    // context.viewer is available and typed
    console.log(`Creating tournament for user: ${context.viewer.id}`)

    // Your logic here
  })
```

### Multiple Permissions

```typescript
export const updateTournamentFn = createServerFn({ method: "POST" })
  .middleware([
    authMiddleware,
    requirePermissions({ tournament: ["update", "delete"] }),
  ])
  .handler(async ({ context }) => {
    // User must have BOTH tournament:update AND tournament:delete
  })
```

### Custom Error Messages

```typescript
export const deleteContentFn = createServerFn({ method: "POST" })
  .middleware([
    authMiddleware,
    requirePermissions(
      { content: ["delete"] },
      {
        onUnauthorized:
          "You do not have permission to delete content. Please contact an administrator.",
      }
    ),
  ])
  .handler(async ({ context }) => {
    // User has content:delete permission
  })
```

### Custom Error Handler

```typescript
export const sensitiveOperationFn = createServerFn({ method: "POST" })
  .middleware([
    authMiddleware,
    requirePermissions(
      { tournament: ["delete"] },
      {
        onUnauthorized: (viewer) => {
          // viewer could be undefined if not authenticated
          if (!viewer) {
            return new Error("You must be logged in to perform this action")
          }
          return new Error(
            `User ${viewer.id} with role ${viewer.role} attempted unauthorized deletion`
          )
        },
      }
    ),
  ])
  .handler(async ({ context }) => {
    // Your logic here
  })
```

### Allow Unauthenticated Users (Optional)

```typescript
export const publicButRestrictedFn = createServerFn({ method: "GET" })
  .middleware([
    authMiddleware,
    requirePermissions(
      { tournament: ["create"] },
      { requireAuth: false } // Won't throw 401 for anonymous users
    ),
  ])
  .handler(async ({ context }) => {
    if (!context.viewer) {
      // Handle anonymous user case
      return { limited: true }
    }
    // Handle authenticated user with permissions
    return { full: true }
  })
```

---

## `requireRole()` Middleware

### Basic Usage

```typescript
import { createServerFn } from "@tanstack/react-start"
import { authMiddleware, requireRole } from "@/auth/shared"

export const adminOnlyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, requireRole(["admin"])])
  .handler(async ({ context }) => {
    // User is guaranteed to be an admin
    console.log(`Admin ${context.viewer.id} performed action`)
  })
```

### Multiple Roles

```typescript
export const tournamentManagementFn = createServerFn({ method: "POST" })
  .middleware([
    authMiddleware,
    requireRole(["admin", "td"]), // User must be either admin OR td
  ])
  .handler(async ({ context }) => {
    // User is either admin or tournament director
    if (context.viewer.role === "admin") {
      // Admin-specific logic
    } else {
      // TD-specific logic
    }
  })
```

### Custom Error Message

```typescript
export const superAdminOnlyFn = createServerFn({ method: "POST" })
  .middleware([
    authMiddleware,
    requireRole(["admin"], {
      onUnauthorized: "This action requires administrator privileges",
    }),
  ])
  .handler(async ({ context }) => {
    // Admin-only logic
  })
```

---

## HTTP Status Codes

The middleware automatically sets appropriate HTTP status codes:

- **401 Unauthorized** - User is not authenticated (when `requireAuth: true`)
- **403 Forbidden** - User is authenticated but lacks required permissions/role

---

## Route-Level Protection

You can also protect routes using the `loader` function:

```typescript
// src/routes/admin/dashboard.tsx
import { createFileRoute, redirect } from "@tanstack/react-router"
import { viewerQueryOptions, roleHasPermission } from "@/auth/shared"

export const Route = createFileRoute("/admin/dashboard")({
  loader: async ({ context: { queryClient } }) => {
    const viewer = await queryClient.ensureQueryData(viewerQueryOptions())

    // Check if user is admin
    if (!viewer || viewer.role !== "admin") {
      throw redirect({ to: "/not-found" })
    }

    // Or check specific permissions
    const canManageContent = roleHasPermission(viewer.role, {
      content: ["update"],
    })

    if (!canManageContent) {
      throw redirect({ to: "/unauthorized" })
    }
  },
  component: AdminDashboard,
})
```

---

## Real-World Examples

### Example 1: Tournament Creation

```typescript
// src/data/tournaments/create.ts
import { createServerFn } from "@tanstack/react-start"
import { authMiddleware, requirePermissions } from "@/auth/shared"
import { createTournamentSchema } from "@/db/schema"

export const createTournamentFn = createServerFn({ method: "POST" })
  .inputValidator(createTournamentSchema)
  .middleware([authMiddleware, requirePermissions({ tournament: ["create"] })])
  .handler(async ({ context, data }) => {
    // Only users with tournament:create permission can reach here
    // Admin and TD roles have this permission

    const tournament = await db.insert(tournaments).values({
      ...data,
      createdBy: context.viewer.id,
    })

    return tournament
  })
```

### Example 2: Venue Management

```typescript
// src/data/venues/update.ts
import { createServerFn } from "@tanstack/react-start"
import { authMiddleware, requirePermissions } from "@/auth/shared"

export const updateVenueFn = createServerFn({ method: "POST" })
  .middleware([
    authMiddleware,
    requirePermissions(
      { venues: ["update"] },
      {
        onUnauthorized:
          "Only administrators and tournament directors can update venues",
      }
    ),
  ])
  .handler(async ({ context, data }) => {
    // Update venue logic
  })
```

### Example 3: Admin-Only Operations

```typescript
// src/data/admin/users.ts
import { createServerFn } from "@tanstack/react-start"
import { authMiddleware, requireRole } from "@/auth/shared"

export const banUserFn = createServerFn({ method: "POST" })
  .middleware([
    authMiddleware,
    requireRole(["admin"]), // Only admins can ban users
  ])
  .handler(async ({ context, data }) => {
    // Ban user logic
    await db
      .update(users)
      .set({
        banned: true,
        banReason: data.reason,
        banDate: new Date(),
      })
      .where(eq(users.id, data.userId))
  })
```

### Example 4: Combining Multiple Checks

```typescript
// src/data/tournaments/delete.ts
import { createServerFn } from "@tanstack/react-start"
import { authMiddleware, requirePermissions } from "@/auth/shared"
import { setResponseStatus } from "@tanstack/react-start/server"

export const deleteTournamentFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, requirePermissions({ tournament: ["delete"] })])
  .handler(async ({ context, data }) => {
    // Check if user owns the tournament or is an admin
    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, data.tournamentId),
    })

    if (!tournament) {
      setResponseStatus(404)
      throw new Error("Tournament not found")
    }

    const isOwner = tournament.createdBy === context.viewer.id
    const isAdmin = context.viewer.role === "admin"

    if (!isOwner && !isAdmin) {
      setResponseStatus(403)
      throw new Error("You can only delete tournaments you created")
    }

    await db.delete(tournaments).where(eq(tournaments.id, data.tournamentId))

    return { success: true }
  })
```

---

## Best Practices

1. **Always use `authMiddleware` first**

   ```typescript
   .middleware([authMiddleware, requirePermissions(...)])
   ```

2. **Use `requirePermissions()` for fine-grained access control**
   - When you need to check specific resource-action combinations
   - When the same role might have different permissions in different contexts

3. **Use `requireRole()` for simple role checks**
   - When you only need to check if user has a specific role
   - For admin-only or TD-only features

4. **Provide clear error messages**
   - Help users understand why they're being denied access
   - Use the `onUnauthorized` option for user-friendly messages

5. **Set appropriate HTTP status codes**
   - The middleware handles this automatically (401/403)
   - Add additional status codes for business logic errors

6. **Combine with ownership checks**
   - First check permissions, then check if user owns the resource
   - Admins might bypass ownership checks

---

## Testing

When writing tests, you can mock the viewer context:

```typescript
import { describe, it, expect, vi } from "vitest"

describe("createTournamentFn", () => {
  it("should allow admin to create tournament", async () => {
    // Mock authenticated admin user
    const mockViewer = { id: "user-1", role: "admin" }

    // Your test logic
  })

  it("should deny regular user from creating tournament", async () => {
    // Mock authenticated regular user
    const mockViewer = { id: "user-2", role: "user" }

    // Expect error to be thrown
  })

  it("should deny unauthenticated user", async () => {
    // Mock no viewer (unauthenticated)
    const mockViewer = undefined

    // Expect 401 error
  })
})
```

---

## Troubleshooting

### "Unauthorized" error even when logged in

- Check that `authMiddleware` is included in the middleware array
- Verify the user's role in the database
- Check that the user's session is valid

### "Forbidden" error with correct role

- Verify the permissions are correctly defined in `/src/auth/permissions.ts`
- Check that the role has the required permissions assigned
- Ensure you're checking the correct resource-action combination

### TypeScript errors with permissions

- Ensure you're importing `Permissions` type from `@/auth/permissions`
- Check that the permissions object matches the defined statement structure
- Verify you're using valid action names for each resource

---

## Related Files

- `/src/auth/shared.ts` - Middleware implementations
- `/src/auth/permissions.ts` - Permission and role definitions
- `/src/auth/server.ts` - Server-side auth utilities
- `/src/db/schema/auth.ts` - Database schema for users and roles
