import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
} from "@internationalized/date"
import { useDateFormatter } from "@react-aria/i18n"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import clsx from "clsx"
import { CheckIcon } from "lucide-react"
import { match, P } from "ts-pattern"
import { useViewerHasPermission } from "@/auth/shared"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuItemLink,
} from "@/components/base/dropdown-menu"
import { subtitle, title } from "@/components/base/primitives"
import { Tab, TabList, Tabs } from "@/components/base/tabs"
import { GamesPanel } from "@/components/tournaments/panels/games"
import { InformationPanel } from "@/components/tournaments/panels/information"
import { PlayoffsPanel } from "@/components/tournaments/panels/playoffs"
import { PoolsPanel } from "@/components/tournaments/panels/pools"
import { TeamsPanel } from "@/components/tournaments/panels/teams"
import { tournamentQueryOptions } from "@/data/tournaments"
import { getTournamentDivisionDisplay } from "@/hooks/tournament"
import { DefaultLayout } from "@/layouts/default"

const dateFormatter = new DateFormatter("EN-US", {
  dateStyle: "short",
})

export const Route = createFileRoute("/tournaments/$tournamentId/$divisionId")({
  component: RouteComponent,
  validateSearch: (
    search: Record<string, unknown>
  ): {
    pools: number[]
    courts: string[]
  } => {
    return {
      pools: Array.isArray(search?.pools) ? search.pools : [],
      courts: Array.isArray(search?.courts) ? search.courts : [],
    }
  },
  loader: async ({ params: { tournamentId }, context: { queryClient } }) => {
    const tournament = await queryClient.ensureQueryData(
      tournamentQueryOptions(Number.parseInt(tournamentId, 10))
    )

    if (!tournament) {
      throw new Error("not found")
    }

    return tournament
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: [
              dateFormatter.format(
                parseDate(loaderData.date).toDate(getLocalTimeZone())
              ),
              loaderData.name,
              `${loaderData.venue.name}, ${loaderData.venue.city}`,
            ].join(" "),
          },
        ]
      : undefined,
  }),
})

function RouteComponent() {
  const canCreateTournament = useViewerHasPermission({
    tournament: ["create"],
  })

  const { tournamentId, divisionId } = Route.useParams()

  const { data } = useSuspenseQuery(
    tournamentQueryOptions(Number.parseInt(tournamentId, 10))
  )

  const tournament = data!

  const parsedDate = parseDate(tournament.date)

  const activeDivision =
    tournament.tournamentDivisions.find(
      ({ id }) => id.toString() === divisionId
    ) ?? tournament.tournamentDivisions[0]

  const { name, venue } = tournament || {}

  const dateFormatter = useDateFormatter({
    dateStyle: "full",
  })

  const formattedDate = dateFormatter.format(
    parsedDate.toDate(getLocalTimeZone())
  )

  const { venueClassName, dateClassName } = match({
    name: tournament.name,
    venueName: tournament.venue.name,
    venueCity: tournament.venue.city,
  })
    .with(
      {
        name: null,
        venueName: P.select("venueName"),
        venueCity: P.select("venueCity"),
      },
      () => ({
        venueClassName: title(),
        dateClassName: subtitle({ class: "font-bold my-3" }),
      })
    )
    .with(
      {
        name: P.select("name"),
        venueName: P.select("venueName"),
        venueCity: P.select("venueCity"),
      },
      () => ({
        venueClassName: subtitle({ class: "font-bold my-0" }),
        dateClassName: subtitle({ class: "my-0" }),
      })
    )
    .exhaustive()

  return (
    <DefaultLayout classNames={{ content: "bg-white relative" }}>
      {canCreateTournament && (
        <DropdownMenu buttonClassName="absolute top-6 right-6">
          <DropdownMenuItemLink
            to="/tournaments/create"
            search={{
              template: tournamentId.toString(),
            }}
          >
            Duplicate
          </DropdownMenuItemLink>
        </DropdownMenu>
      )}
      <div>
        <div className="py-12 max-w-lg mx-auto flex flex-col space-y-6">
          <div className="text-center flex flex-col space-y-2">
            {name && <h1 className={title()}>{name}</h1>}

            <div className="flex flex-col">
              <h2
                className={venueClassName}
              >{`${venue.name}, ${venue.city}`}</h2>
              <h3 className={dateClassName}>{formattedDate}</h3>
            </div>
          </div>

          <DropdownMenu
            buttonContent={
              <span className={subtitle({ className: "!w-auto" })}>
                {activeDivision && getTournamentDivisionDisplay(activeDivision)}
              </span>
            }
          >
            {tournament.tournamentDivisions.map(({ id, ...division }) => (
              <DropdownMenuItemLink
                key={id}
                to="/tournaments/$tournamentId/$divisionId"
                params={{
                  tournamentId,
                  divisionId: id.toString(),
                }}
                search={{ pools: [], courts: [] }}
                className={clsx(
                  "w-full flex flex-row justify-between",
                  id === activeDivision?.id && "font-semibold"
                )}
              >
                <span>{getTournamentDivisionDisplay(division)}</span>
                {id === activeDivision?.id && <CheckIcon />}
              </DropdownMenuItemLink>
            ))}
          </DropdownMenu>
        </div>

        <Tabs defaultSelectedKey="info">
          <div className="overflow-x-auto">
            <TabList
              aria-label="Tournament Overview"
              className="px-6 min-w-max"
            >
              <Tab id="info">Information</Tab>
              <Tab id="teams">Teams</Tab>
              <Tab id="pools">Pools</Tab>
              <Tab id="games">Games</Tab>
              <Tab id="playoffs">Playoffs</Tab>
            </TabList>
          </div>
          <InformationPanel {...tournament} />
          <TeamsPanel
            {...tournament}
            tournamentDivisionId={activeDivision.id}
            teamSize={activeDivision.teamSize}
          />
          <PoolsPanel
            {...tournament}
            tournamentDivisionId={activeDivision.id}
          />
          <GamesPanel
            {...tournament}
            tournamentDivisionId={activeDivision.id}
          />
          <PlayoffsPanel
            {...tournament}
            tournamentDivisionId={activeDivision.id}
          />
        </Tabs>
      </div>
    </DefaultLayout>
  )
}
