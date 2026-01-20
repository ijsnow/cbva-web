import clsx from "clsx";
import {
	type TextFieldProps as RACTextFieldProps,
	TextArea,
	TextField,
} from "react-aria-components";

import { useIsMounted } from "@/lib/dom";
import type { FieldProps } from "./shared";
import { Description, Errors, inputStyles, Label } from "./shared";

export type TextAreaProps = FieldProps & RACTextFieldProps;

export function TextAreaField({
	className,
	label,
	description,
	placeholder,
	field,
	...props
}: TextAreaProps) {
	const isMounted = useIsMounted();

	return (
		<TextField
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
			<TextArea placeholder={placeholder} className={inputStyles} />
			{description && <Description>{description}</Description>}
			<Errors field={field} />
		</TextField>
	);
}
