import clsx from "clsx"
import { XIcon } from "lucide-react"
import type { ReactNode } from "react"
import {
  Dialog,
  type DialogProps,
  Heading,
  ModalOverlay,
  type ModalOverlayProps,
  Modal as RACModal,
} from "react-aria-components"
import { tv } from "tailwind-variants"
import { Button } from "./button"
import { type TitleProps, title } from "./primitives"

const overlayStyles = tv({
  base: "fixed top-0 left-0 w-full h-(--visual-viewport-height) isolate z-20 bg-black/[15%] flex items-center justify-center p-4 text-center backdrop-blur-lg",
  variants: {
    isEntering: {
      true: "animate-in fade-in duration-200 ease-out",
    },
    isExiting: {
      true: "animate-out fade-out duration-200 ease-in",
    },
  },
})

const modalStyles = tv({
  base: "w-full max-w-md max-h-full overflow-y-scroll rounded-2xl bg-white forced-colors:bg-[Canvas] text-left align-middle shadow-2xl bg-clip-padding border border-black/10 dark:border-white/10",
  variants: {
    isEntering: {
      true: "animate-in zoom-in-105 ease-out duration-200",
    },
    isExiting: {
      true: "animate-out zoom-out-95 ease-in duration-200",
    },
    size: {
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export function Modal({
  isDismissable = true,
  children,
  size,
  isOpen,
  onOpenChange,
  ...props
}: Omit<ModalOverlayProps, "children"> &
  Pick<DialogProps, "children"> & { size?: "2xl" | "xl" | "lg" | "md" }) {
  return (
    <ModalOverlay
      {...props}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isDismissable}
      className={overlayStyles}
    >
      <RACModal
        {...props}
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isDismissable}
        className={modalStyles({ size })}
      >
        <Dialog children={children} />
      </RACModal>
    </ModalOverlay>
  )
}

export type ModalHeadingProps = TitleProps & {
  children: ReactNode
}

export function ModalHeading({ children, ...props }: ModalHeadingProps) {
  return (
    <Heading
      className={clsx(
        title(props),
        "flex flex-row justify-between items-center w-full"
      )}
      slot="title"
    >
      <span>{children}</span>

      <Button variant="text" slot="close">
        <XIcon size={16} />
      </Button>
    </Heading>
  )
}
