import { useViewerHasPermission } from "@/auth/shared"
import type {
  MatchRefTeam,
  PlayerProfile,
  Team,
  TeamPlayer,
  TournamentDivisionTeam,
} from "@/db/schema"
import { AbandonRefForm } from "../teams/controls/abandon-ref"
import { RemoveRefForm } from "../teams/controls/remove-ref"
import { TeamNames } from "../teams/names"
import { EditMatchRefsForm } from "../tournaments/controls/edit-playoff-match-refs"

export type RefTeamsListProps = {
  tournamentDivisionId: number
  matchStatus: string | "completed" | "tbd"
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
} & (
  | {
      poolMatchId: number
      playoffMatchId?: never
    }
  | { playoffMatchId: number; poolMatchId?: never }
)

export function RefTeamsList({
  tournamentDivisionId,
  playoffMatchId,
  poolMatchId,
  matchStatus,
  refTeams,
}: RefTeamsListProps) {
  const canEdit = useViewerHasPermission({
    tournament: ["update"],
  })

  return (
    <>
      {refTeams.length ? (
        <div className="whitespace-nowrap text-ellipsis flex flex-row items-center gap-2">
          Refs:{" "}
          {refTeams.map((team) => (
            <span key={team.id} className="flex flex-row items-center gap-2">
              <TeamNames {...team.team.team} />

              {canEdit && matchStatus !== "completed" && (
                <>
                  <RemoveRefForm refTeamId={team.id} />
                  <AbandonRefForm refTeamId={team.id} />
                </>
              )}
            </span>
          ))}
        </div>
      ) : matchStatus === "tbd" ? null : (
        <div>Self Ref</div>
      )}

      {canEdit && !["completed", "tbd"].includes(matchStatus) && (
        <EditMatchRefsForm
          tournamentDivisionId={tournamentDivisionId}
          playoffMatchId={playoffMatchId}
          poolMatchId={poolMatchId}
        />
      )}
    </>
  )
}
