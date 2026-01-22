import {
	TextField,
	type TextFieldProps,
	type ValidationResult,
} from "react-aria-components";
import {
	Description,
	FieldError,
	FieldGroup,
	Input,
	Label,
	fieldBorderStyles,
} from "./field";
import { composeTailwindRenderProps } from "./utils";
import {
	AmexIcon,
	DiscoverIcon,
	MastercardIcon,
	UnionPayIcon,
	VisaIcon,
} from "./payment-icons";
import { useIsMounted } from "@/lib/dom";
import { useControlledState } from "@react-stately/utils";

const cardTypes = [
	{
		name: "Visa",
		pattern: /^4[0-9]{3,}$/, // Visa card numbers start with 4 and are 13 or 16 digits long
		card: "visa",
		Icon: VisaIcon,
	},
	{
		name: "MasterCard",
		pattern: /^5[1-5][0-9]{2,}$/, // MasterCard numbers start with 51-55 and are 16 digits long
		card: "mastercard",
		Icon: MastercardIcon,
	},
	{
		name: "American Express",
		pattern: /^3[47][0-9]{2,}$/, // American Express numbers start with 34 or 37 and are 15 digits long
		card: "amex",
		Icon: AmexIcon,
	},
	{
		name: "Discover",
		pattern: /^6(?:011|5[0-9]{2}|4[4-9][0-9])[0-9]{12}$/, // Discover card numbers start with 6011 or 65 and are 16 digits long
		card: "discover",
		Icon: DiscoverIcon,
	},
	{
		name: "UnionPay",
		pattern: /^(62|88)[0-9]{14,17}$/, // UnionPay card numbers start with 62 or 88 and are between 15-19 digits long
		card: "unionpay",
		Icon: UnionPayIcon,
	},
	{
		name: "Unknown",
		pattern: /.*/, // Fallback pattern for unknown cards
		card: "unknown",
		Icon: () => (
			<span className="flex flex-row gap-x-2">
				<VisaIcon />
				<DiscoverIcon />
				<AmexIcon />
				<MastercardIcon />
			</span>
		),
	},
];

/**
 * Detect the card type based on the card number.
 * @param number The card number to detect the type for.
 * @returns The matching card type object.
 */
const detectCardType = (number: string) => {
	// Remove all spaces
	const sanitizedNumber = number.replace(/\D/g, "");

	// Find the matching card type
	const card = cardTypes.find((cardType) =>
		cardType.pattern.test(sanitizedNumber),
	);

	return card || cardTypes[cardTypes.length - 1];
};

/**
 * Format the card number in groups of 4 digits (i.e. 1234 5678 9012 3456).
 */
export const formatCardNumber = (number: string) => {
	// Remove non-numeric characters
	const cleaned = number.replace(/\D/g, "");

	// Format the card number in groups of 4 digits
	const match = cleaned.match(/\d{1,4}/g);

	if (match) {
		return match.join(" ");
	}

	return cleaned;
};

export type PaymentInputProps = TextFieldProps & {
	label?: string;
	description?: string;
	errorMessage?: string | ((validation: ValidationResult) => string);
};

export function PaymentCardInput({
	label,
	description,
	errorMessage,
	value,
	defaultValue,
	onChange,
	...props
}: PaymentInputProps) {
	const isMounted = useIsMounted();

	const [cardNumber, setCardNumber] = useControlledState(
		value,
		defaultValue || "",
		(value) => {
			// Remove all non-numeric characters
			value = value.replace(/\D/g, "");

			onChange?.(value || "");
		},
	);

	const card = detectCardType(cardNumber);

	return (
		<TextField
			{...props}
			isDisabled={!isMounted}
			className={composeTailwindRenderProps(
				props.className,
				"group flex flex-col gap-1",
			)}
			value={formatCardNumber(cardNumber)}
			onChange={setCardNumber}
		>
			<Label>{label}</Label>
			<FieldGroup>
				{(renderProps) => (
					<>
						<Input />
						<div
							className={fieldBorderStyles({
								...renderProps,
								class: "flex flex-col",
							})}
						>
							<card.Icon />
						</div>
					</>
				)}
			</FieldGroup>
			{description && <Description>{description}</Description>}
			<FieldError>{errorMessage}</FieldError>
		</TextField>
	);
}
