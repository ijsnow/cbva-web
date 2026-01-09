import clsx from "clsx"
import {
  TextField as AriaTextField,
  Input,
  type TextFieldProps as RACTextFieldProps,
} from "react-aria-components"
import { useIsMounted } from "@/lib/dom"
import type { FieldProps } from "./shared"
import { Description, Errors, inputStyles, Label } from "./shared"

export type TextFieldProps = FieldProps & RACTextFieldProps

export function TextField({
  className,
  label,
  description,
  placeholder,
  field,
  ...props
}: TextFieldProps) {
  const isMounted = useIsMounted()

  return (
    <AriaTextField
      {...props}
      className={clsx("flex flex-col gap-1", className)}
      name={field.name}
      value={field.state.value ?? ""}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
      isDisabled={!isMounted || props.isDisabled}
    >
      {label && <Label isRequired={props.isRequired}>{label}</Label>}
      <Input placeholder={placeholder} className={inputStyles} />
      {description && <Description>{description}</Description>}
      <Errors field={field} />
    </AriaTextField>
  )
}
