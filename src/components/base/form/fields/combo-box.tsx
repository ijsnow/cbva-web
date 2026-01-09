import type { Key } from "react-aria-components"
import { type AsyncListOptions, useAsyncList } from "react-stately"
import { useIsMounted } from "@/lib/dom"
import { ComboBox, ComboBoxItem, type ComboBoxProps } from "../../combo-box"
import type { Option } from "../../select"
import type { FieldProps } from "./shared"

export type ComboBoxFieldProps<T extends Key> = {
  options?: Option<T>[] | null
} & Omit<ComboBoxProps<T>, "children"> &
  FieldProps

export function ComboBoxField<T extends Key>({
  field,
  options,
  isDisabled,
  disabledKeys,
  onSelectionChange,
  validationBehavior = "aria",
  ...props
}: ComboBoxFieldProps<T>) {
  const isMounted = useIsMounted()

  return (
    <ComboBox
      {...props}
      validationBehavior={validationBehavior}
      name={field.name}
      items={options || []}
      disabledKeys={disabledKeys}
      selectedKey={field.state.value}
      onSelectionChange={(value) => {
        field.handleChange(value)

        if (onSelectionChange) {
          onSelectionChange(value)
        }
      }}
      onOpenChange={(open) => {
        if (!open) {
          field.handleBlur()
        }
      }}
      isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
      isDisabled={!isMounted || !Boolean(options) || isDisabled}
    >
      {(item) => (
        <ComboBoxItem id={item.value} textValue={item.display}>
          {item.beforeDisplay} {item.display}
        </ComboBoxItem>
      )}
    </ComboBox>
  )
}

export function AsyncComboBoxField<T extends Key, C>({
  fetchOptions,
  ...props
}: Omit<ComboBoxFieldProps<T>, "options"> & {
  fetchOptions: AsyncListOptions<Option<T>, C>
}) {
  const options = useAsyncList<Option<T>, C>(fetchOptions)

  return (
    <ComboBoxField
      {...props}
      options={options.items || []}
      inputValue={options.filterText}
      onInputChange={options.setFilterText}
      onLoadMore={options.loadMore}
      loadingState={options.loadingState}
    />
  )
}
