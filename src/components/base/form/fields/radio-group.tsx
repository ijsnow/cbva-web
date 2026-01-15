import { useIsMounted } from "@/lib/dom";
import type { FieldProps } from "./shared";
import { RadioGroup, RadioGroupProps } from "../../radio-group";

export type RadioGroupFieldProps = FieldProps & RadioGroupProps;

export function RadioGroupField({
	className,
	description,
	placeholder,
	field,
	children,
	...props
}: RadioGroupFieldProps) {
	const isMounted = useIsMounted();

	// return (
	//   <AriaTextField
	//     {...props}
	//     className={clsx("flex flex-col gap-1", className)}
	//     name={field.name}
	//     value={field.state.value ?? ""}
	//     onChange={field.handleChange}
	//     onBlur={field.handleBlur}
	//     isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
	//     isDisabled={!isMounted || props.isDisabled}
	//   >
	//     {label && <Label isRequired={props.isRequired}>{label}</Label>}
	//     <Input placeholder={placeholder} className={inputStyles} />
	//     {description && <Description>{description}</Description>}
	//     <Errors field={field} />
	//   </AriaTextField>
	// )

	return (
		<RadioGroup
			{...props}
			isDisabled={!isMounted || props.isDisabled}
			isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
			value={field.state.value}
			onChange={field.handleChange}
		>
			{children}
		</RadioGroup>
	);
}
