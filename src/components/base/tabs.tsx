import { createLink } from "@tanstack/react-router"
import {
  composeRenderProps,
  Tab as RACTab,
  TabList as RACTabList,
  TabPanel as RACTabPanel,
  Tabs as RACTabs,
  type TabListProps,
  type TabPanelProps,
  type TabProps,
  type TabsProps,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { focusRing } from "./utils"

const tabsStyles = tv({
  base: "flex",
  variants: {
    orientation: {
      horizontal: "flex-col",
      vertical: "flex-row w-[800px]",
    },
  },
})

export function Tabs(props: TabsProps) {
  return (
    <RACTabs
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabsStyles({ ...renderProps, className })
      )}
    />
  )
}

const tabListStyles = tv({
  base: "flex gap-1",
  variants: {
    orientation: {
      horizontal: "flex-row justify-center border-b-2 border-gray-300",
      vertical: "flex-col items-start",
    },
  },
})

export function TabList<T extends object>(props: TabListProps<T>) {
  return (
    <RACTabList
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabListStyles({ ...renderProps, className })
      )}
    />
  )
}

const tabProps = tv({
  extend: focusRing,
  base: "flex items-center cursor-default px-4 py-1.5 text-sm font-medium transition forced-color-adjust-none",
  variants: {
    isSelected: {
      false:
        "text-gray-700 hover:text-gray-800 pressed:text-gray-800 border-b-4 border-transparent hover:border-gray-800 pressed:border-gray-800",
      true: "text-navbar-background border-b-4 border-navbar-background forced-colors:text-[HighlightText] forced-colors:bg-[Highlight]",
    },
    isDisabled: {
      true: "text-gray-500 hover:text-gray-500 hover:border-transparent cursor-not-allowed forced-colors:text-[GrayText] selected:text-gray-600 forced-colors:selected:text-[HighlightText] selected:bg-gray-500 forced-colors:selected:bg-[GrayText]",
    },
  },
})

export function Tab(props: TabProps) {
  return (
    <RACTab
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabProps({ ...renderProps, className })
      )}
    />
  )
}

export const TabLink = createLink(Tab)

const tabPanelStyles = tv({
  extend: focusRing,
  base: "flex-1 text-sm text-content-foreground",
})

export function TabPanel(props: TabPanelProps) {
  return (
    <RACTabPanel
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        tabPanelStyles({ ...renderProps, className })
      )}
    />
  )
}
