import type React from "react";
import { forwardRef } from "react";
import {
	composeRenderProps,
	type FieldErrorProps,
	Group,
	type GroupProps,
	InputContext,
	type InputProps,
	type LabelProps,
	FieldError as RACFieldError,
	Input as RACInput,
	Label as RACLabel,
	Text,
	type TextProps,
	useContextProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";
import { composeTailwindRenderProps, focusRing } from "./utils";

export function Label(props: LabelProps) {
	return (
		<RACLabel
			{...props}
			className={twMerge(
				"text-sm text-gray-500 dark:text-zinc-400 font-medium cursor-default w-fit",
				props.className,
			)}
		/>
	);
}

export function Description(props: TextProps) {
	return (
		<Text
			{...props}
			slot="description"
			className={twMerge("text-sm text-gray-600", props.className)}
		/>
	);
}

export function FieldError(props: FieldErrorProps) {
	return (
		<RACFieldError
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				"text-sm text-red-600 forced-colors:text-[Mark]",
			)}
		/>
	);
}

export const fieldBorderStyles = tv({
	variants: {
		isFocusWithin: {
			false: "border-gray-800 forced-colors:border-[ButtonBorder]",
			true: "border-gray-600 forced-colors:border-[Highlight]",
		},
		isInvalid: {
			true: "border-red-600 forced-colors:border-[Mark]",
		},
		isDisabled: {
			true: "border-gray-600 forced-colors:border-[GrayText]",
		},
	},
});

export const fieldGroupStyles = tv({
	extend: focusRing,
	base: "group flex items-center bg-white forced-colors:bg-[Field] border-1 rounded-lg overflow-hidden",
	variants: fieldBorderStyles.variants,
});

export function FieldGroup(props: GroupProps) {
	return (
		<Group
			{...props}
			className={composeRenderProps(props.className, (className, renderProps) =>
				fieldGroupStyles({ ...renderProps, className }),
			)}
		/>
	);
}

export const Input = forwardRef(
	(props: InputProps, ref: React.ForwardedRef<HTMLInputElement>) => {
		const [mergedProps, mergedRef] = useContextProps(props, ref, InputContext);

		return (
			<RACInput
				ref={mergedRef}
				{...mergedProps}
				className={composeTailwindRenderProps(
					props.className,
					"px-2 py-1.5 flex-1 min-w-0 border-0 outline-0 bg-white text-sm text-content-foreground",
				)}
			/>
		);
	},
);

// export function Input(props: InputProps) {
//   return (
//     <RACInput
//       {...props}
//       className={composeTailwindRenderProps(
//         props.className,
//         "px-2 py-1.5 flex-1 min-w-0 border-0 outline-0 bg-white text-sm text-content-foreground"
//       )}
//     />
//   )
// }
