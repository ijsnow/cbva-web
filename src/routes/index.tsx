import { createFileRoute, Link } from "@tanstack/react-router";
import clsx from "clsx";
import { useIsLoggedIn } from "@/auth/shared";
import { button } from "@/components/base/button";
import { title } from "@/components/base/primitives";
import { VenuesList } from "@/components/venues/list";
import { DefaultLayout } from "@/layouts/default";

const BRAND_ANCHOR_CLASS =
	"max-h-[85px] flex-1 flex items-center justify-center";

const BRAND_IMG_CLASS = "max-w-full max-h-full";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const isLoggedIn = useIsLoggedIn();

	return (
		<DefaultLayout classNames={{ content: "bg-content-background" }}>
			<div className="relative h-[75svh]">
				<div className="h-full overflow-hidden">
					<img
						src="/homepage.jpg"
						alt="CBVA Home Page"
						className="w-full h-full object-cover"
						style={{ objectPosition: "50% 65%" }}
					/>
				</div>
				<Link
					to={isLoggedIn ? "/tournaments" : "/sign-up"}
					className={button({
						class:
							"absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 font-bold",
						color: "primary",
						radius: "full",
						size: "4xl",
					})}
				>
					{isLoggedIn ? "Events" : "Sign Up"}
				</Link>
			</div>
			<div className="w-full pt-10 pb-6 flex flex-col md:flex-row space-y-6 md:space-y-0 justify-center items-center">
				<div className="flex-1 flex flex-row w-full">
					<a
						className={BRAND_ANCHOR_CLASS}
						href="https://getslunks.com/"
						target="_blank"
						rel="noopener"
					>
						<img
							className={clsx(BRAND_IMG_CLASS, "scale-150")}
							src="/brands/slunks.png"
							alt="Slunks"
						/>
					</a>
					<a
						className={BRAND_ANCHOR_CLASS}
						href="https://www.cedars-sinai.org/programs/ortho/specialties/sports-medicine.html"
						target="_blank"
						rel="noopener"
					>
						<img
							className={BRAND_IMG_CLASS}
							src="/brands/cedars-sinai/stacked.svg"
							alt="Cedars Sinai Sports Medicine"
						/>
					</a>
					<a
						className={BRAND_ANCHOR_CLASS}
						href="https://www.michelobultra.com/"
						target="_blank"
						rel="noopener"
					>
						<img
							className={BRAND_IMG_CLASS}
							src="/brands/mkultra.svg"
							alt="Michelob Ultra"
						/>
					</a>
				</div>
				<div className="flex-1 flex flex-row w-full">
					<a
						className={BRAND_ANCHOR_CLASS}
						href="https://www.konabigwave.com/"
						target="_blank"
						rel="noopener"
					>
						<img
							className={BRAND_IMG_CLASS}
							src="/brands/kona.svg"
							alt="Kona Big Wave"
						/>
					</a>
					<a
						className={BRAND_ANCHOR_CLASS}
						href="https://www.toyota.com/"
						target="_blank"
						rel="noopener"
					>
						<img
							className={BRAND_IMG_CLASS}
							src="/brands/toyota.svg"
							alt="Toyota"
						/>
					</a>
					<a
						className={BRAND_ANCHOR_CLASS}
						href="https://www.wilson.com/en-us/volleyball"
						target="_blank"
						rel="noopener"
					>
						<img
							className={clsx(BRAND_IMG_CLASS, "scale-75")}
							src="/brands/wilson.svg"
							alt="Wilson"
						/>
					</a>
				</div>
			</div>
			<div className="relative w-full bg-navbar-background text-navbar-foreground text-center h-[75svh]">
				<img
					alt="A bear"
					src="/bear.svg"
					className="absolute left-0 top-1/2 -translate-y-1/2 h-1/4 md:h-auto z-0"
				/>
				<img
					alt="A bear"
					src="/bear.svg"
					className="absolute right-0 -scale-x-100 top-1/2 h-1/4 md:h-auto -translate-y-1/2 z-0"
				/>

				<div className="relative z-1 flex flex-col space-y-6 justify-center items-center h-full max-w-2xl mx-auto px-3">
					<h1 className={title({ size: "md", class: "leading-tight" })}>
						The best of the best win on California sand.
					</h1>
					<h2 className={title({ size: "lg" })}>Join Them. Beat Them.</h2>
					<Link
						to={isLoggedIn ? "/tournaments" : "/sign-up"}
						className={button({
							color: "primary",
							radius: "full",
							size: "lg",
							className: "font-bold",
						})}
					>
						Start Here
					</Link>
				</div>
			</div>
			<div className="relative flex flex-col items-center justify-center text-start w-full h-[90svh]">
				<img
					loading="lazy"
					src="/premier_bg.jpg"
					className="h-full w-full object-cover"
					alt="View of a tournament from above"
				/>
				<div className="absolute top-0 left-0 flex flex-col items-center justify-center text-center w-full h-full">
					<div className="flex flex-col items-center justify-center max-w-3xl space-y-3 h-full">
						<div className="relative w-[10svw] md:w-[64]">
							<img
								loading="lazy"
								src="/star.svg"
								className="w-[10svw] md:w-[64] absolute bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-8"
								alt="Star"
							/>
						</div>
						<h3
							className={title({ size: "xs", class: "font-bold text-white" })}
						>
							The CBVA is California's premier tour
						</h3>
						<p className="text-[5svw] md:text-4xl mx-6 my-2 max-w-[900] font-light text-white leading-snug md:leading-snug pb-[100]">
							Founded in 1962, the CBVA was created to bring together all levels
							of beach volleyball players to compete in high-quality tournaments
							along the California coast.
						</p>
					</div>
				</div>
			</div>
			<VenuesList />
		</DefaultLayout>
	);
}
