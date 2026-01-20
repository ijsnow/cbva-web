import { Link, useRouterState, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { CheckIcon, ChevronDown, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Button as AriaButton,
	composeRenderProps,
	type Key,
	Label,
	MenuTrigger,
	TooltipTrigger,
} from "react-aria-components";
import {
	itemStyles,
	popoverStyles,
} from "@/components/base/form/fields/multi-select";
import { Popover } from "@/components/base/popover";
import type { Pool } from "@/db/schema";
import type { Option } from "./select";
import { Tooltip } from "./tooltip";

type MultiSelectProps<Value extends Key> = {
	label: ReactNode;
	searchKey: string;
	placeholder?: ReactNode;
	values: Set<Value>;
	options: Option<Value>[];
};

export function MultiSelect<Value extends Key>({
	label,
	placeholder = "Select Options",
	searchKey,
	values,
	options,
}: MultiSelectProps<Value>) {
	const state = useRouterState();

	const search = useSearch({ strict: false });

	const isDropdownDisabled =
		options?.filter(({ value }) => !values.has(value)).length === 0;

	return (
		<div className="flex flex-col space-y-1.5">
			{label && <Label>{label}</Label>}

			<div className="flex flex-row rounded-md bg-white h-12 items-stretch">
				<div className="flex flex-row space-x-1 px-2 items-center">
					{options
						?.filter(({ value }) => values.has(value))
						.map(({ display, value }) => (
							<Link
								key={value}
								to={state.location.pathname}
								search={{
									...search,
									[searchKey]: values.has(value)
										? Array.from(values).filter((v) => v !== value)
										: Array.from(values).concat(value),
								}}
								className="border border-gray-300 py-1 px-2 rounded flex flex-row items-center space-x-2"
							>
								<span>{display}</span>

								<XIcon size={12} />
							</Link>
						))}
				</div>
				<MenuTrigger isOpen={isDropdownDisabled ? false : undefined}>
					<AriaButton
						className={clsx(
							"flex items-center justify-between text-start gap-4 w-full px-2",
							isDropdownDisabled ? "cursor-not-allowed" : "cursor-pointer",
						)}
						isDisabled={isDropdownDisabled}
					>
						<div className="flex flex-row gap-2">
							{values.size === 0 ? (
								<span className="text-placeholder italic">
									{placeholder || "Select options"}
								</span>
							) : isDropdownDisabled ? null : (
								<span className="text-placeholder italic">{"Select More"}</span>
							)}
						</div>
						{isDropdownDisabled ? (
							<TooltipTrigger delay={100} closeDelay={50}>
								<Link
									to={state.location.pathname}
									search={{
										...search,
										pools: [],
									}}
									className={itemStyles({
										className: "mx-2",
									})}
								>
									<XIcon size={12} />
								</Link>
								<Tooltip>Clear selection</Tooltip>
							</TooltipTrigger>
						) : (
							<ChevronDown
								aria-hidden
								className={clsx(
									"mx-2 w-4 h-4 forced-colors:text-[ButtonText] group-disabled:text-gray-200 forced-colors:group-disabled:text-[GrayText]",
									isDropdownDisabled ? "text-gray-400" : "text-gray-600",
								)}
							/>
						)}
					</AriaButton>
					<Popover
						className={composeRenderProps(
							"min-w-(--trigger-width) overflow-y-scroll",
							(className, render) => popoverStyles({ ...render, className }),
						)}
					>
						{options
							?.filter(({ value }) => !values.has(value))
							.map(({ value, display }) => (
								<Link
									key={value}
									to={state.location.pathname}
									search={{
										...search,
										[searchKey]: values.has(value)
											? Array.from(values).filter((v) => v !== value)
											: Array.from(values).concat(value),
									}}
									className={itemStyles({
										className:
											"w-full hover:bg-gray-200 flex flex-row justify-between",
									})}
								>
									<span className="flex items-center flex-1 gap-2 font-normal truncate group-selected:font-semibold">
										{display}
									</span>
									<span className="flex items-center w-5">
										{values.has(value) && <CheckIcon className="w-4 h-4" />}
									</span>
								</Link>
							))}
					</Popover>
				</MenuTrigger>
			</div>
		</div>
	);
}
