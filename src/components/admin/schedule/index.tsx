import { CalendarIcon, PlusIcon } from "lucide-react";
import { button } from "@/components/base/button";
import { Link } from "@/components/base/link";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "../../base/disclosure";
import { title } from "../../base/primitives";
import { CopyScheduleForm } from "./copy";
import { DeleteScheduleForm } from "./delete";

export function ScheduleDashboard() {
	return (
		<section className="flex flex-col space-y-8">
			<h2
				className={title({
					size: "sm",
					class: "flex flex-row justify-between items-center",
				})}
			>
				<span>Schedule</span>
				<Link to="/admin/schedule" className={button({ variant: "link" })}>
					<CalendarIcon size={16} /> Edit Schedule
				</Link>
			</h2>

			<DisclosureGroup>
				<Disclosure className="bg-white">
					<DisclosureHeader className={title({ size: "xs" })}>
						Copy Schedule
					</DisclosureHeader>
					<DisclosurePanel>
						<CopyScheduleForm />
					</DisclosurePanel>
				</Disclosure>

				<Disclosure className="bg-white">
					<DisclosureHeader className={title({ size: "xs" })}>
						Delete Schedule
					</DisclosureHeader>
					<DisclosurePanel>
						<DeleteScheduleForm />
					</DisclosurePanel>
				</Disclosure>
			</DisclosureGroup>
		</section>
	);
}
