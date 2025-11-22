import {
	Controls,
	type Node,
	ReactFlow,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
	createContext,
	type Dispatch,
	type SetStateAction,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { PlayoffMatch } from "@/db/schema";
import { isNotNull, isNotNullOrUndefined } from "@/utils/types";
import type { MatchTeam } from "../../games/pool-match-grid";
import { MatchEdge } from "./match-edge";
import { MatchNode } from "./match-node";
import { Toolbar } from "./toolbar";

const nodeTypes = { match: MatchNode };
const edgeTypes = {
	match: MatchEdge,
};

type MatchesMap = {
	[key: number]: BracketMatch;
};

function getBracketRounds(
	map: MatchesMap,
	match: BracketMatch,
): (BracketMatch & { midx: number })[][] {
	const rounds: (BracketMatch & { midx: number })[][] = [];

	// Start with the finals match in round 0
	rounds[0] = [{ ...match, midx: 0 }];

	// Process each round to find previous matches
	let currentRoundIndex = 0;

	while (rounds[currentRoundIndex] && rounds[currentRoundIndex].length > 0) {
		const nextRoundMatches: (BracketMatch & { midx: number })[] = [];

		for (const currentMatch of rounds[currentRoundIndex]) {
			// Add team A's previous match if it exists
			if (currentMatch.teamAPreviousMatchId !== null) {
				const prevMatch = map[currentMatch.teamAPreviousMatchId];
				if (prevMatch) {
					if (!prevMatch.nextMatchId) {
						prevMatch.nextMatchId = currentMatch.id;
					}

					nextRoundMatches.push({
						...prevMatch,
						midx: nextRoundMatches.length,
					});
				}
			}

			// Add team B's previous match if it exists
			if (currentMatch.teamBPreviousMatchId !== null) {
				const prevMatch = map[currentMatch.teamBPreviousMatchId];
				if (prevMatch) {
					if (!prevMatch.nextMatchId) {
						prevMatch.nextMatchId = currentMatch.id;
					}

					nextRoundMatches.push({
						...prevMatch,
						midx: nextRoundMatches.length,
					});
				}
			}
		}

		if (nextRoundMatches.length > 0) {
			rounds[currentRoundIndex + 1] = nextRoundMatches;
		}

		currentRoundIndex++;
	}

	return rounds;
}

function getNodesFromRounds(
	rounds: (BracketMatch & { midx: number })[][],
): Node<BracketMatch & { midx: number; roundIdx: number }>[] {
	const nodes: Node<BracketMatch & { midx: number; roundIdx: number }>[] = [];

	const roundSizes = rounds.map((_, i) =>
		i === 0 ? 1 : rounds[i - 1]?.length * 2,
	);

	roundSizes.reverse();
	rounds.reverse();

	const maxHeight = Math.max(...roundSizes);
	const matchHeight = 300; // Height allocated per match slot

	const totalHeight = maxHeight * matchHeight;

	for (const [ridx, round] of rounds.entries()) {
		const roundRows = roundSizes[ridx];
		const expectedMatches = roundRows;
		const isPlayInRound = round.length < expectedMatches;

		const nextRound = rounds[ridx + 1];

		const spacing = totalHeight / (roundRows + 1);

		for (const match of round) {
			if (isPlayInRound) {
				const nextMatch = nextRound.find((m) => m.id === match.nextMatchId);

				if (match.id === nextMatch?.teamAPreviousMatchId) {
					match.midx = nextMatch.midx * 2;
				} else if (match.id === nextMatch?.teamBPreviousMatchId) {
					match.midx = nextMatch.midx * 2 + 1;
				}
			}

			nodes.push({
				id: match.id.toString(),
				type: "match",
				position: {
					x: ridx * 800,
					y: spacing * (match.midx + 1),
				},
				data: {
					...match,
					roundIdx: ridx,
				},
				draggable: false,
				selectable: false,
			});
		}
	}

	return nodes;
}

function buildNodeTree(map: MatchesMap): {
	nodes: Node[];
	rounds: BracketMatch[][];
} {
	if (Object.values(map).length === 0) {
		return { nodes: [], rounds: [] };
	}

	const finals = Object.values(map).find(
		(match) =>
			match.nextMatchId === null &&
			isNotNullOrUndefined(match.teamAPreviousMatchId) &&
			isNotNullOrUndefined(match.teamBPreviousMatchId),
	);

	if (!finals) {
		throw new Error("Could not find finals match");
	}

	const rounds = getBracketRounds(map, finals);

	const nodes = getNodesFromRounds(rounds);

	return { nodes, rounds };
}

export type BracketMatch = PlayoffMatch & {
	teamA: MatchTeam;
	teamB: MatchTeam;
};

export type BracketProps = {
	matches: BracketMatch[];
};

type BracketContextState = {
	activeTeam: number | null;
	nodeIdToCenter: number | null;
};

const BracketContext = createContext<{
	state: BracketContextState;
	setState: Dispatch<SetStateAction<BracketContextState>>;
}>({
	state: { activeTeam: null, nodeIdToCenter: null },
	setState: () => {},
});

export function useBracketContext() {
	const context = useContext(BracketContext);

	return context;
}

export function useActiveTeam() {
	const {
		state: { activeTeam },
	} = useBracketContext();

	return activeTeam;
}

export function useSetActiveTeam() {
	const { setState } = useBracketContext();

	return (activeTeam: number | null) =>
		setState((state) => ({ ...state, activeTeam }));
}

export function useSetNodeIdToCenter() {
	const { setState } = useBracketContext();

	return (nodeIdToCenter: number) =>
		setState((state) => ({ ...state, nodeIdToCenter }));
}

function BracketFlow({ matches }: BracketProps) {
	const matchesMap = matches.reduce<{
		[key: number]: BracketMatch;
	}>((memo, match) => {
		memo[match.id] = match;

		return memo;
	}, {});

	const { nodes: initialNodes, rounds } = buildNodeTree(matchesMap);

	const initialEdges = matches.flatMap((match) =>
		[
			match.teamAPreviousMatchId
				? {
						id: [match.teamAPreviousMatchId, match.id].join(),
						target: match.id.toString(),
						source: match.teamAPreviousMatchId.toString(),
						sourceHandle: "a",
						targetHandle: "a",
						type: "step",
					}
				: null,
			match.teamBPreviousMatchId
				? {
						id: [match.teamBPreviousMatchId, match.id].join(),
						target: match.id.toString(),
						source: match.teamBPreviousMatchId.toString(),
						sourceHandle: "b",
						targetHandle: "b",
						type: "step",
					}
				: null,
		].filter(isNotNull),
	);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// Update nodes and edges when matches change
	useEffect(() => {
		const matchesMap = matches.reduce<{
			[key: number]: BracketMatch;
		}>((memo, match) => {
			memo[match.id] = match;
			return memo;
		}, {});

		const { nodes: newNodes } = buildNodeTree(matchesMap);

		const newEdges = matches.flatMap((match) =>
			[
				match.teamAPreviousMatchId
					? {
							id: [match.teamAPreviousMatchId, match.id].join(),
							target: match.id.toString(),
							source: match.teamAPreviousMatchId.toString(),
							sourceHandle: match.teamA?.id.toString(),
							targetHandle: match.teamA?.id.toString(),
							type: "match",
						}
					: null,
				match.teamBPreviousMatchId
					? {
							id: [match.teamBPreviousMatchId, match.id].join(),
							target: match.id.toString(),
							source: match.teamBPreviousMatchId.toString(),
							sourceHandle: match.teamB?.id.toString(),
							targetHandle: match.teamB?.id.toString(),
							type: "match",
						}
					: null,
			].filter(isNotNull),
		);

		setNodes(newNodes);
		setEdges(newEdges);
	}, [matches, setNodes, setEdges]);

	const containerRef = useRef<HTMLDivElement>(null);

	// Calculate bounds of all nodes to set translate extent
	// Add extra padding equal to half the viewport so any node can be centered
	const calculateBounds = () => {
		if (nodes.length === 0) {
			return { minX: -2000, minY: -2000, maxX: 3000, maxY: 3000 };
		}

		const containerBounds = containerRef.current?.getBoundingClientRect();

		// Use large padding to allow centering any node in the viewport
		// This should be at least half the viewport width/height
		const horizontalPadding = (containerBounds?.width || 2000) * 0.75;
		const verticalPadding = (containerBounds?.height || 1500) * 0.75;

		let minX = Number.POSITIVE_INFINITY;
		let minY = Number.POSITIVE_INFINITY;
		let maxX = Number.NEGATIVE_INFINITY;
		let maxY = Number.NEGATIVE_INFINITY;

		for (const node of nodes) {
			// Use measured dimensions if available, otherwise use default fallbacks
			const nodeWidth = node.measured?.width ?? node.width ?? 400;
			const nodeHeight = node.measured?.height ?? node.height ?? 200;

			minX = Math.min(minX, node.position.x);
			minY = Math.min(minY, node.position.y);
			maxX = Math.max(maxX, node.position.x + nodeWidth);
			maxY = Math.max(maxY, node.position.y + nodeHeight);
		}

		return {
			minX: minX - horizontalPadding,
			minY: minY - verticalPadding,
			maxX: maxX + horizontalPadding,
			maxY: maxY + verticalPadding,
		};
	};

	const bounds = calculateBounds();

	// TODO:
	//
	// - make a context for my own state, add 'hoveredTeam' to that instead of modifying node data
	//
	// - when clicking an edge, move to the node that is further from the center (or the point on the edge that was clicked)
	// - just arrow buttons to navigate instead of round 1, match 1, etc
	// - make center function anchor node to top of viewport
	// - mobile friendly, smaller match nodes and shorter distances between nodes
	// - when hovering a team, highlight their edges and slots in matches

	return (
		<div
			ref={containerRef}
			className="h-screen w-screen bg-content-background overflow-hidden relative"
		>
			<Toolbar rounds={rounds} container={containerRef}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					draggable={false}
					// panOnDrag={false}
					panOnScroll={true}
					// translateExtent={[
					// 	[bounds.minX, bounds.minY],
					// 	[bounds.maxX, bounds.maxY],
					// ]}
					fitView={true}
					fitViewOptions={{
						padding: 1000,
					}}
					preventScrolling={false}
					proOptions={{ hideAttribution: true }}
					onNodeMouseEnter={() => {}}
				>
					<Controls
						position={"top-right"}
						fitViewOptions={{
							padding: 1200,
						}}
					/>
				</ReactFlow>
			</Toolbar>
		</div>
	);
}

export function Bracket({ matches }: BracketProps) {
	const [state, setState] = useState<BracketContextState>({
		activeTeam: null,
		nodeIdToCenter: null,
	});

	return (
		<ReactFlowProvider>
			<BracketContext value={{ state, setState }}>
				<BracketFlow matches={matches} />
			</BracketContext>
		</ReactFlowProvider>
	);
}
