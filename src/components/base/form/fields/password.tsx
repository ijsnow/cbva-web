import { EyeIcon, EyeOffIcon } from "lucide-react"
import { type ReactNode, useState } from "react"
import {
  TextField as AriaTextField,
  Input,
  type TextFieldProps as RACTextFieldProps,
  ToggleButton,
} from "react-aria-components"

import { useIsMounted } from "@/lib/dom"
import {
  baseInputStyles,
  Description,
  Errors,
  type FieldProps,
  Group,
  Label,
} from "./shared"

export type PasswordFieldProps = FieldProps & RACTextFieldProps

export function PasswordField({
  label,
  labelRight,
  description,
  field,
  placeholder,
  ...props
}: Omit<PasswordFieldProps, "type"> & { labelRight?: ReactNode }) {
  const [isVisible, setVisible] = useState(false)
  const isMounted = useIsMounted()

  return (
    <AriaTextField
      {...props}
      className="flex flex-col gap-1"
      name={field.name}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
      isDisabled={!isMounted || props.isDisabled}
    >
      {label && (
        <div className="flex flex-row justify-between">
          <Label isRequired={props.isRequired}>{label}</Label>

          {labelRight && <Label>{labelRight}</Label>}
        </div>
      )}

      <Group>
        <Input
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          className={baseInputStyles}
        />

        <ToggleButton
          excludeFromTabOrder={true}
          isSelected={isVisible}
          onChange={setVisible}
          className="px-3 text-gray-500 cursor-pointer hover:text-gray-600 bg-transparent"
          aria-label="Toggle password visibility"
        >
          {({ isSelected }) =>
            isSelected ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeOffIcon className="h-4 w-4" />
            )
          }
        </ToggleButton>
      </Group>

      {description && <Description>{description}</Description>}
      <Errors field={field} />
    </AriaTextField>
  )
}
