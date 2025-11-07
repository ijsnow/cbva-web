import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { XIcon } from "lucide-react"
import { Profiler, useRef, useState } from "react"
import { useAsyncList } from "react-stately"
import z from "zod"
import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { Modal } from "@/components/base/modal"
import { title } from "@/components/base/primitives"
import type { Option } from "@/components/base/select"
import { ProfileName } from "@/components/profiles/name"
import { ProfilePhoto } from "@/components/profiles/photo"
import {
  searchProfiles,
  searchProfilesQueryOptions,
  searchProfilesSchema,
} from "@/data/profiles"
import { duplicateTournamentOptions } from "@/data/tournaments/schedule"
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
  const navigate = useNavigate()

  const { mutate } = useMutation({
    ...duplicateTournamentOptions(),
    onSuccess: ({ data }) => {
      navigate({
        to: "/tournaments/$tournamentId",
        params: {
          tournamentId: data.id.toString(),
        },
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
      console.log(players)

      onOpenChange(false)
    },
  })

  const profiles = useRef<PlayerProfile[]>([])

  const [selectedProfiles, setSelectedProfiles] = useState<
    (PlayerProfile | null)[]
  >([])

  const queryClient = useQueryClient()

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
                          onPress={() => subField.handleChange(null)}
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
                        onSelectionChange={(id) => {
                          const player = profiles.current?.find(
                            ({ id }) => id === subField.state.value
                          )

                          setSelectedProfiles((state) => {
                            const next = [...state]
                            next[i] = player || null
                            return next
                          })
                        }}
                        fetchOptions={{
                          load: async ({ filterText }) => {
                            const parse = searchProfilesSchema.safeParse({
                              name: filterText,
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
