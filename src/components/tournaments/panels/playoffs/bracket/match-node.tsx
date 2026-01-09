import { useQuery } from "@tanstack/react-query"
import { Handle, Position } from "@xyflow/react"
import clsx from "clsx"
import { CircleDot } from "lucide-react"
import { tv } from "tailwind-variants"
import { useViewerHasPermission } from "@/auth/shared"
import { Button } from "@/components/base/button"
import { Link } from "@/components/base/link"
import { TeamNames } from "@/components/teams/names"
import { SimulateMatchModal } from "@/components/tournaments/controls/simulate-match"
import { playoffsQueryOptions } from "@/data/playoffs"
import type {
  MatchRefTeam,
  MatchSet,
  PlayerProfile,
  PlayoffMatch,
  Team,
  TeamPlayer,
  TournamentDivisionTeam,
} from "@/db/schema"
import { formatOrdinals } from "@/lib/numbers"
import { isDefined, isNotNullOrUndefined } from "@/utils/types"
import type { MatchTeam } from "../../games/pool-match-grid"
import { useActiveTeam, useSetActiveTeam, useSetNodeIdToCenter } from "."
import { Wildcard } from "./wildcard"
import { useIsDemoTournament } from "@/components/tournaments/context"
import { RefTeamsList } from "@/components/refs/ref-teams-list"

export const scoreTextStyles = tv({
  base: "p-3 text-center flex flex-col justify-center col-span-1 text-xl font-light border-gray-300",
  variants: {
    winner: {
      true: "",
      false: "",
    },
    inProgress: {
      true: "font-bold",
    },
    last: {
      true: ["border-r-0"],
      false: ["border-r"],
    },
  },
  compoundVariants: [
    {
      winner: false,
      inProgress: false,
      class: "text-gray-400",
    },
  ],
})

