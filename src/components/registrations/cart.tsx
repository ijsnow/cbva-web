import { ProfileName } from "../profiles/name";
import {
	useCartDivisionItems,
	useCartMembershipItems,
	useCartTotal,
} from "./context";
import { Link } from "../base/link";
import { button } from "../base/button";
import { useSearch } from "@tanstack/react-router";

export function Cart() {
	const membershipItems = useCartMembershipItems();
	const divisionItems = useCartDivisionItems();
	const total = useCartTotal();

	const search = useSearch({
		from: "/account/registrations/",
	});

	// Only count divisions with players as valid items
	const validDivisionItems = divisionItems.filter(
		(item) => item.profiles.length > 0,
	);
	const hasItems = membershipItems.length > 0 || validDivisionItems.length > 0;

	return (
		<div className="col-span-2 bg-white rounded-lg py-3 flex flex-col">
			<h2 className="px-4">Cart</h2>

			<div className="p-4 flex-1 border-b border-gray-300">
				{!hasItems && (
					<div className="text-center text-gray-500 py-4">
						Your cart is empty
					</div>
				)}

				{membershipItems.map(({ title, price, profile }) => (
					<div
						key={`membership-${profile.id}`}
						className="py-2 border-b border-gray-300 last-of-type:border-b-0"
					>
						<div className="flex flex-row justify-between items-center">
							<span>{title}</span>
							<span className="font-semibold">${price}</span>
						</div>
						<div className="text-gray-600">
							1x <ProfileName {...profile} link={false} />
						</div>
					</div>
				))}

				{validDivisionItems.map(
					({ title, subtitle, price, division, profiles }) => (
						<div
							key={`division-${division?.id}`}
							className="py-2 border-b border-gray-300 last-of-type:border-b-0"
						>
							<div className="flex flex-row justify-between items-center">
								<span>{title}</span>
								<span className="font-semibold">${price}</span>
							</div>
							<div className="text-gray-600 text-sm">{subtitle}</div>
							<div className="text-gray-500 text-xs mt-1">
								{profiles.map((p) => (
									<span key={p.id} className="mr-2">
										<ProfileName {...p} link={false} />
									</span>
								))}
							</div>
						</div>
					),
				)}
			</div>
			<div className="p-4 font-bold flex flex-row justify-between">
				<div className="text-lg">Total</div>
				<div>${total}</div>
			</div>
			<div className="p-4 font-bold flex flex-row justify-between">
				<Link
					className={button({
						color: "primary",
						radius: "full",
						className: "w-full",
						isDisabled: !hasItems,
					})}
					to="/account/registrations/checkout"
					search={search}
				>
					Checkout
				</Link>
			</div>
		</div>
	);
}
