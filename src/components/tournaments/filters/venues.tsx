import { useSuspenseQuery } from "@tanstack/react-query"
import { linkOptions } from "@tanstack/react-router"
import { Label } from "react-aria-components"
import { ComboBox, ComboBoxItem } from "@/components/base/combo-box"
import { venuesQueryOptions } from "@/data/venues"
import type { Venue } from "@/db"

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
          to: "/tournaments",
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
      <Label>Venues</Label>

      <ComboBox
        selectedKeys={values}
        items={options}
        placeholder="Venues"
        multi={true}
      >
        {(item) => (
          <ComboBoxItem id={item.value} link={item.link}>
            {item.display}
          </ComboBoxItem>
        )}
      </ComboBox>
    </div>
  )
}
