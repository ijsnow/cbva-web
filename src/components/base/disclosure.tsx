"use client"
import clsx from "clsx"
import { ChevronRight } from "lucide-react"
import type React from "react"
import { useContext } from "react"
import {
  Disclosure as AriaDisclosure,
  DisclosureGroup as AriaDisclosureGroup,
  type DisclosureGroupProps as AriaDisclosureGroupProps,
  DisclosurePanel as AriaDisclosurePanel,
  type DisclosurePanelProps as AriaDisclosurePanelProps,
  type DisclosureProps as AriaDisclosureProps,
  Button,
  composeRenderProps,
  DisclosureGroupStateContext,
  DisclosureStateContext,
  Heading,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { tv, type VariantProps } from "tailwind-variants"
import { Information } from "./information"
import { composeTailwindRenderProps, focusRing } from "./utils"

const disclosure = tv({
  base: "group min-w-64 rounded-lg text-gray-900",
  variants: {
    card: {
      true: "border border-gray-200 dark:border-zinc-600",
      false: "",
    },
    isInGroup: {
      true: "border-0 border-b rounded-t-none first:rounded-t-lg last:border-b-0 rounded-b-none last:rounded-b-lg",
    },
  },
  defaultVariants: {
    card: true,
  },
})

const disclosureButton = tv({
  extend: focusRing,
  base: "bg-transparent border-0 rounded-lg flex gap-2 items-center w-full text-start cursor-default",
  variants: {
    isDisabled: {
      true: "text-gray-500 dark:text-zinc-600 forced-colors:text-[GrayText]",
    },
    isInGroup: {
      true: "-outline-offset-2 rounded-none group-first:rounded-t-lg group-last:rounded-b-lg",
    },
    card: {
      true: "p-2",
      false: "py-2",
    },
  },
  defaultVariants: {
    card: true,
  },
})

const chevron = tv({
  base: "w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ease-in-out",
  variants: {
    isExpanded: {
      true: "transform rotate-90",
    },
    isDisabled: {
      true: "text-gray-300 dark:text-zinc-600 forced-colors:text-[GrayText]",
    },
  },
})

export type DisclosureProps = AriaDisclosureProps & {
  children: React.ReactNode
} & VariantProps<typeof disclosure>

export function Disclosure({ card, children, ...props }: DisclosureProps) {
  const isInGroup = useContext(DisclosureGroupStateContext) !== null

  return (
    <AriaDisclosure
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        disclosure({ ...renderProps, isInGroup, card, className })
      )}
    >
      {children}
    </AriaDisclosure>
  )
}

const headerStyles = tv({
  base: "font-semibold m-0",
  variants: {
    size: {
      sm: ["text-sm"],
      md: ["text-base"],
      lg: ["text-lg"],
    },
  },
  defaultVariants: {
    size: "lg",
  },
})

export type DisclosureHeaderProps = {
  onPress?: () => void
  className?: string
  children: React.ReactNode
  info?: React.ReactNode
} & VariantProps<typeof headerStyles> &
  VariantProps<typeof disclosureButton>

export function DisclosureHeader({
  onPress,
  className,
  children,
  card,
  size = "lg",
  info,
}: DisclosureHeaderProps) {
  const { isExpanded } = useContext(DisclosureStateContext)!
  const isInGroup = useContext(DisclosureGroupStateContext) !== null

  return (
    <Heading
      className={headerStyles({
        className,
        size,
      })}
    >
      <Button
        slot={onPress ? undefined : "trigger"}
        onPress={onPress}
        className={(renderProps) =>
          disclosureButton({ ...renderProps, isInGroup, card })
        }
      >
        {({ isDisabled }) => (
          <>
            <ChevronRight
              aria-hidden
              className={chevron({ isExpanded, isDisabled })}
              size={
                {
                  sm: 8,
                  md: 12,
                  lg: 16,
                }[size]
              }
            />
            {children}
            {info && <Information>{info}</Information>}
          </>
        )}
      </Button>
    </Heading>
  )
}

export interface DisclosurePanelProps extends AriaDisclosurePanelProps {
  card?: boolean
  children: React.ReactNode
  contentClassName?: string
}

export function DisclosurePanel({
  card = true,
  children,
  contentClassName,
  ...props
}: DisclosurePanelProps) {
  return (
    <AriaDisclosurePanel
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "h-(--disclosure-panel-height) motion-safe:transition-[height] overflow-clip"
      )}
    >
      <div className={clsx("py-2", card ? "px-4" : "", contentClassName)}>
        {children}
      </div>
    </AriaDisclosurePanel>
  )
}

export interface DisclosureGroupProps extends AriaDisclosureGroupProps {
  children: React.ReactNode
}

export function DisclosureGroup({ children, ...props }: DisclosureGroupProps) {
  return (
    <AriaDisclosureGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "border border-gray-200 dark:border-zinc-600 rounded-lg"
      )}
    >
      {children}
    </AriaDisclosureGroup>
  )
}
