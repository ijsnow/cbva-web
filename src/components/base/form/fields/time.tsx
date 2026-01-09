import type { Time } from "@internationalized/date"
import {
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
} from "react-aria-components"
import { composeTailwindRenderProps } from "@/components/base/utils"
import { useIsMounted } from "@/lib/dom"
import { DateInput } from "./date"
import { type FieldProps, Label } from "./shared"

export type TimeFieldProps = FieldProps & AriaTimeFieldProps<Time>

export function TimeField({
  className,
  field,
  label,
  isRequired,
  isDisabled,
}: TimeFieldProps) {
  const isMounted = useIsMounted()

  return (
    <AriaTimeField
      className={composeTailwindRenderProps(className, "flex flex-col gap-1")}
      isRequired={isRequired}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isDisabled={!isMounted || isDisabled}
    >
      {label && <Label isRequired={isRequired}>{label}</Label>}

      <DateInput />
    </AriaTimeField>
  )
}
