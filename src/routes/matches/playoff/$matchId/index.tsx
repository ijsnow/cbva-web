import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import clsx from "clsx"
import { ChevronLeftIcon, MinusIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { tv } from "tailwind-variants"
import { Button } from "@/components/base/button"
import { subtitle, title } from "@/components/base/primitives"
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs"
import { TournamentDirectorMatchControls } from "@/components/matches/director-controls"
import { RefereeControls } from "@/components/matches/referee-controls"
import { TeamNames } from "@/components/teams/names"
import { playoffMatchQueryOptions } from "@/data/matches"
import {
  applyMatchSetAction,
  updateScoreMutationOptions,
} from "@/data/tournaments/matches"
import { DefaultLayout } from "@/layouts/default"
import { playerNames } from "@/utils/profiles"
import { isNotNull } from "@/utils/types"

export const Route = createFileRoute("/matches/playoff/$matchId/")({
  loader: async ({ params: { matchId }, context: { queryClient } }) => {
    const match = await queryClient.ensureQueryData(
      playoffMatchQueryOptions(Number.parseInt(matchId, 10))
    )

    if (!match) {
      throw notFound()
    }

    return match
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `Match ${loaderData.matchNumber}: ${[
              loaderData.teamA,
              loaderData.teamB,
            ]
              .filter(isNotNull)
              .map(({ team }) =>
                playerNames(team.players.map(({ profile }) => profile)).join(
                  " & "
                )
              )
              .join(" vs ")}`,
          },
        ]
      : undefined,
  }),
  component: RouteComponent,
})

const scoreStyles = tv({
  base: "bg-blue-500 text-white h-36 w-36 rounded-md flex items-center justify-center text-5xl font-bold",
  variants: {
    variant: {
      a: "bg-blue-500",
      b: "bg-red-500",
    },
  },
})

// TODOs:
//
// - Start match
// - Undo complete match (subtrack 1 from winning score and change status)
// - N to switch
// - Side switch modal
// - Serve order tracker
//
// - Referees for permission

function RouteComponent() {
  const { matchId } = Route.useParams()

  const queryClient = useQueryClient()

  const poolMatchQuery = playoffMatchQueryOptions(Number.parseInt(matchId, 10))

  const { mutate, isPending } = useMutation({
    // TODO: optimistically update score
    ...updateScoreMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: poolMatchQuery.queryKey,
      })
    },
  })

  const makeUpdateScoreHandler =
    (action: "increment" | "decrement") =>
    (matchSetId: number, teamA: boolean) => {
      const actionPayload = {
        id: matchSetId,
        action,
        teamA,
      }

      mutate(actionPayload)

      queryClient.setQueryData(poolMatchQuery.queryKey, (data) => {
        if (!data) {
          return undefined
        }

        return {
          ...data,
          sets: data?.sets.map((set) =>
            set.id === matchSetId
              ? applyMatchSetAction(actionPayload, set)
              : set
          ),
        }
      })
    }

  const handleIncrement = makeUpdateScoreHandler("increment")
  const handleDecrement = makeUpdateScoreHandler("decrement")

  const { data, isLoading } = useSuspenseQuery(poolMatchQuery)

  const [activeTabKey, setActiveTabKey] = useState<number | undefined>(
    data?.sets[0]?.id
  )

  const isDone = data?.status === "completed"

  const isActionDisabled = isLoading || isPending

  return (
    <DefaultLayout>
      {data && activeTabKey && (
        <TournamentDirectorMatchControls
          matchId={data.id}
          matchKind="playoff"
          setId={activeTabKey}
        />
      )}

      {data && (
        <Link
          className="absolute top-6 left-6 flex flex-row space-x-2 items-center"
          to="/tournaments/$tournamentId/$divisionId/{-$tab}"
          params={{
            tournamentId: data?.tournamentDivision.tournamentId.toString(),
            divisionId: data?.tournamentDivision.id.toString(),
          }}
        >
          <ChevronLeftIcon size={16} /> <span>Back to tournament</span>
        </Link>
      )}

      <div className="w-full max-w-3xl mx-auto flex flex-col space-y-8">
        <div className="flex flex-row items-center">
          <div className="flex-1 flex items-center justify-center">
            <span
              className={title({
                size: "sm",
                className: clsx(
                  "text-center max-w-lg leading-tight",
                  isDone &&
                    data?.winnerId === data?.teamBId &&
                    "font-normal text-gray-500"
                ),
              })}
            >
              {data?.teamA?.team.players
                .map(
                  ({ profile: { firstName, preferredName, lastName } }) =>
                    `${preferredName || firstName} ${lastName}`
                )
                .join(" & ")}
            </span>
          </div>
          <span className={subtitle({ class: "flex-0 italic" })}>vs</span>
          <div className="flex-1 flex items-center justify-center">
            <span
              className={title({
                size: "sm",
                className: clsx(
                  "text-center max-w-lg leading-tight",
                  isDone &&
                    data?.winnerId === data?.teamAId &&
                    "font-normal text-gray-500"
                ),
              })}
            >
              {data?.teamB?.team.players
                .map(
                  ({ profile: { firstName, preferredName, lastName } }) =>
                    `${preferredName || firstName} ${lastName}`
                )
                .join(" & ")}
            </span>
          </div>
        </div>
        {data?.court && (
          <h2 className={title({ size: "xs", class: "text-center" })}>
            Court {data.court}
          </h2>
        )}
        <div>
          Refs:{" "}
          {data?.refTeams.map(({ team }) => (
            <TeamNames key={team.id} players={team.team.players} />
          ))}
        </div>
      </div>

      <Tabs
        defaultSelectedKey={data?.sets.at(1)?.id}
        onSelectionChange={(key) => setActiveTabKey(key)}
      >
        <div
          className={clsx("overflow-x-auto", data?.sets.length === 1 && "h-0")}
        >
          <TabList aria-label="Match Sets" className="px-6 min-w-max">
            {data?.sets.map((s, i) => (
              <Tab
                key={s.id}
                id={s.id}
                isDisabled={Boolean(isDone && !s.startedAt)}
              >
                Set {i + 1}
              </Tab>
            ))}
          </TabList>
        </div>

        {data?.sets
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((s) => (
            <TabPanel key={s.id} id={s.id}>
              <div className="flex flex-row justify-around py-18 w-full max-w-3xl mx-auto">
                {[
                  [data?.teamAId, s.teamAScore],
                  [data?.teamBId, s.teamBScore],
                ].map(([key, score], i) => (
                  <div key={key} className="flex flex-row gap-3">
                    <div
                      className={scoreStyles({
                        variant: i === 0 ? "a" : "b",
                      })}
                    >
                      {score ?? "-"}
                    </div>
                    {s.status === "in_progress" && (
                      <div className="flex flex-col gap-3 justify-center">
                        <Button
                          onPress={() => handleIncrement(s.id, i === 0)}
                          isDisabled={isActionDisabled}
                        >
                          <PlusIcon size={28} />
                        </Button>
                        <Button
                          onPress={() => handleDecrement(s.id, i === 0)}
                          isDisabled={isActionDisabled}
                        >
                          <MinusIcon size={28} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <RefereeControls
                match={data}
                set={s}
                queryKey={poolMatchQuery.queryKey}
              />
            </TabPanel>
          ))}
      </Tabs>
    </DefaultLayout>
  )
}
