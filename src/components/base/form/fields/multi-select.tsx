import clsx from "clsx"
import { Check, ChevronDown } from "lucide-react"
import {
  Button,
  composeRenderProps,
  type Key,
  ListBox,
  ListBoxItem,
  type ListBoxProps,
  MenuTrigger,
  Popover,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { focusRing } from "@/components/base/utils"
import type { FieldProps } from "./shared"
import { Description, Errors, inputStyles, Label } from "./shared"

export type Option<Value extends Key> = {
  value: Value
  display: string
}

export type MultiSelectFieldProps<Value extends Key> = FieldProps &
  Omit<ListBoxProps<Option<Value>>, "className"> & {
    options: Option<Value>[]
    isRequired?: boolean
    className?: string
  }

export const itemStyles = tv({
  base: "group flex text-popover-foreground items-center gap-4 cursor-default select-none py-2 pl-3 pr-1 rounded-lg outline outline-0 text-sm forced-color-adjust-none",
  variants: {
    isDisabled: {
      false: "text-popover-foreground",
      true: "text-gray-300 dark:text-zinc-600 forced-colors:text-[GrayText]",
    },
    isFocused: {
      true: "bg-popover-hover forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
    },
  },
  compoundVariants: [
    {
      isFocused: false,
      isOpen: true,
      className: "bg-gray-100",
    },
  ],
})

export const popoverStyles = tv({
  base: "bg-white forced-colors:bg-[Canvas] shadow-2xl rounded-xl bg-clip-padding border border-black/10 text-popover-foreground",
  variants: {
    isEntering: {
      true: "animate-in fade-in placement-bottom:slide-in-from-top-1 placement-top:slide-in-from-bottom-1 placement-left:slide-in-from-right-1 placement-right:slide-in-from-left-1 ease-out duration-200",
    },
    isExiting: {
      true: "animate-out fade-out placement-bottom:slide-out-to-top-1 placement-top:slide-out-to-bottom-1 placement-left:slide-out-to-right-1 placement-right:slide-out-to-left-1 ease-in duration-150",
    },
  },
})

export function MultiSelectField<Value extends Key>({
  label,
  description,
  placeholder,
  options,
  field,
  className,
  isRequired,
}: MultiSelectFieldProps<Value>) {
  const values: Set<Value> = field.state.value

  return (
    <MenuTrigger
      onOpenChange={(open) => {
        if (!open) {
          field.handleBlur()
        }
      }}
    >
      <div className={clsx("flex flex-col gap-2", className)}>
        {label && <Label isRequired={isRequired}>{label}</Label>}

        <Button
          className={(render) =>
            clsx(
              "flex items-center justify-between text-start gap-4 w-full cursor-default px-2 py-1.5 hover:bg-gray-200",
              focusRing(render),
              inputStyles(render)
            )
          }
        >
          <div className="flex flex-row gap-2">
            {values.size === 0 ? (
              <span className="text-placeholder italic">
                {placeholder || "Select options"}
              </span>
            ) : (
              options
                .filter(({ value }) => values.has(value))
                .map(({ display }) => display)
                .join(", ")
            )}
          </div>
          <ChevronDown
            aria-hidden
            className="mx-2 w-4 h-4 text-gray-600 forced-colors:text-[ButtonText] group-disabled:text-gray-200 forced-colors:group-disabled:text-[GrayText]"
          />
        </Button>
        {description && <Description>{description}</Description>}
        <Errors field={field} />

        <Popover
          className={composeRenderProps(
            "min-w-(--trigger-width)",
            (className, render) => popoverStyles({ ...render, className })
          )}
        >
          <ListBox
            items={options}
            selectionMode="multiple"
            selectionBehavior="toggle"
            onSelectionChange={field.handleChange}
            className="border border-gray-300 outline-0 p-1 shadow-lg rounded-lg bg-popover outline-hidden max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]"
          >
            {options.map(({ value, display }) => (
              <ListBoxItem key={value} id={value} className={itemStyles}>
                {({ isSelected }) => (
                  <>
                    <span className="flex items-center flex-1 gap-2 font-normal truncate group-selected:font-semibold">
                      {display}
                    </span>
                    <span className="flex items-center w-5">
                      {isSelected && <Check className="w-4 h-4" />}
                    </span>
                  </>
                )}
              </ListBoxItem>
            ))}
          </ListBox>
        </Popover>
      </div>
    </MenuTrigger>
  )
}
