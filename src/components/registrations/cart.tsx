import { sum } from "lodash-es";
import { ProfileName } from "../profiles/name";
import { useCartItems, useCartTotal } from "./context";
import { Link } from "../base/link";
import { button } from "../base/button";
import { useSearch } from "@tanstack/react-router";

export function Cart() {
	const items = useCartItems();
	const total = useCartTotal();

	const search = useSearch({
		from: "/account/registrations/",
	});

	return (
		<div className="col-span-2 bg-white rounded-lg py-3 flex flex-col">
			<h2 className="px-4">Cart</h2>

			<div className="p-4 flex-1 border-b border-gray-300">
				{items.map(({ title, price, profile }) => (
					<div
						key={profile.id}
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
			</div>
			<div className="p-4 border-b border-gray-300 flex flex-row justify-between">
				<div className="text-lg text-gray-600">Subtotal</div>
				<div>${sum(items.map(({ price }) => price))}</div>
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
