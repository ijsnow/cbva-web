import { parseDate } from "@internationalized/date"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronLeftIcon } from "lucide-react"
import { Suspense } from "react"
import { Link } from "@/components/base/link"
import { title } from "@/components/base/primitives"
import { ProfileForm } from "@/components/users/profile-form"
import { profileQueryOptions } from "@/data/profiles"
import { DefaultLayout } from "@/layouts/default"

export const Route = createFileRoute("/profile/$profileId/edit")({
  loader: async ({ params: { profileId }, context: { queryClient } }) => {
    const result = await queryClient.ensureQueryData(
      profileQueryOptions(Number.parseInt(profileId, 10))
    )

    return result
  },
  head: () => ({
    meta: [{ title: "Update Profile" }],
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { profileId } = Route.useParams()

  const { data } = useSuspenseQuery({
    ...profileQueryOptions(Number.parseInt(profileId, 10)),
    select: (data) => {
      return {
        ...data,
        birthdate: parseDate(data.birthdate),
      }
    },
  })

  return (
    <DefaultLayout classNames={{ content: "relative" }}>
      <div className="py-16 md:py-12 max-w-lg mx-auto flex flex-col space-y-16 relative">
        <h1 className={title({ className: "text-center" })}>Update Profile</h1>

        <div className="rounded-lg bg-white p-8 max-w-lg mx-auto">
          <Suspense fallback={<>Nope</>}>
            <ProfileForm initialValues={data ?? null} isEdit={true} />
          </Suspense>
        </div>
      </div>
      <Link
        className="absolute top-3 left-0 md:top-6 md:left-6 flex flex-row gap-2"
        to="/profile/$profileId"
        params={{
          profileId,
        }}
      >
        <ChevronLeftIcon /> <span>Back to profile</span>
      </Link>
    </DefaultLayout>
  )
}
