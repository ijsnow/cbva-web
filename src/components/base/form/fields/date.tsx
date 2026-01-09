import type { CalendarDate } from "@internationalized/date"
import {
  DateField as AriaDateField,
  type DateFieldProps as AriaDateFieldProps,
  DateInput as AriaDateInput,
  type DateInputProps,
  DateSegment,
  type DateValue,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { composeTailwindRenderProps } from "@/components/base/utils"
import { useIsMounted } from "@/lib/dom"
import {
  baseInputStyles,
  Description,
  Errors,
  type FieldProps,
  fieldGroupStyles,
  Label,
} from "./shared"

export type DateFieldProps<T extends DateValue> = {
  picker?: boolean
} & FieldProps &
  Omit<AriaDateFieldProps<T>, "shouldForceLeadingZeros">

export function DateField({
  label,
  description,
  field,
  picker,
  ...props
}: DateFieldProps<CalendarDate>) {
  const isMounted = useIsMounted()

  return (
    <AriaDateField
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      shouldForceLeadingZeros={true}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-1"
      )}
      isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
      isDisabled={!isMounted || props.isDisabled}
    >
      {label && <Label isRequired={props.isRequired}>{label}</Label>}
      <DateInput />
      {description && <Description>{description}</Description>}
      <Errors field={field} />
    </AriaDateField>
  )
}

const segmentStyles = tv({
  base: "inline p-0.5 type-literal:px-0 rounded-xs outline outline-0 forced-color-adjust-none caret-transparent text-gray-800 forced-colors:text-[ButtonText]",
  variants: {
    isPlaceholder: {
      true: "text-placeholder italic",
    },
    isDisabled: {
      true: "cursor-not-allowed text-gray-400 forced-colors:text-[GrayText]",
    },
    isFocused: {
      true: "bg-blue-200 text-black forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
    },
  },
})

export function DateInput({
  isInGroup,
  ...props
}: Omit<DateInputProps, "children"> & { isInGroup?: boolean }) {
  return (
    <AriaDateInput
      className={
        isInGroup
          ? baseInputStyles
          : (renderProps) =>
              fieldGroupStyles({
                ...renderProps,
                class:
                  "block w-full px-2 py-1.5 text-sm data-[focus-within='true']:bg-transparent",
              })
      }
      {...props}
    >
      {(segment) => <DateSegment segment={segment} className={segmentStyles} />}
    </AriaDateInput>
  )
}
