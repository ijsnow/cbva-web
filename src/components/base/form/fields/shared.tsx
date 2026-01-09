import type { AnyFieldApi } from "@tanstack/react-form"
import uniqBy from "lodash-es/uniqBy"
import type { ReactNode } from "react"
import {
  Label as AriaLabel,
  FieldError,
  type GroupProps,
  type LabelProps,
  Group as RACGroup,
  Text,
  type TextProps,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"
import { focusRing } from "@/components/base/utils"

export type FieldProps = {
  label?: ReactNode
  description?: ReactNode
  placeholder?: string

  field: AnyFieldApi
}

export const inputSpacingStyles = tv({
  base: "px-2 py-1.5",
})

export const fieldBorderStyles = tv({
  extend: focusRing,
  base: "rounded-lg border border-black border border-black",
  variants: {
    isFocusWithin: {
      false: "forced-colors:border-[ButtonBorder]",
      true: "", // "bg-transparent forced-colors:border-[Highlight]",
    },
    isFocused: {
      true: "",
    },
    isInvalid: {
      true: "border-red-600 forced-colors:border-[Mark]",
    },
    isDisabled: {
      true: "text-gray-400 cursor-not-allowed forced-colors:border-[GrayText]",
    },
    isHovered: {
      true: "bg-gray-100",
    },
  },
  compoundVariants: [
    {
      isFocusWithin: true,
      isHovered: true,
      class: "bg-transparent",
    },
    {
      isFocused: true,
      isHovered: true,
      class: "bg-transparent",
    },
    {
      isHovered: true,
      isDisabled: true,
      class: "bg-transparent",
    },
  ],
})

export const baseInputStyles = "px-2 py-1.5 flex-1 text-sm outline-0 min-w-0"

export const inputStyles = tv({
  extend: focusRing,
  base: [
    "rounded-lg border border-black border border-black placeholder:italic",
    baseInputStyles,
  ],
  variants: fieldBorderStyles.variants,
  compoundVariants: fieldBorderStyles.compoundVariants,
})

export function Label({
  isRequired,
  className,
  ...props
}: LabelProps & { isRequired?: boolean }) {
  return (
    <AriaLabel
      {...props}
      className={twMerge(
        "text-sm text-black font-medium cursor-default w-fit",
        isRequired && "after:ml-0.5 after:text-red-500 after:content-['*']",
        className
      )}
    />
  )
}

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge("text-sm text-gray-600", props.className)}
    />
  )
}

export function Errors({ field }: { field: AnyFieldApi }) {
  const errors = uniqBy(field.state.meta.errors, ({ message }) => message)

  return (
    <FieldError>
      <ul>
        {errors.map(({ message }: { message: string }) => (
          <li key={message}>
            <Text slot="errorMessage" className="text-red-600 text-sm">
              {message}
            </Text>
          </li>
        ))}
      </ul>
    </FieldError>
  )
}

export const fieldGroupStyles = tv({
  extend: fieldBorderStyles,
  base: "pr-0 group flex items-stretch forced-colors:bg-[Field]",
  variants: fieldBorderStyles.variants,
  compoundVariants: fieldBorderStyles.compoundVariants,
})

export function Group(props: GroupProps) {
  return <RACGroup {...props} className={fieldGroupStyles} />
}
