import { getDefaultTimeZone } from "@/lib/dates";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { ProfileName } from "../profiles/name";
import {
	useCart,
	useCartItems,
	useCartTotal,
	useCartValidation,
} from "./context";
import { Link } from "../base/link";
import { button } from "../base/button";
import { twMerge } from "tailwind-merge";
import {
	Disclosure,
	DisclosureHeader,
	DisclosurePanel,
} from "../base/disclosure";

export function Cart({
	checkout,
	className,
}: {
	checkout?: boolean;
	className?: string;
	smallScreen?: boolean;
}) {
	const items = useCartItems(checkout);
	const total = useCartTotal(checkout);
	const cart = useCart(checkout);
	const dateFormatter = useDateFormatter();
	const { isValid, errors, isLoading } = useCartValidation(checkout);

	const canCheckout = items.length > 0 && isValid && !isLoading;

	return (
		<Disclosure
			defaultExpanded
			className={twMerge(
				"col-span-full md:col-span-2 bg-white rounded-lg border-0",
				className,
			)}
		>
			<DisclosureHeader card={false} className="px-4 py-3">
				<span className="flex-1 mr-2">Cart</span>
				{items.length > 0 && (
					<span className="text-gray-500 font-normal">
						{items.length} item{items.length !== 1 && "s"} · ${total}
					</span>
				)}
			</DisclosureHeader>

			<DisclosurePanel card={false} contentClassName="px-0 py-0">
				<div className="px-4 pb-4 flex-1 border-b border-gray-300">
					{items.length === 0 ? (
						<div className="text-center text-gray-500">Your cart is empty</div>
					) : (
						items.map((item, index) => (
							<div
								key={`${item.type}-${index}`}
								className="py-2 border-b border-gray-300 last-of-type:border-b-0"
							>
								<div className="flex flex-row justify-between items-start gap-2">
									<span>
										{item.type === "team"
											? `${getTournamentDivisionDisplay(item.division)} ${item.division.tournament.venue.slug}: ${dateFormatter.format(parseDate(item.division.tournament.date).toDate(getDefaultTimeZone()))}`
											: item.title}
									</span>
									<span className="font-semibold shrink-0">${item.price}</span>
								</div>
								<div className="text-gray-600 text-sm">
									{item.profiles.map((profile, i) => (
										<span key={profile.id}>
											{i > 0 && ", "}
											<ProfileName {...profile} link={false} />
										</span>
									))}
								</div>
							</div>
						))
					)}
				</div>
				<div className="p-4 border-b border-gray-300 flex flex-row justify-between">
					<div className="text-lg text-gray-600">Subtotal</div>
					<div>${total}</div>
				</div>
				<div className="p-4 font-bold flex flex-row justify-between">
					<div className="text-lg">Total</div>
					<div>${total}</div>
				</div>
				{!checkout && (
					<div className="p-4 font-bold flex flex-col gap-2">
						{errors.length > 0 && (
							<div className="text-sm text-amber-600 text-center space-y-1">
								{errors.map((error, i) => (
									<p key={i}>{error}</p>
								))}
							</div>
						)}
						<Link
							className={button({
								color: "primary",
								radius: "full",
								className: "w-full",
								isDisabled: !canCheckout,
							})}
							to="/account/registrations/checkout"
							search={cart}
							disabled={!canCheckout}
						>
							{isLoading ? "Validating..." : "Checkout"}
						</Link>
					</div>
				)}
			</DisclosurePanel>
		</Disclosure>
	);
}
