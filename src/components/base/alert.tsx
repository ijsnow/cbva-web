import { AlertCircleIcon, AlertTriangleIcon, InfoIcon } from "lucide-react"
import type { ComponentType, ReactNode } from "react"
import { tv, type VariantProps } from "tailwind-variants"

const alertVariants = tv({
  base: "border-1 py-2 px-4 space-y-2 rounded-md",
  variants: {
    color: {
      info: "bg-blue-200 border-blue-300 text-blue-800",
      warning: "bg-yellow-200 border-yellow-300 text-yellow-800",
      error: "bg-red-200 border-red-300 text-red-800",
    },
  },
  defaultVariants: {
    variant: "solid",
    color: "error",
  },
})

type AlertVariants = VariantProps<typeof alertVariants>

export interface AlertProps extends AlertVariants {
  className?: string
  icon?: boolean
  title: ReactNode
  description: ReactNode
}

export function Alert({
  icon = true,
  title,
  description,
  ...props
}: AlertProps) {
  const icons: {
    [key: string]: ReactNode
  } = {
    info: <InfoIcon size={22} />,
    warning: <AlertTriangleIcon size={22} />,
    error: <AlertCircleIcon size={22} />,
  }

  const iconElem = icon && props.color ? icons[props.color] : null

  return (
    <div className={alertVariants(props)}>
      <h3 className="font-bold flex flex-row items-center space-x-2">
        {iconElem}
        <span>{title}</span>
      </h3>

      <p className="text-sm">{description}</p>
    </div>
  )
}
