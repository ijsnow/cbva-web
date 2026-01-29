import { useIsMounted } from "@/lib/dom";
import type { FieldProps } from "./shared";
import { RadioGroup, RadioGroupProps } from "../../radio-group";

export type RadioGroupFieldProps = FieldProps &
	RadioGroupProps & {
		mode: "string" | "int";
	};

export function RadioGroupField({
	className,
	description,
	placeholder,
	field,
	children,
	mode = "string",
	...props
}: RadioGroupFieldProps) {
	const isMounted = useIsMounted();

	// Convert value to string for react-aria RadioGroup (expects string values)
	const value = field.state.value != null ? String(field.state.value) : undefined;

	return (
		<RadioGroup
			{...props}
			isDisabled={!isMounted || props.isDisabled}
			isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
			value={value}
			onChange={(v) =>
				field.handleChange(mode === "string" ? v : Number.parseInt(v, 10))
			}
		>
			{children}
		</RadioGroup>
	);
}
