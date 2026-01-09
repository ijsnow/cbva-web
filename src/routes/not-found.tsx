import { createFileRoute } from "@tanstack/react-router"
import { UnderConstruction } from "@/components/under-construction"
import { DefaultLayout } from "@/layouts/default"

export const Route = createFileRoute("/not-found")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DefaultLayout classNames={{ content: "w-full max-w-lg mx-auto py-12" }}>
      <UnderConstruction />
    </DefaultLayout>
  )
}
