import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import clsx from "clsx";
import { type ReactNode, useState } from "react";
import { Heading } from "react-aria-components";
import { type AlertProps, Alert as BaseAlert } from "@/components/base/alert";
import { Button, type ButtonProps } from "@/components/base/button";
import { Modal } from "../modal";
import { title } from "../primitives";
import { CheckboxField } from "./fields/checkbox";
import { AsyncComboBoxField, ComboBoxField } from "./fields/combo-box";
import { DateField } from "./fields/date";
import { DatePickerField } from "./fields/date-picker";
import { ImageField } from "./fields/image";
import { ImageUploadField } from "./fields/image-upload";
import { MultiSelectField } from "./fields/multi-select";
import { NumberField } from "./fields/number";
import { PasswordField } from "./fields/password";
import { SelectField } from "./fields/select";
import { TextField } from "./fields/text";
import { TextAreaField } from "./fields/text-area";
import { TimeField } from "./fields/time";
import { RadioGroupField } from "./fields/radio-group";
import { RichTextField } from "./fields/rich-text";
import { ProfilePickerField } from "./fields/profile-picker";
import { PaymentCardField } from "./fields/payment-card";
import { ExpiryField } from "./fields/expiry";
import { PaymentKeyField } from "./fields/payment-key";
import { DivisionPickerField } from "./fields/division-picker";

function Alert({ className, ...props }: AlertProps) {
	return <BaseAlert className={className} {...props} />;
}

function Footer({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={clsx("mt-4 flex gap-4 justify-end col-span-full", className)}
		>
			{children}
		</div>
	);
}

function Row({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={clsx("flex flex-row gap-3 items-end", className)}>
			{children}
		</div>
	);
}

const { fieldContext, formContext, useFormContext } = createFormHookContexts();

function SubmitButton({
	isDisabled,
	className,
	children = <>Submit</>,
	requireChange = true,
	...props
}: Omit<ButtonProps, "type" | "children"> & {
	children?: ReactNode;
	requireChange?: boolean;
}) {
	const form = useFormContext();

	return (
		<form.Subscribe
			selector={(state) => [
				state.canSubmit,
				state.isDefaultValue,
				state.isSubmitting,
			]}
			children={([canSubmit, isDefaultValue, isSubmitting]) => (
				<Button
					type="submit"
					color="primary"
					className={clsx(className)}
					data-can-submit={canSubmit}
					data-is-submitting={isSubmitting}
					data-is-disabled={isDisabled}
					data-require-change={requireChange}
					data-is-default-value={isDefaultValue}
					isDisabled={
						!canSubmit ||
						isSubmitting ||
						isDisabled ||
						(requireChange && isDefaultValue)
					}
					{...props}
				>
					{children}
				</Button>
			)}
		/>
	);
}

function ConfirmSubmitButton({
	isDisabled,
	className,
	description,
	children = <>Submit</>,
	variant,
	color,
	size,
	requireChange = true,
	...props
}: Omit<ButtonProps, "type" | "children"> & {
	description: ReactNode;
	children?: ReactNode;
	requireChange?: boolean;
}) {
	const form = useFormContext();

	const [open, setOpen] = useState(false);

	return (
		<form.Subscribe
			selector={(state) => [
				state.canSubmit,
				state.isDefaultValue,
				state.isSubmitting,
			]}
			children={([canSubmit, isDefaultValue, isSubmitting]) => (
				<>
					<Button
						color={color ?? "primary"}
						onPress={() => setOpen(true)}
						className={clsx(className)}
						isDisabled={!canSubmit || isSubmitting || isDisabled}
						variant={variant}
						size={size}
						{...props}
					>
						{children}
					</Button>

					<Modal isOpen={open} onOpenChange={setOpen}>
						<div className="py-4 px-3 flex flex-col space-y-4">
							<Heading className={title({ size: "sm" })}>Are you sure?</Heading>

							{description}

							<Footer>
								<Button onPress={() => setOpen(false)}>Cancel</Button>

								<Button
									type="submit"
									color="primary"
									onPress={() => {
										setOpen(false);

										form.handleSubmit();
									}}
									className={clsx(className)}
									isDisabled={
										!canSubmit ||
										isSubmitting ||
										isDisabled ||
										(requireChange && isDefaultValue)
									}
									{...props}
								>
									{children}
								</Button>
							</Footer>
						</div>
					</Modal>
				</>
			)}
		/>
	);
}

function StateDebugger({ className }: { className?: string }) {
	const form = useFormContext();

	return (
		<form.Subscribe
			selector={({ values, errors, ...rest }) => [values, errors, rest]}
			children={([values, errors, rest]) => (
				<pre className={clsx("col-span-full", className)}>
					{JSON.stringify({ values, errors, ...rest }, null, 2)}
				</pre>
			)}
		/>
	);
}

export const { useAppForm } = createFormHook({
	fieldComponents: {
		Text: TextField,
		Password: PasswordField,
		TextArea: TextAreaField,
		Checkbox: CheckboxField,
		Number: NumberField,
		Select: SelectField,
		RadioGroup: RadioGroupField,
		ComboBox: ComboBoxField,
		AsyncComboBox: AsyncComboBoxField,
		Image: ImageField,
		ImageUpload: ImageUploadField,
		Date: DateField,
		DatePicker: DatePickerField,
		Time: TimeField,
		MultiSelect: MultiSelectField,
		ProfilePicker: ProfilePickerField,
		RichText: RichTextField,
		PaymentCard: PaymentCardField,
		Expiry: ExpiryField,
		PaymentKey: PaymentKeyField,
		DivisionPicker: DivisionPickerField,
	},
	formComponents: {
		Alert,
		SubmitButton,
		ConfirmSubmitButton,
		Button,
		Footer,
		Row,
		StateDebugger,
	},
	fieldContext,
	formContext,
});
