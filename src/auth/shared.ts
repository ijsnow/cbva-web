import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { createMiddleware, createServerFn } from "@tanstack/react-start"
import { setResponseStatus } from "@tanstack/react-start/server"
import { isEmpty } from "lodash-es"
import { db } from "@/db/connection"
import { authClient } from "./client"
import type { Permissions, Role } from "./permissions"
import { getViewer, type Viewer } from "./server"

export type SessionViewer = Pick<
  Viewer,
  | "id"
  | "name"
  | "role"
  | "email"
  | "emailVerified"
  | "phoneNumber"
  | "phoneNumberVerified"
>

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const { impersonatedBy, ...viewer } = await getViewer()

  return await next({
    context: {
      viewer: !isEmpty(viewer)
        ? {
            id: viewer.id,
            name: viewer.name,
            role: viewer.role,
            email: viewer.email,
            emailVerified: viewer.emailVerified,
            phoneNumber: viewer.phoneNumber,
            phoneNumberVerified: viewer.phoneNumberVerified,
          }
        : undefined,
      impersonatorId: impersonatedBy,
    },
  })
})
// .client(async ({ next }) => {
// // authClient.
// 	const result = await next(); // <-- This will execute the next middleware in the chain and eventually, the RPC to the server
// 	return result;
// });

export const getViewerId = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context?.viewer?.id ?? null
  })

export const viewerIdQueryOptions = () =>
  queryOptions({
    queryKey: ["viewer", "id"],
    queryFn: () => getViewerId(),
  })

export function useViewerId() {
  const { data: id } = useSuspenseQuery(viewerIdQueryOptions())

  return id
}

export function useIsLoggedIn() {
  const { data: isLoggedIn } = useSuspenseQuery({
    ...viewerIdQueryOptions(),
    select: (id) => typeof id === "string",
  })

  return isLoggedIn
}

// export const getAvatar = createServerFn({ method: "GET" })
//   .middleware([authMiddleware])
//   .handler(async ({ context }) => {
//     return context?.user?.image;
//   });

export const getViewerFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context?.viewer ?? null
  })

export const viewerQueryOptions = () =>
  queryOptions({
    queryKey: ["viewer"],
    queryFn: () => getViewerFn(),
  })

export function useViewer() {
  const { data: viewer } = useSuspenseQuery(viewerQueryOptions())

  return viewer
}

export function useViewerRole() {
  const { data: viewer } = useSuspenseQuery(viewerQueryOptions())

  return viewer?.role
}

export function useViewerIsAdmin() {
  const { data: viewer } = useSuspenseQuery(viewerQueryOptions())

  return viewer ? viewer.role === "admin" : undefined
}

export function useViewerHasPermission<P extends Permissions>(permissions: P) {
  const viewer = useViewer()

  if (!viewer) {
    return false
  }

  return roleHasPermission(viewer.role, permissions)
}

export const getImpersonatorFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context: { impersonatorId } }) => {
    if (!impersonatorId) {
      return null
    }

    return await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, impersonatorId),
    })
  })

export const impersonatorQueryOptions = () =>
  queryOptions({
    queryKey: ["impersonator"],
    queryFn: () => getImpersonatorFn(),
  })

export function useImpersonator() {
  const { data: impersonator } = useSuspenseQuery(impersonatorQueryOptions())

  return impersonator
}

export function useImpersonatorRole() {
  const { data: impersonator } = useSuspenseQuery(impersonatorQueryOptions())

  return impersonator?.role
}

export function useImpersonatorIsAdmin() {
  const { data: impersonator } = useSuspenseQuery(impersonatorQueryOptions())

  return impersonator?.role === "admin"
}

export function useImpersonatorHasPermission<P extends Permissions>(
  permissions: P
) {
  const impersonator = useImpersonator()

  if (!impersonator?.role) {
    return false
  }

  return roleHasPermission(impersonator.role, permissions)
}

