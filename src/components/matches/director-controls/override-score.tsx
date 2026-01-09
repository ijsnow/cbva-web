import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Heading } from "react-aria-components"
import z from "zod"
import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"
import { TeamNames } from "@/components/teams/names"
import { playoffMatchQueryOptions, poolMatchQueryOptions } from "@/data/matches"
import { overrideScoreMutationOptions } from "@/data/tournaments/matches"
import { useMatchSets, useMatchTeams } from "@/lib/matches"

export type OverrideScoreFormProps = {
  setId: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
} & (
  | { matchKind: "pool"; matchId: number }
  | { matchKind: "playoff"; matchId: number }
)

export function OverrideScoreForm({
  matchId,
  matchKind,
  setId,
  onOpenChange,
  ...props
}: OverrideScoreFormProps) {
  const teams = useMatchTeams(matchId, matchKind)
  const sets = useMatchSets(matchId, matchKind)

  const queryClient = useQueryClient()

  const { mutate, failureReason } = useMutation({
    ...overrideScoreMutationOptions(),
    onSuccess: () => {
      if (matchKind === "pool") {
        queryClient.invalidateQueries(poolMatchQueryOptions(matchId))
      } else if (matchKind === "playoff") {
        queryClient.invalidateQueries(playoffMatchQueryOptions(matchId))
      }

      onOpenChange(false)
    },
  })

  const set = sets?.find((s) => s.id === setId)

  const schema = z
    .object({
      teamAScore: z.number(),
      teamBScore: z.number(),
    })
    .refine(
      ({ teamAScore, teamBScore }) => {
        const winScore = set?.winScore ?? 21

        // Check if scores are valid according to volleyball rules
        const maxScore = Math.max(teamAScore, teamBScore)
        const minScore = Math.min(teamAScore, teamBScore)

        if (maxScore > winScore && maxScore - minScore > 2) {
          return false
        }

        return true
      },
      {
        message: "Invalid score.",
        path: ["teamBScore"],
      }
    )

  const form = useAppForm({
    defaultValues: {
      teamAScore: set?.teamAScore as number,
      teamBScore: set?.teamBScore as number,
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value: { teamAScore, teamBScore } }) => {
      if (set) {
        mutate({
          id: set.id,
          teamAScore,
          teamBScore,
        })
      }
    },
  })

  return (
    <Modal {...props} onOpenChange={onOpenChange}>
      <div className="p-3 flex flex-col space-y-4 relative">
        <Heading className={title({ size: "sm" })} slot="title">
          Override Score
        </Heading>

        <form
          className="flex flex-col space-y-6"
          onSubmit={(e) => {
            e.preventDefault()

            form.handleSubmit()
          }}
        >
          {failureReason && (
            <form.AppForm>
              <form.Alert
                title={"Unable to set seeds"}
                description={failureReason.message}
              />
            </form.AppForm>
          )}

          <form.AppField
            name="teamAScore"
            children={(field) => (
              <field.Number
                label={<TeamNames players={teams?.teamA?.team.players || []} />}
                field={field}
              />
            )}
          />

          <form.AppField
            name="teamBScore"
            children={(field) => (
              <field.Number
                label={<TeamNames players={teams?.teamB?.team.players || []} />}
                field={field}
              />
            )}
          />

          <form.AppForm>
            <form.Footer>
              <Button onPress={() => onOpenChange(false)}>Cancel</Button>

              <form.SubmitButton>Submit</form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
