import { useEffect, useState } from "react";
import type { MatchSet } from "@/db/schema";
import { isSetDone } from "@/lib/matches";
import { Button } from "../base/button";
import { Modal } from "../base/modal";
import { title } from "../base/primitives";

type SideSwitchModalProps = Pick<
	MatchSet,
	"teamAScore" | "teamBScore" | "winScore"
>;

export function SideSwitchModal({
	teamAScore,
	teamBScore,
	winScore,
}: SideSwitchModalProps) {
	const mod = winScore === 15 ? 5 : 7;

	const remainder = (teamAScore + teamBScore) % mod;

	const [isOpen, setOpen] = useState(false);

	useEffect(() => {
		if (teamAScore + teamBScore > 0 && remainder === 0) {
			setOpen(true);
		}
	}, [teamAScore, teamBScore, remainder]);

	return (
		<>
			<p>
				<span className="italic font-semibold">{mod - remainder}</span> points
				until side switch.
			</p>
			<Modal isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-3">
					<h1 className={title({ size: "sm" })}>Side Switch!</h1>

					<img
						className="rounded-md"
						src="https://media1.tenor.com/m/y7gmBQOMllMAAAAC/fun-summer.gif"
						alt="penguins playing volleyball"
					/>

					<Button onPress={() => setOpen(false)} color="primary">
						Done
					</Button>
				</div>
			</Modal>
		</>
	);
}
