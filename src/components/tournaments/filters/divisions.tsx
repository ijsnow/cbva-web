import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { CheckIcon, ChevronDown } from "lucide-react";
import {
	Button,
	composeRenderProps,
	Label,
	MenuTrigger,
} from "react-aria-components";
import {
	itemStyles,
	popoverStyles,
} from "@/components/base/form/fields/multi-select";
import { inputStyles } from "@/components/base/form/fields/shared";
import { Popover } from "@/components/base/popover";
import { focusRing } from "@/components/base/utils";
import { divisionsQueryOptions } from "@/data/divisions";
import type { Division } from "@/db/schema";

type Key = Division["id"];

type FilterDivisionsProps = {
	values: Set<Key>;
};

export function FilterDivisions({ values }: FilterDivisionsProps) {
	const { data: options } = useSuspenseQuery({
		...divisionsQueryOptions(),
		select: (divisions) =>
			divisions.map(({ id, name }) => ({
				value: id,
				display: name.toUpperCase(),
			})),
	});

	const placeholder = "Divisions";

	return (
		<div>
			<Label>Divisions</Label>

			<MenuTrigger>
				<Button
					className={(render) =>
						clsx(
							"flex items-center justify-between text-start gap-4 w-full cursor-default px-2 py-1.5 bg-white hover:bg-gray-200",
							focusRing(render),
							inputStyles(render),
						)
					}
				>
					<div className="flex flex-row gap-2">
						{values.size === 0 ? (
							<span className="text-placeholder italic">
								{placeholder || "Select options"}
							</span>
						) : (
							options
								?.filter(({ value }) => values.has(value))
								.map(({ display }) => display)
								.join(", ")
						)}
					</div>
					<ChevronDown
						aria-hidden
						className="mx-2 w-4 h-4 text-gray-600 forced-colors:text-[ButtonText] group-disabled:text-gray-200 forced-colors:group-disabled:text-[GrayText]"
					/>
				</Button>
				<Popover
					className={composeRenderProps(
						"min-w-(--trigger-width) overflow-y-scroll",
						(className, render) => popoverStyles({ ...render, className }),
					)}
				>
					{options?.map(({ value, display }) => (
						<Link
							key={value}
							to="/tournaments"
							search={(search) => {
								const divisions = search.divisions ?? [];

								return {
									...search,
									page: 1,
									divisions: values.has(value)
										? divisions.filter((v) => v !== value)
										: divisions.concat(value),
								};
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
	);
}