export function roleHasPermission<P extends Permissions>(
  role: Role,
  permissions: P
) {
  return authClient.admin.checkRolePermission({
    permissions,
    role,
  })
}

export const requireAuthenticated = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const { viewer } = context

    if (!viewer) {
      setResponseStatus(401)

      throw new Error("Unauthorized")
    }

    return await next({ context })
  })

/**
 * Creates a middleware that ensures the logged-in user has the specified permissions.
 *
 * @param permissions - The permissions to check (e.g., { tournament: ["create", "update"] })
 * @param options - Optional configuration
 * @param options.requireAuth - If true, requires user to be authenticated (default: true)
 * @param options.onUnauthorized - Custom error message or handler (default: "Unauthorized")
 *
 * @example
 * ```typescript
 * export const createTournamentFn = createServerFn({ method: "POST" })
 *   .middleware([
 *     authMiddleware,
 *     requirePermissions({ tournament: ["create"] })
 *   ])
 *   .handler(async ({ context, data }) => {
 *     // User is guaranteed to have tournament:create permission
 *     // context.viewer is typed and available
 *   })
 * ```
 *
 * @example
 * ```typescript
 * // Require multiple permissions
 * export const updateVenueFn = createServerFn({ method: "POST" })
 *   .middleware([
 *     authMiddleware,
 *     requirePermissions({ venues: ["update"] })
 *   ])
 *   .handler(async ({ context }) => {
 *     // User has venues:update permission
 *   })
 * ```
 *
 * @example
 * ```typescript
 * // Custom error message
 * export const deleteContentFn = createServerFn({ method: "POST" })
 *   .middleware([
 *     authMiddleware,
 *     requirePermissions(
 *       { content: ["delete"] },
 *       { onUnauthorized: "You do not have permission to delete content" }
 *     )
 *   ])
 *   .handler(async ({ context }) => {
 *     // User has content:delete permission
 *   })
 * ```
 */
export function requirePermissions<P extends Permissions>(permissions: P) {
  return createMiddleware()
    .middleware([authMiddleware])
    .server(async ({ next, context }) => {
      const { viewer } = context

      if (!viewer) {
        setResponseStatus(401)

        throw new Error("Unauthorized")
      }

      if (viewer) {
        const hasPermission = roleHasPermission(viewer.role, permissions)

        if (!hasPermission) {
          setResponseStatus(403)

          throw new Error("Forbidden")
        }
      }

      return await next({ context })
    })
}

/**
 * Creates a middleware that ensures the logged-in user has one of the specified roles.
 *
 * @param roles - Array of allowed roles (e.g., ["admin", "td"])
 * @param options - Optional configuration
 * @param options.requireAuth - If true, requires user to be authenticated (default: true)
 * @param options.onUnauthorized - Custom error message (default: "Unauthorized")
 *
 * @example
 * ```typescript
 * export const adminOnlyFn = createServerFn({ method: "POST" })
 *   .middleware([
 *     authMiddleware,
 *     requireRole(["admin"])
 *   ])
 *   .handler(async ({ context }) => {
 *     // User is guaranteed to be an admin
 *   })
 * ```
 *
 * @example
 * ```typescript
 * // Allow multiple roles
 * export const tournamentManagementFn = createServerFn({ method: "POST" })
 *   .middleware([
 *     authMiddleware,
 *     requireRole(["admin", "td"])
 *   ])
 *   .handler(async ({ context }) => {
 *     // User is either admin or td
 *   })
 * ```
 */
export function requireRole(roles: Role[]) {
  return createMiddleware()
    .middleware([authMiddleware])
    .server(async ({ next, context }) => {
      const { viewer } = context

      if (!viewer) {
        setResponseStatus(401)

        throw new Error("Unauthorized")
      }

      if (viewer && !roles.includes(viewer.role)) {
        setResponseStatus(403)

        throw new Error(
          `Forbidden: requires one of the following roles: ${roles.join(", ")}`
        )
      }

      return await next({ context })
    })
}
