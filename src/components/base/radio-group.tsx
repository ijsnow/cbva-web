import { ReactNode } from "react"
import {
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
  RadioGroupProps as RACRadioGroupProps,
  RadioProps,
  ValidationResult,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { Description, FieldError, Label } from "./field"
import { composeTailwindRenderProps, focusRing } from "./utils"
import { twMerge } from "tailwind-merge"

export interface RadioGroupProps extends Omit<RACRadioGroupProps, "children"> {
  label?: string
  children?: ReactNode
  orienation?: "vertical" | "horizontal"
  description?: string
  errorMessage?: string | ((validation: ValidationResult) => string)
}

export function RadioGroup(props: RadioGroupProps) {
  const orientation = props.orientation ?? "vertical"
  return (
    <RACRadioGroup
      {...props}
      orientation={orientation}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-2"
      )}
    >
      <Label>{props.label}</Label>
      <div
        className={twMerge(
          "flex gap-2",
          orientation === "vertical" ? "flex-col" : "gap-4"
        )}
      >
        {props.children}
      </div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </RACRadioGroup>
  )
}

const styles = tv({
  extend: focusRing,
  base: "w-5 h-5 box-border rounded-full border-2 bg-white transition-all",
  variants: {
    isSelected: {
      false: "border-gray-400 group-pressed:border-gray-500",
      true: "border-[7px] border-gray-700 forced-colors:border-[Highlight]! group-pressed:border-gray-800 dark:group-pressed:border-slate-200",
    },
    isInvalid: {
      true: "border-red-700 group-pressed:border-red-800 forced-colors:border-[Mark]!",
    },
    isDisabled: {
      true: "border-gray-200 forced-colors:border-[GrayText]!",
    },
  },
})

export function Radio(props: RadioProps) {
  return (
    <RACRadio
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex relative gap-2 items-center group text-gray-800 disabled:text-gray-300 forced-colors:disabled:text-[GrayText] text-sm transition"
      )}
    >
      {(renderProps) => (
        <>
          <div className={styles(renderProps)} />
          {props.children}
        </>
      )}
    </RACRadio>
  )
}
