import { useControlledState } from "@react-stately/utils";
import { TextField, TextFieldProps } from "../../text-field";
import { FieldProps } from "./shared";

export const formatExpiry = (input: string) => {
	// Remove non-numeric characters
	const cleaned = input.replace(/\D/g, "");

	// Format the card number in groups of 4 digits
	const match = cleaned.match(/\d{1,2}/g);

	if (match) {
		return match.join("/");
	}

	return cleaned;
};

export function ExpiryField({
	field,
	...props
}: Omit<TextFieldProps, "onChange"> & FieldProps) {
	const [expiry, setExpiry] = useControlledState(
		field.state.value,
		"",
		(value) => {
			// Remove all non-numeric characters
			value = value.replace(/\D/g, "");

			field.handleChange(value || "");
		},
	);

	return (
		<TextField
			{...props}
			placeholder="MM/YY"
			value={formatExpiry(expiry)}
			onChange={setExpiry}
			maxLength={5}
		/>
	);
}
