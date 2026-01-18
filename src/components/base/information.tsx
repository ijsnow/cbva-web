import { InfoIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Focusable, TooltipTrigger } from "react-aria-components";
import { Tooltip } from "./tooltip";
import { twMerge } from "tailwind-merge";

export function Information({
	triggerClassName,
	children,
}: {
	triggerClassName?: string;
	children: ReactNode;
}) {
	return (
		<TooltipTrigger delay={100} closeDelay={50}>
			<Focusable>
				<span className={twMerge("flex", triggerClassName)}>
					<InfoIcon className="inline" size={16} />
				</span>
			</Focusable>

			<Tooltip className="bg-white">
				<div className="max-w-48 ">{children}</div>
			</Tooltip>
		</TooltipTrigger>
	);
}
