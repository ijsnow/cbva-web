import { useSuspenseQuery } from "@tanstack/react-query"
import clsx from "clsx"
import { EditIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/base/button"
import { tournamentQueryOptions } from "@/data/tournaments"
import { getTournamentDivisionDisplay } from "@/hooks/tournament"
import { DivisionForm } from "../controls/edit-divisions/division-form"
import { RemoveDivisionForm } from "../controls/edit-divisions/remove"

export function DivisionsForm({ tournamentId }: { tournamentId: number }) {
  const { data: tournamentDivisions } = useSuspenseQuery({
    ...tournamentQueryOptions(tournamentId),
    select: (data) => data?.tournamentDivisions,
  })

  const [addingOrEditId, setAddingOrEditId] = useState<
    true | number | undefined
  >(undefined)

  return (
    <>
      {tournamentDivisions?.map((td) => (
        <div
          key={td.id}
          className="flex flex-col space-y-2 last-of-type:border-b-0 border-b border-gray-300 py-2"
        >
          <div className="w-full flex flex-row justify-between items-center">
            <span className={clsx(td.id === addingOrEditId && "font-semibold")}>
              {getTournamentDivisionDisplay(td)}
            </span>

            <div className="flex flex-row gap-2">
              {/*<Button
							size="sm"
							isDisabled={
								addingOrEditId !== undefined ||
								editFormatDivisionId !== undefined
							}
							onPress={() => {
								setEditFormatDivisionId(td.id);
							}}
						>
							<EditIcon size={12} className="-mr" /> <span>Format</span>
						</Button>*/}
              <Button
                size="sm"
                isDisabled={
                  addingOrEditId !== undefined // || editFormatDivisionId !== undefined
                }
                onPress={() => {
                  setAddingOrEditId(td.id)
                }}
              >
                <EditIcon size={12} className="-mr" /> <span>Edit</span>
              </Button>

              <RemoveDivisionForm
                isDisabled={
                  addingOrEditId !== undefined // || editFormatDivisionId !== undefined
                }
                tournamentId={tournamentId}
                divisionId={td.id}
              />
            </div>
          </div>

          {addingOrEditId === td.id && (
            <DivisionForm
              showTitle={false}
              tournamentId={tournamentId}
              divisionId={addingOrEditId}
              onCancel={() => setAddingOrEditId(undefined)}
            />
          )}

          {/*{editFormatDivisionId === td.id && (
					<RequirementsForm
						tournamentId={tournamentId}
						tournamentDivisionId={editFormatDivisionId}
						divisionId={td.divisionId}
						name={td.name}
						displayGender={td.displayGender}
						displayDivision={td.displayDivision}
						teamSize={td.teamSize}
						onCancel={() => setEditFormatDivisionId(undefined)}
					/>
				)}*/}
        </div>
      ))}

      {addingOrEditId === true ? (
        <DivisionForm
          tournamentId={tournamentId}
          onCancel={() => setAddingOrEditId(undefined)}
        />
      ) : (
        <Button
          size="sm"
          onPress={() => setAddingOrEditId(true)}
          isDisabled={addingOrEditId !== undefined}
        >
          <PlusIcon size={12} /> Add division
        </Button>
      )}
    </>
  )
}
