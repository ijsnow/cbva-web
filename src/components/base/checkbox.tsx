import { Check, Minus } from "lucide-react"
import type { ReactNode } from "react"
import {
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
  type CheckboxProps as AriaCheckboxProps,
  composeRenderProps,
  type ValidationResult,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { Description, Label } from "./form/fields/shared"
import { composeTailwindRenderProps, focusRing } from "./utils"
import { Information } from "./information"

export interface CheckboxGroupProps
  extends Omit<AriaCheckboxGroupProps, "children"> {
  label?: string
  children?: ReactNode
  description?: string
  errorMessage?: string | ((validation: ValidationResult) => string)
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-2"
      )}
    >
      <Label>{props.label}</Label>
      {props.children}
      {props.description && <Description>{props.description}</Description>}
    </AriaCheckboxGroup>
  )
}

export const checkboxStyles = tv({
  base: "flex gap-2 items-center group text-sm transition relative",
  variants: {
    isDisabled: {
      false: "text-gray-800",
      true: "text-gray-300 forced-colors:text-[GrayText]",
    },
  },
})

export const boxStyles = tv({
  extend: focusRing,
  base: "w-5 h-5 shrink-0 rounded-sm flex items-center justify-center border-2 transition",
  variants: {
    isSelected: {
      false:
        "bg-white border-(--color) [--color:var(--color-gray-400)] group-pressed:[--color:var(--color-gray-500)]",
      true: "bg-(--color) border-(--color) [--color:var(--color-gray-700)] group-pressed:[--color:var(--color-gray-800)] forced-colors:[--color:Highlight]!",
    },
    isInvalid: {
      true: "[--color:var(--color-red-700)] forced-colors:[--color:Mark]! group-pressed:[--color:var(--color-red-800)] dark:group-pressed:[--color:var(--color-red-700)]",
    },
    isDisabled: {
      true: "[--color:var(--color-gray-200)] forced-colors:[--color:GrayText]!",
    },
  },
})

const iconStyles =
  "w-4 h-4 text-white group-disabled:text-gray-400 forced-colors:text-[HighlightText]"

export type CheckboxProps = AriaCheckboxProps & {
  label: ReactNode
  info?: ReactNode
}

export function Checkbox({ label, info, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        checkboxStyles({ ...renderProps, className })
      )}
    >
      {({ isSelected, isIndeterminate, ...renderProps }) => (
        <>
          <div
            className={boxStyles({
              isSelected: isSelected || isIndeterminate,
              ...renderProps,
            })}
          >
            {isIndeterminate ? (
              <Minus aria-hidden className={iconStyles} />
            ) : isSelected ? (
              <Check aria-hidden className={iconStyles} />
            ) : null}
          </div>
          <span className="flex flex-row items-center space-x-2">
            <span>{label}</span>
            {info && <Information>{info}</Information>}
          </span>
        </>
      )}
    </AriaCheckbox>
  )
}
