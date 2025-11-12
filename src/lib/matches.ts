export function isSetDone(
	teamAScore: number,
	teamBScore: number,
	winScore: number,
) {
	return (
		(teamAScore >= winScore && teamAScore - teamBScore >= 2) ||
		(teamBScore >= winScore && teamBScore - teamAScore >= 2)
	);
}
