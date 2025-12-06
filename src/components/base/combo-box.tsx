import { Link, type LinkOptions, useRouter } from "@tanstack/react-router";
import { ChevronDown, XIcon } from "lucide-react";
import { useMemo, useRef } from "react";
import {
	ComboBox as AriaComboBox,
	type ComboBoxProps as AriaComboBoxProps,
	type Key,
	ListBox,
	type ListBoxItemProps,
	type ValidationResult,
} from "react-aria-components";
import { isNotNullOrUndefined } from "@/utils/types";
import { Button } from "./button";
import { Description, FieldError, FieldGroup, Input, Label } from "./field";
import {
	DropdownItem,
	DropdownSection,
	type DropdownSectionProps,
} from "./list-box";
import { Popover } from "./popover";
import type { Option } from "./select";
import { composeTailwindRenderProps } from "./utils";

export interface ComboBoxProps<T extends Key>
	extends Omit<AriaComboBoxProps<Option<T>>, "children"> {
	label?: string;
	description?: string | null;
	errorMessage?: string | ((validation: ValidationResult) => string);
	children: React.ReactNode | ((item: Option<T>) => React.ReactNode);
}

// TODO: make this a multi-select too. Single select with tag group beneath it with selected items that can be removed.

export function ComboBox<T extends Key>({
	label,
	description,
	errorMessage,
	children,
	items = [],
	placeholder,
	selectedKeys,
	multi,
	...props
}: ComboBoxProps<T> & {
	placeholder?: string;
	multi?: boolean;
	selectedKeys?: Iterable<T>;
}) {
	const itemsMap = new Map(Array.from(items).map((item) => [item.value, item]));

	const selectedKeysSet = new Set([
		props.selectedKey,
		...(selectedKeys ? Array.from(selectedKeys) : []),
	]);

	const selectedText = Array.from(items)
		.filter(({ value }) => selectedKeysSet.has(value))
		.map(({ display }) => display);

	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<AriaComboBox
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				"group flex flex-col gap-1",
			)}
		>
			{label && <Label>{label}</Label>}

			<FieldGroup>
				<Input
					placeholder={
						selectedText.length ? selectedText.join(", ") : placeholder
					}
					ref={inputRef}
				/>
				<Button
					variant="icon"
					color="muted"
					className="w-6 mr-1 rounded-xs outline-offset-0 border-l border-gray-700 rounded-l-none"
				>
					<ChevronDown aria-hidden className="w-4 h-4" />
				</Button>
			</FieldGroup>

			{description && <Description>{description}</Description>}

			<FieldError>{errorMessage}</FieldError>

			{multi && selectedKeys && (
				<div className="flex flex-row space-x-2 items-center px-2">
					{Array.from(selectedKeys)
						.map((key) => itemsMap.get(key))
						.filter(isNotNullOrUndefined)
						.map(({ display, value, link }) =>
							link ? (
								<Link
									key={value}
									className="border border-gray-300 bg-white py-1 px-2 rounded flex flex-row items-center space-x-2 text-xs"
									{...link}
								>
									<span>{display}</span>

									<XIcon size={12} />
								</Link>
							) : (
								<div
									key={value}
									className="border border-gray-300 bg-white py-1 px-2 rounded flex flex-row items-center space-x-2"
								>
									<span>{display}</span>

									<XIcon size={12} />
								</div>
							),
						)}
				</div>
			)}

			<Popover className="w-(--trigger-width)">
				<ListBox
					items={Array.from(items).filter(
						({ value }) => !selectedKeysSet.has(value),
					)}
					className="outline-0 p-1 max-h-[inherit] overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]"
				>
					{children}
				</ListBox>
			</Popover>
		</AriaComboBox>
	);
}

export function ComboBoxItem({
	link,
	...props
}: ListBoxItemProps & { link?: LinkOptions }) {
	const router = useRouter();

	const href = useMemo(() => {
		if (!link) {
			return undefined;
		}

		const location = router.buildLocation(link);

		return location.href;
	}, [router, link]);

	return <DropdownItem {...props} href={href} />;
}

export function ComboBoxSection<T extends object>(
	props: DropdownSectionProps<T>,
) {
	return <DropdownSection {...props} />;
}
