import { DefaultLayout, DefaultLayoutProps } from "./default";

export function AdminLayout(props: DefaultLayoutProps) {
	return (
		<DefaultLayout
			{...props}
			sideNavItems={[
				{
					title: "Invoices",
					to: "/admin/invoices" as const,
				},
			]}
		/>
	);
}