export function MatchNode({
  data,
}: {
  data: PlayoffMatch & {
    roundIdx: number
    sets: MatchSet[]
    teamA?: MatchTeam
    teamB?: MatchTeam
    refTeams: (MatchRefTeam & {
      team: Pick<TournamentDivisionTeam, "id"> & {
        team: Pick<Team, "id"> & {
          players: (TeamPlayer & {
            profile: Pick<
              PlayerProfile,
              "id" | "preferredName" | "firstName" | "lastName"
            >
          })[]
        }
      }
    })[]
    refetch: () => void
  }
  type: string
}) {
  const isDemo = useIsDemoTournament()

  const {
    teamA,
    teamB,
    court,
    sets,
    winnerId,
    roundIdx,
    matchNumber,
    teamAPreviousMatchId,
    teamBPreviousMatchId,
    refetch,
    tournamentDivisionId,
    refTeams,
  } = data

  const activeTeam = useActiveTeam()
  const setActiveTeam = useSetActiveTeam()

  const { data: teamAPreviousMatch } = useQuery({
    ...playoffsQueryOptions({ tournamentDivisionId }),
    select: (data) => data.find(({ id }) => id === teamAPreviousMatchId),
  })

  const teamAPreviousMatchName = teamAPreviousMatch ? (
    <>
      {teamAPreviousMatch.sets.length > 1 ? "Match" : "Game"}{" "}
      {teamAPreviousMatch.matchNumber}
    </>
  ) : null

  const { data: teamBPreviousMatch } = useQuery({
    ...playoffsQueryOptions({ tournamentDivisionId }),
    select: (data) => data.find(({ id }) => id === teamBPreviousMatchId),
  })

  const teamBPreviousMatchName = teamBPreviousMatch ? (
    <>
      {teamBPreviousMatch.sets.length > 1 ? "Match" : "Game"}{" "}
      {teamBPreviousMatch.matchNumber}
    </>
  ) : null

  const setNodeIdToCenter = useSetNodeIdToCenter()

  const canUpdate = useViewerHasPermission({
    tournament: ["update"],
  })

  return (
    <div>
      <div className="p-3 flex flex-row space-x-2 items-center">
        <RefTeamsList
          tournamentDivisionId={tournamentDivisionId}
          playoffMatchId={data.id}
          matchStatus={
            isDefined(data.teamAId) && isDefined(data.teamBId)
              ? data.status
              : "tbd"
          }
          refTeams={refTeams}
        />

        {canUpdate &&
          isDemo &&
          teamA &&
          teamB &&
          data.status !== "completed" && (
            <SimulateMatchModal
              tournamentDivisionId={tournamentDivisionId}
              matchId={data.id}
              matchKind="playoff"
            />
          )}
      </div>
      <div
        className="relative rounded-md overflow-hidden w-md border bg-white border-gray-300"
        data-id={data.id}
      >
        <div className="grid grid-cols-6 items-center border-b border-gray-300">
          <div
            className={clsx(
              "p-3 flex flex-row items-center space-x-3",
              sets.length > 1 ? "col-span-3" : "col-span-5"
            )}
          >
            <Link
              to="/matches/playoff/$matchId"
              params={{
                matchId: data.id.toString(),
              }}
              variant="alt"
            >
              {court ? (
                <span className="whitespace-nowrap text-ellipsis">
                  Court {court}
                </span>
              ) : (
                <span className="whitespace-nowrap text-ellipsis">
                  {sets.length > 1 ? "Match" : "Game"} {matchNumber}
                </span>
              )}
            </Link>

            {sets.some(({ status }) => status === "in_progress") ? (
              <Button
                size="sm"
                className="rounded-sm px-2"
                color="primary"
                tooltip={<>Click to refresh</>}
                onClick={refetch}
              >
                <CircleDot size={18} />
                Live
              </Button>
            ) : null}
          </div>

          {sets.map((s) => (
            <div key={s.id} className="p-3 text-center col-span-1">
              {sets.length > 1 ? <>Set {s.setNumber}</> : "Score"}
            </div>
          ))}
        </div>
        {[
          isNotNullOrUndefined(teamA)
            ? {
                ...teamA,
                previousMatchId: data.teamAPreviousMatchId,
                type: "MatchTeam" as const,
              }
            : {
                id: (data.teamAPreviousMatchId ??
                  data.teamAPoolId ??
                  ("a" as const)) as number | "a" | "b",
                type: "tbd" as const,
              },
          isNotNullOrUndefined(teamB)
            ? {
                ...teamB,
                previousMatchId: data.teamBPreviousMatchId,
                type: "MatchTeam" as const,
              }
            : {
                id: (data.teamBPreviousMatchId ??
                  data.teamAPoolId ??
                  ("b" as const)) as number | "a" | "b",
                type: "tbd" as const,
              },
        ].map((team, i) => (
          <div
            key={team.id}
            className={clsx(
              "grid grid-cols-6 items-stretch border-b border-gray-300 last-of-type:border-b-0",
              team.id === activeTeam ? "bg-gray-200" : "bg-white"
            )}
            role="none"
            tabIndex={-1}
            onMouseEnter={() => {
              if (typeof team.id === "number") {
                setActiveTeam(team.id as number)
              } else {
                setActiveTeam(null)
              }
            }}
            onMouseLeave={() => {
              setActiveTeam(null)
            }}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={team.id.toString()}
              style={{
                opacity: 0,
                position: "absolute",
                top: i === 0 ? "45%" : "78%",
                right: 0,
              }}
            />
            <div
              className={clsx(
                "p-3 grid grid-cols-10 space-x-2 items-center",
                sets.length > 1 ? "col-span-3" : "col-span-5"
              )}
            >
              {team.type === "MatchTeam" && (
                <span
                  className={clsx(
                    "text-center",
                    team.playoffsSeed || team.wildcard ? "col-span-1" : "hidden"
                  )}
                  title={`Seed ${team.playoffsSeed ?? "?"} in playoffs`}
                >
                  {team.playoffsSeed ?? (team.wildcard ? "WC" : null)}
                </span>
              )}

              <div
                className={clsx(
                  "flex flex-col col-span-9",
                  winnerId && winnerId === team.id && "font-bold",
                  winnerId && winnerId !== team.id && "text-gray-600"
                )}
              >
                {team.type === "MatchTeam" ? (
                  <TeamNames
                    players={team?.team.players}
                    showFirst={false}
                    orientation="row"
                    separator="/"
                  />
                ) : roundIdx === 0 ? (
                  <Wildcard
                    matchId={data.id}
                    a={team.id === "a"}
                    opponent={team.id === "a" ? teamB : teamA}
                  />
                ) : (
                  <Button
                    className="px-0 self-start hover:underline"
                    variant="text"
                    onPress={() => {
                      if (typeof team.id === "number") {
                        setNodeIdToCenter(team.id as number)
                      }
                    }}
                  >
                    Winner of{" "}
                    {team.id === teamAPreviousMatchId
                      ? teamAPreviousMatchName
                      : teamBPreviousMatchName}
                  </Button>
                )}
                {team.type === "MatchTeam" && team.poolTeam?.finish && (
                  <div>
                    <span className="text-xs text-gray-500">
                      {formatOrdinals(team.poolTeam.finish)} in Pool{" "}
                      <span className="uppercase">
                        {team.poolTeam.pool.name}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            {sets
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((s, i) => (
                <div
                  key={s.id}
                  className={scoreTextStyles({
                    winner:
                      s.winnerId === null ? undefined : s.winnerId === team.id,
                    inProgress: Boolean(s.startedAt) && !s.endedAt,
                    last: i === sets.length - 1,
                  })}
                >
                  {s.status !== "not_started"
                    ? teamA?.id === team.id
                      ? (s.teamAScore ?? 0)
                      : (s.teamBScore ?? 0)
                    : "-"}
                </div>
              ))}
            <Handle
              type="source"
              position={Position.Right}
              id={team.id.toString()}
              style={{
                opacity: 0,
                position: "absolute",
                top: i === 0 ? "45%" : "78%",
                right: 0,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
