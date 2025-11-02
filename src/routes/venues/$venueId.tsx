import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/venues/$venueId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/venues/$venueId"!</div>
}
