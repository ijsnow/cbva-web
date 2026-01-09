import { useSuspenseQuery } from "@tanstack/react-query"
import { linkOptions } from "@tanstack/react-router"
import { Label } from "react-aria-components"
import { ComboBox } from "@/components/base/combo-box"
import { venuesQueryOptions } from "@/data/venues"
import type { Venue } from "@/db/schema"

type Key = Venue["id"]

type FilterVenuesProps = {
  values: Set<Key>
}

export function FilterVenues({ values }: FilterVenuesProps) {
  const { data: options } = useSuspenseQuery({
    ...venuesQueryOptions(),
    select: (venues) =>
      venues.map(({ id, name, city }) => ({
        value: id,
        display: `${name}, ${city}`,
        link: linkOptions({
          search: (search) => {
            const venues = search.venues ?? []

            return {
              ...search,
              page: 1,
              venues: values.has(id)
                ? venues.filter((v) => v !== id)
                : venues.concat(id),
            }
          },
        }),
      })),
  })

  return (
    <div>
      <Label>Locations</Label>

      <ComboBox
        selectedKeys={values}
        items={options}
        placeholder="Locations"
        multi={true}
      />
    </div>
  )
}
