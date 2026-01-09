import type { ReactNode } from "react"
import { twMerge } from "tailwind-merge"
import {
  SideNav,
  SideNavItem,
  type SideNavItemProps,
} from "@/components/base/side-nav"
import { ImpersonatorControls } from "@/components/impersonator/controls"
import { Navbar } from "@/components/navbar"

export function DefaultLayout({
  classNames = { content: "pt-18 pb-12 space-y-12 w-full" },
  children,
  sideNavItems,
}: {
  classNames?: { content?: string }
  children: ReactNode
  sideNavItems?: SideNavItemProps[]
}) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-content-background text-content-foreground">
      <header>
        <Navbar />
      </header>

      <div className="flex flex-row h-full flex-1 relative">
        {sideNavItems && (
          <SideNav>
            {sideNavItems.map((props) => (
              <SideNavItem key={props.title} {...props} />
            ))}
          </SideNav>
        )}

        <div className={twMerge("relative flex-1", classNames.content)}>
          {children}
        </div>
      </div>

      <ImpersonatorControls />
    </div>
  )
}
