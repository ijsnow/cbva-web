import { Link, type LinkProps } from "@tanstack/react-router";
import clsx from "clsx";
import { ChevronDownIcon, MenuIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Button,
	Menu,
	MenuItem,
	MenuSection,
	MenuTrigger,
	SubmenuTrigger,
	Text,
} from "react-aria-components";
import type { Viewer } from "@/auth";
import { useViewerId } from "@/auth/shared";
import { Popover } from "@/components/base/popover";

type NavbarItem = {
	kind: "item";
	className?: string;
	topNavItemClassName?: string;
	subMenuClassName?: string;
	to: LinkProps["to"];
	params?: LinkProps["params"];
	label: ReactNode;
	visible?: (viewer?: Viewer["id"] | null) => boolean;
};

type NavbarGroupItem = {
	kind: "group";
	key: string;
	className?: string;
	topNavItemClassName?: string;
	subMenuClassName?: string;
	label: ReactNode;
	visible?: (viewer?: Viewer["id"] | null) => boolean;
	children: NavbarItem[];
};

const links: (NavbarItem | NavbarGroupItem)[] = [
	{
		kind: "item",
		to: "/tournaments",
		label: "Tournaments",
	},
	{
		kind: "group",
		key: "juniors",
		label: "Juniors",
		children: [
			{
				kind: "item",
				to: "/juniors",
				label: "About",
			},
			{
				kind: "item",
				to: "/juniors/leaderboard/{-$gender}",
				params: { gender: "girls" },
				label: "Leaderboard",
			},
		],
	},
	{
		kind: "item",
		to: "/search",
		label: "Search",
	},
	{
		kind: "group",
		key: "ratings",
		label: "Ratings",
		topNavItemClassName: "hidden lg:flex",
		subMenuClassName: "inline-block lg:hidden",
		children: [
			{
				kind: "item",
				to: "/ratings",
				label: "About",
			},
			{
				kind: "item",
				to: "/leaderboard/{-$gender}",
				params: { gender: "womens" },
				label: "Leaderboard",
			},
		],
	},
	{
		kind: "item",
		visible: (viewer) => !Boolean(viewer),
		className: "bg-gray-500 hidden md:inline-block",
		subMenuClassName: "md:hidden",
		to: "/log-in",
		label: "Log In",
	},
	{
		kind: "item",
		visible: (viewer) => !Boolean(viewer),
		className: "bg-red-500 hidden md:inline-block",
		subMenuClassName: "md:hidden",
		to: "/sign-up",
		label: "Sign Up",
	},
	{
		kind: "item",
		visible: (viewer) => Boolean(viewer),
		className: "hidden md:inline-block",
		subMenuClassName: "md:hidden",
		to: "/account",
		label: "Account",
	},
];

const linkClassName =
	"uppercase text-navbar-foreground hover:bg-navbar-foreground hover:text-navbar-foreground-hover px-3 py-1 font-bold tracking-wide";

