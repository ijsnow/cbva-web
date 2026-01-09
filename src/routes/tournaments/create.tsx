import { createFileRoute, redirect } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { Suspense } from "react"
import { viewerQueryOptions } from "@/auth/shared"
import { Link } from "@/components/base/link"
import { title } from "@/components/base/primitives"
import { TournamentFormsGroup } from "@/components/tournaments/forms"
import { DefaultLayout } from "@/layouts/default"

export const Route = createFileRoute("/tournaments/create")({
  loader: async ({ context: { queryClient } }) => {
    const viewer = await queryClient.ensureQueryData(viewerQueryOptions())

    // Check if user is admin
    if (!viewer || viewer.role !== "admin") {
      throw redirect({ to: "/not-found" })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DefaultLayout
      classNames={{
        content: "py-12 flex flex-col items-center space-y-16",
      }}
    >
      <Link
        className="mx-auto text-center absolute left-3 top-3 flex flex-row space-x-2"
        to="/admin/schedule"
      >
        <ChevronLeft /> <span>Scheduling dashboard</span>
      </Link>

      <Suspense>
        <h1 className={title({ class: "mx-auto text-center" })}>
          New Tournament
        </h1>

        <TournamentFormsGroup />
      </Suspense>
    </DefaultLayout>
  )
}
