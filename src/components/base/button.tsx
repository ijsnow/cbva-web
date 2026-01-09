import { forwardRef, type ReactNode, type Ref, RefObject } from "react"
import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  TooltipTrigger,
} from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import { useIsMounted } from "@/lib/dom"
import { Tooltip } from "./tooltip"
import { focusRing } from "./utils"

type ButtonVariants = VariantProps<typeof button>

export interface ButtonProps extends ButtonVariants, RACButtonProps {
  className?: string
  children: React.ReactNode
  tooltip?: ReactNode
}

export const button = tv({
  extend: focusRing,
  base: [
    "inline-flex",
    "items-center",
    "justify-center",
    "gap-2",
    "no-underline",
  ],
  variants: {
    variant: {
      solid: [],
      outline: [],
      dashed: [],
      filled: [],
      text: [],
      link: [],
      icon: [],
    },
    color: {
      default: [], //["bg-default", "text-default-foreground"],
      primary: [], // ["bg-primary", "text-primary-foreground", "border-transparent"],
      secondary: [], // ["bg-secondary", "text-secondary-foreground"],
      alternate: [], // ["bg-alternate", "text-alternate-foreground"],
      muted: [], // ["bg-muted", "text-muted-foreground"],
      accent: [],
    },
    size: {
      xs: "h-4 px-2 text-xs",
      sm: "h-6 px-3 text-xs",
      md: "h-8 px-4 text-sm",
      lg: "h-10 px-6 text-md",
      xl: "h-10 px-6 text-md",
      "4xl": "h-12 px-5 text-4xl ",
    },
    radius: {
      md: ["rounded-md"],
      full: ["rounded-full"],
    },
    isDisabled: {
      false: ["cursor-pointer"],
      true: ["opacity-50", "cursor-not-allowed"],
    },
    isHovered: {
      false: [],
      true: [],
    },
  },
  compoundVariants: [
    {
      variant: ["solid", "icon"],
      color: "default",
      class: [
        "bg-default",
        "hover:bg-default-hover",
        "text-default-foreground",
      ],
    },
    {
      variant: ["solid", "icon"],
      color: "primary",
      class: [
        "bg-primary",
        "hover:bg-primary-hover",
        "text-primary-foreground",
      ],
    },
    {
      variant: ["solid", "icon"],
      color: "secondary",
      class: ["bg-secondary", "text-secondary-foreground"],
    },
    {
      isHovered: true,
      variant: ["solid", "icon"],
      color: "secondary",
      class: ["bg-secondary-hover"],
    },
    {
      variant: ["solid", "icon"],
      color: "alternate",
      class: [
        "bg-alternate",
        "hover:bg-alternate-hover",
        "text-alternate-foreground",
        "aria-disabled:bg-default",
        "aria-disabled:cursor-not-allowed",
      ],
    },
    {
      variant: "solid",
      color: "accent",
      class: ["bg-cyan-300", "hover:bg-cyan-400", "text-default-foreground"],
    },
    {
      variant: ["outline", "dashed", "link", "text"],
      class: ["bg-transparent"],
    },
    { variant: ["outline", "dashed"], class: ["border"] },
    {
      variant: "dashed",
      class: ["border-dashed"],
    },
    {
      variant: "link",
      class: ["underline"],
    },
    {
      variant: ["outline", "dashed", "link", "text"],
      color: "default",
      class: [
        "text-default-foreground",
        "border-default",
        "hover:border-default-hover",
      ],
    },
    {
      variant: ["outline", "dashed", "link", "text"],
      color: "primary",
      class: [
        "text-primary",
        "border-primary",
        "hover:border-primary-hover",
        "hover:text-primary-hover",
      ],
    },
    {
      variant: ["outline", "dashed", "link", "text"],
      color: "secondary",
      class: [
        "text-secondary",
        "border-secondary",
        "hover:border-secondary-hover",
        "hover:text-secondary-hover",
      ],
    },
    {
      variant: ["outline", "dashed", "link", "text"],
      color: "alternate",
      class: [
        "text-alternate",
        "border-alternate",
        // "hover:border-alternate-hover",
        // "hover:text-alternate-hover",
      ],
    },
    {
      isHovered: true,
      isDisabled: false,
      variant: ["outline", "dashed", "link", "text"],
      color: "alternate",
      class: ["border-alternate-hover", "text-alternate-hover"],
    },
    {
      isDisabled: true,
      variant: ["outline", "dashed", "link", "text"],
      color: "alternate",
      class: ["text-primary", "border-primary"],
    },
    {
      variant: "filled",
      color: "default",
      class: [
        "bg-default/25",
        "hover:bg-default-hover/75",
        "text-default-foreground",
      ],
    },
    {
      variant: "filled",
      color: "primary",
      class: ["bg-primary/25", "hover:bg-primary-hover/50", "text-primary"],
    },
    {
      variant: "filled",
      color: "secondary",
      class: [
        "bg-secondary/25",
        "hover:bg-secondary-hover/50",
        "text-secondary",
      ],
    },
    {
      variant: "filled",
      color: "alternate",
      class: [
        "bg-alternate/25",
        "hover:bg-alternate-hover/50",
        "text-alternate",
      ],
    },
    // {
    // 	color: "secondary",
    // 	variant: "icon",
    // 	class: "text-secondary bg-transparent hover:bg-secondary/25",
    // },
    // {
    // 	color: "default",
    // 	variant: "icon",
    // 	class: "text-default-foreground bg-transparent hover:bg-default/25",
    // },
    {
      variant: "text",
      class: "px-0",
    },
    {
      variant: "text",
      isHovered: true,
      class: "underline",
    },
    {
      variant: "icon",
      size: "xs",
      class: "w-4 p-2",
    },
    {
      variant: "icon",
      size: "sm",
      class: "w-6 p-2",
    },
    // md: "h-8 px-4 text-sm",
    {
      variant: "icon",
      size: "md",
      class: "w-8 p-2",
    },
    // lg: "h-10 px-6 text-md",
    {
      variant: "icon",
      size: "lg",
      class: "w-10 p-2",
    },
    // xl: "h-10 px-6 text-md",
    // "4xl": "h-12 px-5 text-4xl ",
  ],
  defaultVariants: {
    disabled: false,
    color: "default",
    size: "md",
    radius: "md",
    variant: "solid",
  },
})

export const Button = forwardRef(
  (props: ButtonProps, ref: Ref<HTMLButtonElement>) => {
    const isMounted = useIsMounted()

    const node = (
      <RACButton
        {...props}
        ref={ref}
        isDisabled={!isMounted || props.isDisabled}
        className={composeRenderProps(
          props.className,
          (className, renderProps) =>
            button({
              ...renderProps,
              variant: props.variant,
              color: props.color,
              size: props.size,
              radius: props.radius,
              className,
            })
        )}
      />
    )

    if (props.tooltip) {
      return (
        <TooltipTrigger delay={100} closeDelay={50}>
          {node}
          <Tooltip>{props.tooltip}</Tooltip>
        </TooltipTrigger>
      )
    }

    return node
  }
)
