import type { CalendarDate } from "@internationalized/date"
import { CalendarIcon } from "lucide-react"
import {
  type DatePickerProps as AriaDatePickerProps,
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DatePicker,
  type DateValue,
  Dialog,
  Heading,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { Popover } from "@/components/base/popover"
import { composeTailwindRenderProps } from "@/components/base/utils"
import { useIsMounted } from "@/lib/dom"
import { DateInput } from "./date"
import { Description, Errors, type FieldProps, Group, Label } from "./shared"

export type DatePickerProps<T extends DateValue> = FieldProps &
  Omit<AriaDatePickerProps<T>, "shouldForceLeadingZeros">

const calendarGridCellStyles = tv({
  base: "p-1 m-1 rounded-lg text-center forced-colors:text-[ButtonText]",
  variants: {
    isHovered: {
      true: "bg-gray-200",
    },
    isFocused: {
      true: "bg-blue-200 text-black forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
    },
    isOutsideMonth: {
      true: "text-gray-400",
    },
    isDisabled: {
      true: "text-gray-400",
    },
  },
  compoundVariants: [
    {
      isFocused: true,
      isHovered: true,
      class: "bg-blue-300",
    },
  ],
})

export function DatePickerField({
  label,
  description,
  field,
  className,
  ...props
}: DatePickerProps<CalendarDate>) {
  const isMounted = useIsMounted()

  return (
    <DatePicker
      {...props}
      className={composeTailwindRenderProps(className, "flex flex-col gap-1")}
      name={field.name}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      shouldForceLeadingZeros={true}
      isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
      isDisabled={!isMounted || props.isDisabled}
    >
      {label && <Label isRequired={props.isRequired}>{label}</Label>}
      <Group>
        <DateInput isInGroup />
        <Button className="flex items-center px-2 rounded-r-lg text-gray-600 hover:bg-gray-200 border-s-1 border-black">
          <CalendarIcon size={18} />
        </Button>
      </Group>
      {description && <Description>{description}</Description>}
      <Errors field={field} />
      <Popover>
        <Dialog>
          <Calendar className="border border-gray-300 outline-0 p-1 min-w-xs shadow-lg rounded-lg bg-popover outline-hidden max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]">
            <header className="grid grid-cols-7">
              <Button
                slot="previous"
                className="col-span-1 rounded-lg hover:bg-gray-200 p-2"
              >
                ◀
              </Button>
              <Heading className="col-span-5 flex items-center justify-center" />
              <Button
                slot="next"
                className="col-span-1 rounded-lg hover:bg-gray-200 p-2"
              >
                ▶
              </Button>
            </header>
            <CalendarGrid className="w-full">
              {(date) => (
                <CalendarCell className={calendarGridCellStyles} date={date} />
              )}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  )
}
