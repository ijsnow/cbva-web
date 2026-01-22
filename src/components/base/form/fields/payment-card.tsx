import { PaymentCardInput, PaymentInputProps } from "../../payment-card-input";
import { FieldProps } from "./shared";

export function PaymentCardField({
	field,
	...props
}: Omit<PaymentInputProps, "onChange"> & FieldProps) {
	return <PaymentCardInput {...props} onChange={field.handleChange} />;
}
