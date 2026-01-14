import clsx from "clsx";
import type { ReactNode } from "react";

import { useIsMounted } from "@/lib/dom";
import { Checkbox, type CheckboxProps } from "../../checkbox";
import type { FieldProps } from "./shared";

export type CheckboxFieldProps = Omit<FieldProps, "label"> &
	CheckboxProps & { label: ReactNode };

export function CheckboxField({
	className,
	description,
	placeholder,
	field,
	...props
}: CheckboxFieldProps) {
	const isMounted = useIsMounted();

	return (
		<Checkbox
			{...props}
			className={clsx("flex flex-row gap-1", className)}
			name={field.name}
			isSelected={field.state.value ?? false}
			onChange={field.handleChange}
			onBlur={field.handleBlur}
			isInvalid={field.state.meta.isBlurred && !field.state.meta.isValid}
			isDisabled={!isMounted || props.isDisabled}
		/>
	);
}
