import {
  createLink,
  type LinkProps,
  useLinkProps,
} from "@tanstack/react-router"
import { ChevronDownIcon, MenuIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  composeRenderProps,
  Menu,
  MenuItem,
  type MenuItemProps,
  MenuTrigger,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { Button } from "./button"
import { Popover } from "./popover"

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

const popoverStyles = tv({
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

export type DropdownMenuProps = {
  buttonContent?: ReactNode
  label?: string
  buttonClassName?: string
  children: ReactNode
}

export function DropdownMenu({
  label = "Menu",
  buttonContent,
  buttonClassName,
  children,
}: DropdownMenuProps) {
  return (
    <MenuTrigger>
      <Button
        aria-label={label}
        variant={buttonContent ? "text" : "icon"}
        className={buttonClassName}
      >
        {buttonContent} {buttonContent ? <ChevronDownIcon /> : <MenuIcon />}
      </Button>
      <Popover
        className={composeRenderProps("min-w-xs", (className, render) =>
          popoverStyles({ ...render, className })
        )}
      >
        <Menu className="border border-gray-300 outline-0 p-1 shadow-lg rounded-lg bg-popover outline-hidden max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]">
          {children}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}

export function DropdownMenuItem({ className, ...props }: MenuItemProps) {
  return (
    <MenuItem
      {...props}
      className={composeRenderProps(className, (className, render) =>
        itemStyles({ ...render, className })
      )}
    />
  )
}

export const DropdownMenuItemLink = createLink(DropdownMenuItem)
