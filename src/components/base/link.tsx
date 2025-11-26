import { createLink } from "@tanstack/react-router";
import { type LinkProps, Link as ReactAriaLink } from "react-aria-components";
import { composeTailwindRenderProps } from "./utils";

function BaseLink(props: LinkProps) {
	return (
		<ReactAriaLink
			{...props}
			className={composeTailwindRenderProps(
				props.className,
				"underline hover:no-underline",
			)}
		/>
	);
}

export const Link = createLink(BaseLink);