export function Navbar() {
	const viewerId = useViewerId();

	const visibleLinks = links.filter(({ visible = () => true }) =>
		visible(viewerId),
	);

	return (
		<nav className="w-full bg-navbar-background flex items-center p-3 gap-3">
			<Menu
				aria-label="Navigation Menu"
				className="flex-1 w-full flex flex-row items-center justify-between lg:justify-center gap-3"
			>
				<MenuSection className="flex-1 gap-3 items-center justify-end hidden lg:flex">
					{visibleLinks
						.slice(0, 3)
						.map(({ label, className, topNavItemClassName, ...rest }) =>
							rest.kind === "item" ? (
								<MenuItem key={rest.to} className="rounded-full outline-none">
									<Link
										to={rest.to}
										className={clsx(
											linkClassName,
											"rounded-full",
											className,
											topNavItemClassName,
										)}
									>
										{label}
									</Link>
								</MenuItem>
							) : (
								<SubmenuTrigger key={rest.key}>
									<MenuItem id={rest.key} className="outline-none rounded-full">
										<Text
											slot="label"
											className={clsx(
												linkClassName,
												"rounded-full cursor-pointer flex flex-row",
												className,
												topNavItemClassName,
											)}
										>
											{label}
											<ChevronDownIcon className="ml-2" />
										</Text>
									</MenuItem>
									<Popover placement="bottom">
										<Menu className="bg-navbar-background border border-navbar-border p-2 flex flex-col gap-2 rounded-lg">
											{rest.children.map(
												({
													to,
													params,
													label,
													className,
													subMenuClassName,
												}) => (
													<MenuItem
														key={to}
														className={clsx(
															"rounded-lg items-stretch justify-stretch",
															subMenuClassName,
														)}
													>
														<Link
															to={to}
															params={params}
															className={clsx(
																linkClassName,
																"rounded-lg w-full inline-block",
																className,
															)}
														>
															{label}
														</Link>
													</MenuItem>
												),
											)}
										</Menu>
									</Popover>
								</SubmenuTrigger>
							),
						)}
				</MenuSection>
				<MenuItem className="flex lg:justify-center transition-colors hover:brightness-75 rounded-full outline-none">
					<Link to="/">
						<img alt="CBVA Logo" className="h-12" src="/logos/cbva.svg" />
					</Link>
				</MenuItem>
				<MenuSection className="flex-1 justify-end lg:justify-start hidden md:flex gap-3">
					{visibleLinks
						.slice(3)
						.map(({ label, className, topNavItemClassName, ...rest }) =>
							rest.kind === "item" ? (
								<MenuItem key={rest.to} className="rounded-full outline-none">
									<Link
										to={rest.to}
										className={clsx(
											linkClassName,
											"rounded-full",
											className,
											topNavItemClassName,
										)}
									>
										{label}
									</Link>
								</MenuItem>
							) : (
								<SubmenuTrigger key={rest.key}>
									<MenuItem id={rest.key} className="outline-none rounded-full">
										<Text
											slot="label"
											className={clsx(
												linkClassName,
												"rounded-full flex flex-row cursor-pointer",
												className,
												topNavItemClassName,
											)}
										>
											{label}
											<ChevronDownIcon className="ml-2" />
										</Text>
									</MenuItem>
									<Popover>
										<Menu className="bg-navbar-background border border-navbar-border p-2 flex flex-col gap-2 rounded-lg">
											{rest.children.map(
												({
													to,
													params,
													label,
													className,
													subMenuClassName,
												}) => (
													<MenuItem
														key={to}
														className={clsx(
															"rounded-lg items-stretch justify-stretch",
															subMenuClassName,
														)}
													>
														<Link
															to={to}
															params={params}
															className={clsx(
																linkClassName,
																"rounded-lg w-full inline-block",
																className,
															)}
														>
															{label}
														</Link>
													</MenuItem>
												),
											)}
										</Menu>
									</Popover>
								</SubmenuTrigger>
							),
						)}
				</MenuSection>
			</Menu>
			<MenuTrigger trigger="press">
				<Button className="rounded-full p-2 lg:hidden text-navbar-foreground hover:bg-navbar-foreground hover:text-navbar-foreground-hover pressed:bg-navbar-foreground pressed:text-navbar-foreground-hover">
					<MenuIcon className="w-5 h-5" />
				</Button>
				<Popover>
					<Menu className="bg-navbar-background border border-navbar-border p-2 flex flex-col gap-2 rounded-lg">
						{visibleLinks.map(
							({ label, className, subMenuClassName, ...rest }) =>
								rest.kind === "item" ? (
									<MenuItem
										key={rest.to}
										className={clsx(
											"rounded-lg items-stretch justify-stretch",
											subMenuClassName,
										)}
									>
										<Link
											to={rest.to}
											className={clsx(
												linkClassName,
												"rounded-lg w-full inline-block",
												className,
											)}
										>
											{label}
										</Link>
									</MenuItem>
								) : (
									<SubmenuTrigger key={rest.key}>
										<MenuItem
											id={`mobile-${rest.key}`}
											className={clsx(
												"rounded-lg items-stretch justify-stretch outline-none",
												subMenuClassName,
											)}
										>
											<Text
												slot="label"
												className={clsx(
													linkClassName,
													"rounded-lg w-full flex flex-row justify-between cursor-pointer",
													className,
												)}
											>
												{label}
												<ChevronDownIcon className="ml-2" />
											</Text>
										</MenuItem>
										<Popover>
											<Menu className="bg-navbar-background border border-navbar-border p-2 flex flex-col gap-2 rounded-lg">
												{rest.children.map(
													({
														to,
														params,
														label,
														className,
														subMenuClassName,
													}) => (
														<MenuItem
															key={to}
															className={clsx(
																"rounded-lg items-stretch justify-stretch",
																subMenuClassName,
															)}
														>
															<Link
																to={to}
																params={params}
																className={clsx(
																	linkClassName,
																	"rounded-lg w-full inline-block",
																	className,
																)}
															>
																{label}
															</Link>
														</MenuItem>
													),
												)}
											</Menu>
										</Popover>
									</SubmenuTrigger>
								),
						)}
					</Menu>
				</Popover>
			</MenuTrigger>
		</nav>
	);
}
