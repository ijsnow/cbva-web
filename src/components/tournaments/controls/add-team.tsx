import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { XIcon } from "lucide-react"
import { useRef, useState } from "react"
import z from "zod"

import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"
import { ProfileName } from "@/components/profiles/name"
import { ProfilePhoto } from "@/components/profiles/photo"
import { levelsQueryOptions } from "@/data/levels"
import {
  searchProfilesQueryOptions,
  searchProfilesSchema,
} from "@/data/profiles"
import { teamsQueryOptions } from "@/data/teams"
import { addTeamOptions } from "@/data/tournaments/teams"
import type { Division, PlayerProfile, TournamentDivision } from "@/db/schema"
import { getTournamentDivisionDisplay } from "@/hooks/tournament"

export type AddTeamFormProps = {
  tournamentId: number
  division: TournamentDivision & { division: Division }
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTeamForm({
  tournamentId,
  division,
  onOpenChange,
  ...props
}: AddTeamFormProps) {
  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    ...addTeamOptions(),
    onSuccess: () => {
      onOpenChange(false)

      queryClient.invalidateQueries({
        queryKey: teamsQueryOptions(division.id).queryKey,
      })
    },
  })

  const schema = z.object({
    players: z.array(z.number()).length(division.teamSize),
  })

  const form = useAppForm({
    defaultValues: {
      players: Array.from({ length: division.teamSize }).map(
        () => null as null | number
      ),
    },
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({ value: { players } }) => {
      mutate({
        tournamentDivisionId: division.id,
        players: players as number[],
      })
    },
  })

  const profiles = useRef<PlayerProfile[]>([])

  const [selectedProfiles, setSelectedProfiles] = useState<
    (PlayerProfile | null)[]
  >([])

  const { data: levelsForDivision } = useQuery(
    levelsQueryOptions({ division: division.division.order })
  )

  return (
    <Modal {...props} onOpenChange={onOpenChange}>
      <div className="p-3 flex flex-col space-y-4 relative">
        <h3 className={title({ size: "sm" })}>Add Team</h3>

        <p>
          Add a team to the{" "}
          <span className="font-bold italic">
            {getTournamentDivisionDisplay(division)}
          </span>{" "}
          division for free.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()

            form.handleSubmit()
          }}
          className="flex flex-col space-y-2"
        >
          <form.AppField
            name="players"
            mode="array"
            children={(field) =>
              field.state.value.map((_, i) => (
                <form.AppField key={i} name={`players[${i}]`}>
                  {(subField) => {
                    const player = selectedProfiles[i]

                    return player ? (
                      <div className="flex flex-row justify-between items-center">
                        <span className="flex flex-row space-x-2">
                          <ProfilePhoto {...player} />
                          <ProfileName {...player} />
                        </span>
                        <Button
                          className="text-red-500"
                          variant="icon"
                          onPress={() => {
                            subField.handleChange(null)

                            setSelectedProfiles((state) => {
                              const next = [...state]
                              next[i] = null
                              return next
                            })
                          }}
                        >
                          <XIcon size={16} />
                        </Button>
                      </div>
                    ) : (
                      <subField.AsyncComboBox
                        isRequired
                        className="col-span-3"
                        label="Player"
                        field={subField}
                        onSelectionChange={(next) => {
                          const player = profiles.current?.find(
                            ({ id }) => id === next
                          )

                          setSelectedProfiles((state) => {
                            const next = [...state]
                            next[i] = player || null
                            return next
                          })
                        }}
                        fetchOptions={{
                          load: async ({ filterText, signal }) => {
                            const parse = searchProfilesSchema.safeParse({
                              name: filterText,
                              levels: levelsForDivision?.map(({ id }) => id),
                            })

                            if (!parse.success) {
                              return {
                                items: [],
                              }
                            }

                            const result = await queryClient.ensureQueryData(
                              searchProfilesQueryOptions(parse.data)
                            )

                            profiles.current = result

                            return {
                              items: result.map(
                                ({
                                  id,
                                  preferredName,
                                  firstName,
                                  lastName,
                                }) => ({
                                  display: `${preferredName || firstName} ${lastName}`,
                                  value: id,
                                })
                              ),
                            }
                          },
                        }}
                      />
                    )
                  }}
                </form.AppField>
              ))
            }
          />

          <form.AppForm>
            <form.Footer className="col-span-full">
              <Button onPress={() => onOpenChange(false)}>Cancel</Button>

              <form.SubmitButton>Add Team</form.SubmitButton>
            </form.Footer>
          </form.AppForm>
        </form>
      </div>
    </Modal>
  )
}
