import {
  createLink,
  Link,
  type LinkOptions,
  useRouter,
} from "@tanstack/react-router"
import clsx from "clsx"
import { Check, ChevronDown } from "lucide-react"
import type { ReactNode } from "react"
import {
  Select as AriaSelect,
  Button,
  composeRenderProps,
  type Key,
  ListBox,
  ListBoxItem,
  type ListBoxItemRenderProps,
  Popover,
  type SelectionMode,
  type SelectProps,
  SelectValue,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { focusRing } from "@/components/base/utils"
import {
  Description,
  Errors,
  fieldGroupStyles,
  inputStyles,
  Label,
} from "./form/fields/shared"

export type Option<Value extends Key> = {
  value: Value
  display: string
  link?: LinkOptions
  beforeDisplay?: ReactNode
  afterDisplay?: ReactNode
}

export type SelectFieldProps<
  Value extends Key,
  Mode extends "single" | "multiple" = "single",
> = SelectProps<Option<Value>, Mode> & {
  label?: ReactNode
  description?: ReactNode
  name?: string
  isInvalid?: boolean
  options: Option<Value>[]
  containerClassName?: string
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

export const valueStyles = tv({
  base: "flex-1 text-sm placeholder-shown:italic placeholder-shown:text-placeholder",
  variants: {
    isPlaceholder: {
      true: "text-placeholder italic",
    },
  },
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

const ListBoxItemLink = createLink(ListBoxItem)

export function Select<
  Value extends Key,
  Mode extends "single" | "multiple" = "single",
>({
  label,
  description,
  placeholder,
  options,
  name,
  onBlur,
  isInvalid,
  className,
  containerClassName,
  ...props
}: SelectFieldProps<Value, Mode>) {
  const router = useRouter()

  return (
    <AriaSelect
      {...props}
      className={containerClassName}
      name={name}
      onOpenChange={(open) => {
        if (!open && onBlur) {
          onBlur()
        }
      }}
      isInvalid={isInvalid}
      placeholder={placeholder}
    >
      {({ isOpen }) => (
        <>
          {label && <Label isRequired={props.isRequired}>{label}</Label>}
          <Button
            className={(render) =>
              clsx(
                "flex items-center overflow-hidden text-start gap-4 w-full cursor-default px-2 py-1.5 hover:bg-gray-200",
                className,
                focusRing(render),
                fieldGroupStyles(render),
                inputStyles(render)
                // "items-center!",
              )
            }
            onBlur={(e) => {
              if (!isOpen && onBlur) {
                onBlur(e)
              }
            }}
          >
            <SelectValue className={valueStyles}>
              {({
                // selectedItems,
                // selectedItem,
                defaultChildren,
                state,
                // ...rest
              }) => {
                const selected = options
                  .filter(({ value }) =>
                    state.selectionManager.selectedKeys.has(value)
                  )
                  .map(({ display }) => display)

                if (selected.length) {
                  return selected.join(", ")
                }

                return defaultChildren
              }}
            </SelectValue>
            <ChevronDown
              aria-hidden
              className="mx-2 w-4 h-4 text-gray-600 self-center forced-colors:text-[ButtonText] group-disabled:text-gray-200 forced-colors:group-disabled:text-[GrayText]"
            />
          </Button>
          {description && <Description>{description}</Description>}
          <Popover
            className={composeRenderProps(
              "min-w-(--trigger-width)",
              (className, render) => popoverStyles({ ...render, className })
            )}
          >
            <ListBox
              items={options}
              className="border border-gray-300 outline-0 p-1 shadow-lg rounded-lg bg-popover outline-hidden max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]"
            >
              {options.map(({ value, display, afterDisplay, link }) => {
                const renderFn = ({ isSelected }: ListBoxItemRenderProps) => (
                  <>
                    <span className="flex items-center flex-1 gap-2 font-normal truncate group-selected:font-semibold">
                      {display}
                      {afterDisplay && (
                        <span className="italic text-gray-600">
                          {afterDisplay}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center w-5">
                      {isSelected && <Check className="w-4 h-4" />}
                    </span>
                  </>
                )

                const location = link ? router.buildLocation(link) : undefined

                return (
                  <ListBoxItem
                    key={value}
                    id={value}
                    className={itemStyles}
                    href={location?.href}
                  >
                    {renderFn}
                  </ListBoxItem>
                )
              })}
            </ListBox>
          </Popover>
        </>
      )}
    </AriaSelect>
  )
}
