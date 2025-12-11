import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ImpersonatorControls } from "@/components/impersonator/controls";
import { Navbar } from "@/components/navbar";

export function DefaultLayout({
	classNames = { content: "pt-18 pb-12 space-y-12 w-full" },
	children,
}: {
	classNames?: { content?: string };
	children: ReactNode;
}) {
	return (
		<div className="w-full min-h-screen bg-content-background text-content-foreground">
			<header>
				<Navbar />
			</header>

			<div className={twMerge("relative", classNames.content)}>{children}</div>

			<ImpersonatorControls />
		</div>
	);
}
