import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { pick } from "lodash-es"
import { PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import type z from "zod"

import { Button } from "@/components/base/button"
import { useAppForm } from "@/components/base/form"
import { type Option, Select } from "@/components/base/select"
import { divisionsQueryOptions } from "@/data/divisions"
import { tournamentQueryOptions } from "@/data/tournaments"
import {
  upsertRequirementsMutationOptions,
  upsertRequirementsSchema,
} from "@/data/tournaments/divisions"
import type { CreateTournamentDivisionRequirement } from "@/db/schema"
import type { Gender } from "@/db/schema/shared"
import { isNotNullOrUndefined } from "@/utils/types"

export type RequirementsFormProps = {
  tournamentId: number
  tournamentDivisionId: number
  divisionId: number
  teamSize: number
  name?: string | null
  displayDivision?: boolean | null
  displayGender?: boolean | null
  onCancel: () => void
}

export function RequirementsForm({
  tournamentId,
  tournamentDivisionId,
  divisionId,
  name,
  displayDivision,
  displayGender,
  teamSize,
  onCancel,
}: RequirementsFormProps) {
  const { data: divisions } = useSuspenseQuery(divisionsQueryOptions())

  const divisionNameIdMap = new Map(divisions.map(({ name, id }) => [name, id]))

  const divisionOptions = divisions.map(({ id, display, name, maxAge }) => ({
    value: id,
    display: display ?? name.toUpperCase(),
    hasMaxAge: isNotNullOrUndefined(maxAge),
  }))

  const mapDivisionNamesToIds = (name: string) => {
    const id = divisionNameIdMap.get(name)

    if (!isNotNullOrUndefined(id)) {
      throw new Error("id not found")
    }

    return id
  }

  const formats: (Option<string> & {
    displayGender?: boolean
    displayDivision?: boolean
    requirements: (Omit<
      CreateTournamentDivisionRequirement,
      "tournamentDivisionId" | "qualifiedDivisionId"
    > & {
      qualifiedDivisionIds: number[]
      defaultQualifiedDivisionId?: number
    })[]
  })[] = [
    {
      value: "motherDaughter",
      display: "Mother/Daughter",
      displayGender: false,
      displayDivision: true,
      requirements: [
        {
          gender: "female",
          qualifiedDivisionIds: ["unrated", "b", "a", "aa", "aaa", "open"].map(
            mapDivisionNamesToIds
          ),
          defaultQualifiedDivisionId: mapDivisionNamesToIds("open"),
          minimum: 1,
        },
        {
          gender: "female",
          qualifiedDivisionIds: ["12u", "14u", "16u", "18u"].map(
            mapDivisionNamesToIds
          ),
          minimum: 1,
        },
      ],
    },
    {
      value: "motherSon",
      display: "Mother/Son",
      displayGender: false,
      displayDivision: true,
      requirements: [
        {
          gender: "female",
          qualifiedDivisionIds: ["unrated", "b", "a", "aa", "aaa", "open"].map(
            mapDivisionNamesToIds
          ),
          defaultQualifiedDivisionId: mapDivisionNamesToIds("open"),
          minimum: 1,
        },
        {
          gender: "male",
          qualifiedDivisionIds: ["12u", "14u", "16u", "18u"].map(
            mapDivisionNamesToIds
          ),
          minimum: 1,
        },
      ],
    },
    {
      value: "fatherDaughter",
      display: "Father/Daughter",
      displayGender: false,
      displayDivision: true,
      requirements: [
        {
          gender: "male",
          qualifiedDivisionIds: ["unrated", "b", "a", "aa", "aaa", "open"].map(
            mapDivisionNamesToIds
          ),
          defaultQualifiedDivisionId: mapDivisionNamesToIds("open"),
          minimum: 1,
        },
        {
          gender: "female",
          qualifiedDivisionIds: ["12u", "14u", "16u", "18u"].map(
            mapDivisionNamesToIds
          ),
          minimum: 1,
        },
      ],
    },
    {
      value: "fatherSon",
      display: "Father/Son",
      displayGender: false,
      displayDivision: true,
      requirements: [
        {
          gender: "male",
          qualifiedDivisionIds: ["unrated", "b", "a", "aa", "aaa", "open"].map(
            mapDivisionNamesToIds
          ),
          defaultQualifiedDivisionId: mapDivisionNamesToIds("open"),
          minimum: 1,
        },
        {
          gender: "male",
          qualifiedDivisionIds: ["12u", "14u", "16u", "18u"].map(
            mapDivisionNamesToIds
          ),
          minimum: 1,
        },
      ],
    },
    {
      value: "custom",
      display: "Custom",
      requirements: [],
    },
  ]

  const getGenderDisplay = (divisionIds: number[], gender: Gender) => {
    const divisionsSet = new Set(divisionIds)

    const allHaveMaxAge = divisions
      .filter(({ id }) => divisionsSet.has(id))
      .every(({ maxAge }) => isNotNullOrUndefined(maxAge))

    if (allHaveMaxAge && gender === "female") {
      return "Girl's"
    }

    if (allHaveMaxAge && gender === "male") {
      return "Boy's"
    }

    if (gender === "female") {
      return "Women's"
    }

    return "Men's"
  }

  const schema = upsertRequirementsSchema.omit({
    tournamentDivisionId: true,
    divisionId: true,
  })

  const [format, setFormat] = useState<string | undefined | null>(
    name ? formats.find(({ display }) => name === display)?.value : undefined
  )

  const selectedFormat = formats.find(({ value }) => value === format)

  const defaultRequirements = selectedFormat?.requirements.map(
    ({ gender, defaultQualifiedDivisionId, minimum }) => ({
      gender,
      qualifiedDivisionId: defaultQualifiedDivisionId ?? null,
      minimum,
      tournamentDivisionId,
    })
  )

  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    ...upsertRequirementsMutationOptions(),

    onSuccess: () => {
      queryClient.invalidateQueries(tournamentQueryOptions(tournamentId))

      onCancel()
    },
  })

  const form = useAppForm({
    defaultValues: {
      requirements: defaultRequirements ?? [],
      name:
        selectedFormat?.display === "Custom"
          ? ""
          : (selectedFormat?.display ?? name),
      displayDivision: selectedFormat?.displayDivision ?? displayDivision,
      displayGender: selectedFormat?.displayGender ?? displayGender,
    } as z.infer<typeof schema>,
    validators: {
      onMount: schema,
      onChange: schema,
    },
    onSubmit: ({
      value: { name, requirements, displayGender, displayDivision },
    }) => {
      mutate({
        name,
        tournamentDivisionId,
        requirements,
        divisionId: "", // derive from requirements based on format, pick most specific e.g. has max age
        displayGender,
        displayDivision,
      })
    },
  })

  useEffect(() => {
    if (selectedFormat) {
      for (const [i, requirement] of selectedFormat.requirements.entries()) {
        form.setFieldValue(`requirements[${i}].gender`, requirement?.gender)

        form.setFieldValue(
          `requirements[${i}].qualifiedDivisionId`,
          requirement?.defaultQualifiedDivisionId
        )

        form.setFieldValue(
          `requirements[${i}].minimum`,
          requirement?.minimum ?? 1
        )
      }

      form.setFieldValue(
        "name",
        selectedFormat?.display === "Custom"
          ? ""
          : (selectedFormat.display ?? name)
      )

      form.setFieldValue(
        "displayDivision",
        selectedFormat.displayDivision ?? displayDivision
      )

      form.setFieldValue(
        "displayGender",
        selectedFormat.displayGender ?? displayGender
      )
    } else {
      form.reset()
    }
  }, [form, selectedFormat, name, displayDivision, displayGender])

  return (
    <form
      className="flex flex-col space-y-2"
      onSubmit={(event) => {
        event.preventDefault()

        form.handleSubmit()
      }}
    >
      <Select
        label="Format"
        value={format}
        options={formats}
        onChange={(value) => {
          setFormat(value as string | null)
        }}
      />

      <form.AppField name="requirements" mode="array">
        {(field) => (
          <div className="flex flex-col space-y-2">
            {field.state.value?.map((req, i) => {
              const availableDivisions = divisionOptions.filter(({ value }) =>
                selectedFormat?.requirements[i]?.qualifiedDivisionIds.includes(
                  value
                )
              )

              return (
                <>
                  <span className="font-semibold">
                    Player {i + 1} Requirement
                  </span>
                  <form.AppField name={`requirements[${i}].gender`}>
                    {(subField) => (
                      <>
                        <subField.Select
                          isRequired={true}
                          label="Gender"
                          field={subField}
                          options={[
                            {
                              value: "male",
                              display: getGenderDisplay(
                                availableDivisions.map(({ value }) => value),
                                "male"
                              ),
                            },
                            {
                              value: "female",
                              display: getGenderDisplay(
                                availableDivisions.map(({ value }) => value),
                                "female"
                              ),
                            },
                          ]}
                          placeholder="Select a gender"
                          className="col-span-full"
                        />
                      </>
                    )}
                  </form.AppField>
                  <form.AppField
                    name={`requirements[${i}].qualifiedDivisionId`}
                  >
                    {(subField) => (
                      <subField.Select
                        isRequired={true}
                        label="Division"
                        field={subField}
                        options={
                          selectedFormat
                            ? divisionOptions.filter(({ value }) =>
                                selectedFormat.requirements[
                                  i
                                ]?.qualifiedDivisionIds.includes(value)
                              )
                            : divisionOptions
                        }
                        placeholder="Select a division"
                        className="col-span-full"
                      />
                    )}
                  </form.AppField>
                </>
              )
            })}

            {format === "custom" && (
              <form.Subscribe
                selector={(state) => pick(state.values, ["requirements"])}
              >
                {({ requirements }) => (
                  <Button
                    color="primary"
                    size="sm"
                    isDisabled={
                      requirements ? requirements.length >= teamSize : false
                    }
                    onPress={() => {
                      field.handleChange((curr) =>
                        (curr ?? []).concat({
                          gender: null,
                          qualifiedDivisionId: null,
                          minimum: 1,
                          tournamentDivisionId,
                        })
                      )
                    }}
                  >
                    <PlusIcon /> Add requirement
                  </Button>
                )}
              </form.Subscribe>
            )}
          </div>
        )}
      </form.AppField>

      {format === "custom" && (
        <>
          <form.AppField name={"name"}>
            {(field) => <field.Text label="Name" field={field} />}
          </form.AppField>

          <form.AppField name={"displayDivision"}>
            {(field) => (
              <field.Checkbox label="Display division" field={field} />
            )}
          </form.AppField>

          <form.AppField name={"displayGender"}>
            {(field) => <field.Checkbox label="Display gender" field={field} />}
          </form.AppField>
        </>
      )}

      <form.AppForm>
        <form.Footer>
          <Button onPress={onCancel}>Cancel</Button>

          <form.SubmitButton>Submit</form.SubmitButton>
        </form.Footer>
      </form.AppForm>
    </form>
  )
}
