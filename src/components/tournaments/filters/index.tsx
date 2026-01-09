import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import z from "zod"
import { button } from "@/components/base/button"
import { Checkbox } from "@/components/base/checkbox"
import { UnderConstruction } from "@/components/under-construction"
import { genderSchema } from "@/db/schema/shared"
import { FilterDivisions } from "./divisions"
import { FilterGender } from "./gender"
import { FilterVenues } from "./venues"

export const tournamentListFilterSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(25),
  divisions: z.array(z.number()).default([]),
  venues: z.array(z.number()).default([]),
  genders: z.array(genderSchema).default([]),
  past: z.boolean().default(false),
})

export type TournamentListFiltersProps = z.infer<
  typeof tournamentListFilterSchema
>

export function TournamentListFilters({
  page,
  pageSize,
  divisions,
  venues,
  genders,
  past,
}: TournamentListFiltersProps) {
  const navigate = useNavigate()

  return (
    <div className="max-w-xl mx-auto flex flex-col space-y-2 px-2">
      <UnderConstruction description="I'll be adding more filters here. Date range, names, juniors only, etc. Let me know what you'd like to have." />
      <FilterVenues values={new Set(venues)} />
      <FilterDivisions values={new Set(divisions)} />
      <FilterGender values={new Set(genders)} />
      <Checkbox
        isSelected={past}
        onChange={(value) => {
          navigate({
            // to: router.location.pathname,
            search: {
              page,
              pageSize,
              divisions,
              venues,
              genders,
              past: value,
            },
          })
        }}
        label={<>Past Tournaments Only</>}
      />
      <Link className={button({ class: "mt-2" })} search={{}}>
        Clear Filters
      </Link>
    </div>
  )
}
