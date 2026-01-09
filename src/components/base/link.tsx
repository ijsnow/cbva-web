import { createLink } from "@tanstack/react-router"
import { type LinkProps, Link as ReactAriaLink } from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import { composeTailwindRenderProps } from "./utils"

const linkStyles = tv({
  base: "aria-disabled:no-underline aria-disabled:text-gray-700 aria-disabled:cursor-not-allowed",
  variants: {
    variant: {
      default: "underline hover:no-underline",
      alt: "no-underline hover:underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function BaseLink(props: LinkProps & VariantProps<typeof linkStyles>) {
  return (
    <ReactAriaLink
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        linkStyles({ variant: props.variant })
      )}
    />
  )
}

export const Link = createLink(BaseLink)
