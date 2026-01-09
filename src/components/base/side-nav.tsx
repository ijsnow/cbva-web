import { createLink, type LinkOptions } from "@tanstack/react-router"
import { useEventListener } from "ahooks"
import { SidebarCloseIcon, SidebarOpenIcon } from "lucide-react"
import { useRef, useState } from "react"
import {
  Menu,
  MenuItem,
  type MenuItemProps,
  type MenuProps,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"
import { Button } from "./button"
import { Link } from "./link"
import { composeTailwindRenderProps, focusRing } from "./utils"

const containerStyles = tv({
  base: "absolute left-0 top-0 bottom-0 z-10 md:relative md:w-fit flex flex-row",
  variants: {
    expanded: {
      false: "w-0",
      true: "w-fit",
    },
  },
})

const treeStyles = tv({
  base: "order-1 overflow-hidden md:relative border-r-2 border-gray-300 bg-white min-h-full md:w-auto transition-[width] delay-150 duration-300 ease-in-out",
  variants: {
    expanded: {
      false: "w-0",
      true: "w-full",
    },
  },
})

const toggleButtonStyles = tv({
  base: "md:hidden z-11 order-2 mt-2 ml-2",
  variants: {
    expanded: {
      false: "", // "abso!lute top-2 left-2",
      true: "", // "absol!ute top-2 -right-2 transl!ate-x-full",
    },
  },
})

export function SideNav<T extends object>({
  children,
  ...props
}: MenuProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const [expanded, setExpanded] = useState(false)

  useEventListener("click", (event) => {
    if (
      !toggleRef.current?.contains(event.target as Node) &&
      !containerRef.current?.contains(event.target as Node)
    ) {
      setExpanded(false)
    }
  })

  return (
    <div className={containerStyles({ expanded })} ref={containerRef}>
      <Button
        ref={toggleRef}
        className={toggleButtonStyles({ expanded })}
        variant="icon"
        radius="full"
        color="alternate"
        onPress={() => {
          setExpanded((s) => !s)
        }}
      >
        {expanded ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
      </Button>
      <Menu
        {...props}
        aria-label="Side Navigation"
        className={composeTailwindRenderProps(
          props.className,
          treeStyles({ expanded })
        )}
      >
        {children}
      </Menu>
    </div>
  )
}

const itemPadding = "py-2 px-3"

const itemStyles = tv({
  extend: focusRing,
  base: "relative w-48 flex group gap-3 cursor-default select-none text-sm text-gray-900 bg-white border-y border-transparent first:border-t-0 last:border-b-0 -mb-px last:mb-0 -outline-offset-2",
  variants: {
    link: {
      true: "",
      false: itemPadding,
    },
    isSelected: {
      false: "hover:bg-gray-100",
      true: "bg-blue-100 hover:bg-blue-200 border-y-blue-200 z-20",
    },
    isDisabled: {
      true: "text-slate-300 forced-colors:text-[GrayText] z-10",
    },
  },
})

export interface SideNavItemProps
  extends Partial<MenuItemProps>,
    Partial<Pick<LinkOptions, "to">> {
  title: string
}

export function SideNavItem(props: SideNavItemProps) {
  const content = (
    <div className={"flex items-center"}>
      <div className="shrink-0 w-[calc(calc(var(--SideNav-item-level)-1)*calc(var(--spacing)*3))]" />
      {props.title}
    </div>
  )

  const children = props.to ? (
    <Link
      to={props.to}
      className={twMerge(itemPadding, "no-underline w-full h-full")}
    >
      {content}
    </Link>
  ) : (
    content
  )

  return (
    <MenuItem
      className={itemStyles({ link: Boolean(props.to) })}
      textValue={props.title}
      {...props}
    >
      {children}
    </MenuItem>
  )
}

export const SideNavItemLink = createLink(SideNavItem)
