import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import {
	SideNav,
	SideNavItem,
	type SideNavItemProps,
} from "@/components/base/side-nav";
import { ImpersonatorControls } from "@/components/impersonator/controls";
import { Navbar } from "@/components/navbar";
import { ToastRegion } from "@/components/base/toast";

export type DefaultLayoutProps = {
	classNames?: { content?: string };
	children: ReactNode;
	sideNavItems?: SideNavItemProps[];
};

export function DefaultLayout({
	classNames = { content: "pt-18 px-3 pb-12 space-y-12 w-full" },
	children,
	sideNavItems,
}: DefaultLayoutProps) {
	return (
		<div className="w-full min-h-screen flex flex-col bg-content-background text-content-foreground">
			<header>
				<Navbar />
			</header>

			<div className="flex flex-row h-full flex-1 relative max-w-full">
				{sideNavItems && (
					<SideNav>
						{sideNavItems.map((props) => (
							<SideNavItem key={props.title} {...props} />
						))}
					</SideNav>
				)}

				<div className={twMerge("relative flex-1", classNames.content)}>
					{children}
				</div>
			</div>

			<ImpersonatorControls />
			<ToastRegion />
		</div>
	);
}
