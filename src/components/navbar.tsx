import { Link, type LinkProps } from "@tanstack/react-router"
import clsx from "clsx"
import { MenuIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  Button,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
} from "react-aria-components"
import type { Viewer } from "@/auth"
import { useViewerId } from "@/auth/shared"
import { Popover } from "@/components/base/popover"

const links: {
  className?: string
  subMenuClassName?: string
  to: LinkProps["to"]
  label: ReactNode
  visible?: (viewer?: Viewer["id"] | null) => boolean
}[] = [
  {
    to: "/tournaments",
    label: "Tournaments",
  },
  {
    to: "/juniors",
    label: "Juniors",
  },
  {
    to: "/search",
    label: "Search",
  },
  {
    className: "hidden lg:inline-block",
    to: "/ratings",
    label: "Ratings",
  },
  {
    visible: (viewer) => !Boolean(viewer),
    className: "bg-gray-500 hidden md:inline-block",
    subMenuClassName: "md:hidden",
    to: "/log-in",
    label: "Log In",
  },
  {
    visible: (viewer) => !Boolean(viewer),
    className: "bg-red-500 hidden md:inline-block",
    subMenuClassName: "md:hidden",
    to: "/sign-up",
    label: "Sign Up",
  },
  {
    visible: (viewer) => Boolean(viewer),
    className: "hidden md:inline-block",
    subMenuClassName: "md:hidden",
    to: "/account",
    label: "Account",
  },
]

const linkClassName =
  "uppercase text-navbar-foreground hover:bg-navbar-foreground hover:text-navbar-foreground-hover px-3 py-1 font-bold tracking-wide"

export function Navbar() {
  const viewerId = useViewerId()

  const visibleLinks = links.filter(({ visible = () => true }) =>
    visible(viewerId)
  )

  return (
    <nav className="w-full bg-navbar-background flex items-center p-3 gap-3">
      <Menu
        aria-label="Navigation Menu"
        className="flex-1 w-full flex flex-row items-center justify-between lg:justify-center gap-3"
      >
        <MenuSection className="flex-1 gap-3 justify-end hidden lg:flex">
          {visibleLinks.slice(0, 3).map(({ to, label, className }) => (
            <MenuItem key={to} className="rounded-full outline-none">
              <Link
                to={to}
                className={clsx(linkClassName, "rounded-full", className)}
              >
                {label}
              </Link>
            </MenuItem>
          ))}
        </MenuSection>
        <MenuItem className="flex lg:justify-center transition-colors hover:brightness-75 rounded-full outline-none">
          <Link to="/">
            <img alt="CBVA Logo" src="/logos/cbva.svg" />
          </Link>
        </MenuItem>
        <MenuSection className="flex-1 justify-end lg:justify-start hidden md:flex gap-3">
          {visibleLinks.slice(3).map(({ to, label, className }) => (
            <MenuItem key={to} className="rounded-full outline-none">
              <Link
                to={to}
                className={clsx(linkClassName, "rounded-full", className)}
              >
                {label}
              </Link>
            </MenuItem>
          ))}
        </MenuSection>
      </Menu>
      <MenuTrigger trigger="press">
        <Button className="rounded-full p-2 lg:hidden text-navbar-foreground hover:bg-navbar-foreground hover:text-navbar-foreground-hover pressed:bg-navbar-foreground pressed:text-navbar-foreground-hover">
          <MenuIcon className="w-5 h-5" />
        </Button>
        <Popover>
          <Menu className="bg-navbar-background border border-navbar-border p-2 flex flex-col gap-2 rounded-lg">
            {visibleLinks.map(({ to, label, className, subMenuClassName }) => (
              <MenuItem
                key={to}
                className={clsx(
                  "rounded-lg items-stretch justify-stretch",
                  subMenuClassName
                )}
              >
                <Link
                  to={to}
                  className={clsx(
                    linkClassName,
                    "rounded-lg w-full inline-block",
                    className
                  )}
                >
                  {label}
                </Link>
              </MenuItem>
            ))}
          </Menu>
        </Popover>
      </MenuTrigger>
    </nav>
  )
}
