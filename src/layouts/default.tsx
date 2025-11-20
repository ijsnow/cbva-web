import type { ReactNode } from "react";
import { ImpersonatorControls } from "@/components/impersonator/controls";
import { Navbar } from "@/components/navbar";

export function DefaultLayout({
	classNames = { content: "pt-18 pb-12 space-y-12 w-full relative" },
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

			<div className={classNames.content}>{children}</div>

			<ImpersonatorControls />
		</div>
	);
}
