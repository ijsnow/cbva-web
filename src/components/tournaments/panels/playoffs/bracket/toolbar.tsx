import {
	type Node,
	useNodes,
	useNodesInitialized,
	useReactFlow,
	useViewport,
} from "@xyflow/react";
import { useResponsive } from "ahooks";
import {
	ArrowDown,
	ArrowDownLeft,
	ArrowRight,
	ArrowUp,
	ArrowUpLeft,
} from "lucide-react";
import {
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import { Button } from "@/components/base/button";
import { type BracketMatch, useBracketContext } from ".";

export function Toolbar({
	rounds,
	container,
	children,
}: {
	rounds: BracketMatch[][];
	container: RefObject<HTMLDivElement | null>;
	children: ReactNode;
}) {
	const controller = useReactFlow();

	const viewport = useViewport();
	const nodes = useNodes<Node<BracketMatch>>();
	const size = useResponsive();

	const topPadding = size?.medium ? 100 : 25;

	const closestNodeToCenter = useMemo(() => {
		const bounds = container.current?.getBoundingClientRect();

		if (!bounds) {
			return null;
		}

		// Calculate the focus point in screen coordinates
		// Horizontally: center of viewport
		// Vertically: topPadding distance from top
		const screenFocusX = bounds.width / 2;
		const screenFocusY = topPadding;

		// Convert screen coordinates to flow coordinates
		const flowFocusX = (screenFocusX - viewport.x) / viewport.zoom;
		const flowFocusY = (screenFocusY - viewport.y) / viewport.zoom;

		// Find the node closest to this focus point
		let closestNode: Node<BracketMatch> | null = null;
		let minDistance = Number.POSITIVE_INFINITY;

		for (const node of nodes) {
			const nodeWidth = node.measured?.width ?? node.width ?? 400;
			const nodeHeight = node.measured?.height ?? node.height ?? 200;

			// Calculate the node's "focus point" (horizontally centered, at the top)
			const nodeFocusX = node.position.x + nodeWidth / 2;
			const nodeFocusY = node.position.y; // Top of the node

			// Calculate distance from viewport focus point to node focus point
			const distance = Math.sqrt(
				(nodeFocusX - flowFocusX) ** 2 + (nodeFocusY - flowFocusY) ** 2,
			);

			if (distance < minDistance) {
				minDistance = distance;
				closestNode = node;
			}
		}

		return closestNode;
	}, [container, nodes, viewport, topPadding]);

	const getNodeCoords = useCallback(
		(id: number) => {
			for (const [r, round] of rounds.entries()) {
				for (const [m, mat] of round.entries()) {
					if (mat.id === id) {
						return [r, m];
					}
				}
			}

			return [null, null];
		},
		[rounds],
	);

	const [roundOfClosestNodeToCenter, matchClosestToCenter] = useMemo(() => {
		if (closestNodeToCenter) {
			return getNodeCoords(closestNodeToCenter.data.id);
		}

		return [null, null];
	}, [closestNodeToCenter, getNodeCoords]);

	// const roundOfClosestNodeToCenter = useMemo(() => {
	//   return rounds.findIndex((round) =>
	//     round.find((mat) => mat.id.toString() === closestNodeToCenter?.id),
	//   );
	// }, [closestNodeToCenter, rounds]);

	const nodesInitialized = useNodesInitialized();

	const centerViewportAtNodeWithId = useCallback(
		(id: number) => {
			const target = controller.getNode(id.toString());
			const bounds = container.current?.getBoundingClientRect();

			if (target && bounds) {
				// Use measured dimensions if available, otherwise use defaults
				const nodeWidth = target.measured?.width ?? target.width ?? 400;
				const nodeHeight = target.measured?.height ?? target.height ?? 200;

				const zoom = 0.8;

				// Calculate the horizontal center (node should be centered horizontally)
				const targetX = target.position.x + nodeWidth / 2;

				// Calculate Y position to place node at top with padding
				// setCenter centers the viewport at the given point, so we need to offset by half the viewport height
				const viewportHeightInFlowCoords = bounds.height / zoom;
				const paddingInFlowCoords = topPadding / zoom;

				// To place the node top at 'topPadding' from viewport top:
				// The center point should be at: nodeTop + (viewportHeight / 2)
				const targetY =
					target.position.y +
					viewportHeightInFlowCoords / 2 -
					paddingInFlowCoords;

				controller.setCenter(targetX, targetY, {
					zoom: zoom,
					duration: 800,
				});
			}
		},
		[controller, topPadding, container],
	);

	const centerViewportAtNode = (roundIdx: number, matchIdx: number) => {
		centerViewportAtNodeWithId(rounds[roundIdx][matchIdx].id);
	};

	const {
		state: { nodeIdToCenter },
		setState,
	} = useBracketContext();

	useEffect(() => {
		if (nodeIdToCenter) {
			setState((state) => ({
				...state,
				nodeIdToCenter: null,
			}));

			centerViewportAtNodeWithId(nodeIdToCenter);
		}
	}, [nodeIdToCenter, setState, centerViewportAtNodeWithId]);

	const centeredRound =
		roundOfClosestNodeToCenter !== null
			? rounds[roundOfClosestNodeToCenter]
			: null;

	return (
		<>
			<div className="w-full bg-gray-300 py-2 px-2 md:py-4 flex flex-row items-center justify-center space-x-1 md:space-x-3 overflow-x-scroll">
				{rounds.map((r, i) => (
					<Button
						key={r.map((m) => m.id).join(",")}
						color={i === roundOfClosestNodeToCenter ? "secondary" : "alternate"}
						radius="full"
						className="text-xs md:text-sm"
						onPress={() => centerViewportAtNode(i, 0)}
					>
						Round {i + 1}
					</Button>
				))}
			</div>
			<div className="relative w-full h-full">
				{children}
				<div className="flex flex-row absolute left-0 top-0 bottom-0">
					<div className="flex flex-col justify-start h-full space-y-3 p-3">
						{centeredRound?.map((m, i) => (
							<Button
								key={m.id}
								radius="full"
								variant="icon"
								className="drop-shadow-xl"
								color={
									m.id.toString() === closestNodeToCenter?.id
										? "secondary"
										: "alternate"
								}
								onPress={() => {
									if (typeof roundOfClosestNodeToCenter === "number") {
										centerViewportAtNode(roundOfClosestNodeToCenter, i);
									}
								}}
							>
								{i + 1}
							</Button>
						))}
					</div>
					<div className="flex flex-row fixed left-0 bottom-0 right-0 justify-center space-x-3 p-3">
						<Button
							radius="full"
							variant="icon"
							className="drop-shadow-xl"
							color="alternate"
							isDisabled={
								typeof closestNodeToCenter?.data.teamAPreviousMatchId !==
								"number"
							}
							onPress={() => {
								const upLeftNode =
									closestNodeToCenter?.data.teamAPreviousMatchId;

								if (upLeftNode) {
									const coords = getNodeCoords(upLeftNode);

									centerViewportAtNode(coords[0], coords[1]);
								}
							}}
						>
							<ArrowUpLeft size={16} />
						</Button>
						<Button
							radius="full"
							variant="icon"
							className="drop-shadow-xl"
							color="alternate"
							isDisabled={
								typeof closestNodeToCenter?.data.teamBPreviousMatchId !==
								"number"
							}
							onPress={() => {
								const downLeftNode =
									closestNodeToCenter?.data.teamBPreviousMatchId;

								if (downLeftNode) {
									const coords = getNodeCoords(downLeftNode);

									centerViewportAtNode(coords[0], coords[1]);
								}
							}}
						>
							<ArrowDownLeft size={16} />
						</Button>
						<Button
							radius="full"
							variant="icon"
							className="drop-shadow-xl"
							color="alternate"
							isDisabled={
								!(
									typeof roundOfClosestNodeToCenter === "number" &&
									typeof matchClosestToCenter === "number"
								) || matchClosestToCenter === 0
							}
							onPress={() => {
								if (
									typeof roundOfClosestNodeToCenter === "number" &&
									typeof matchClosestToCenter === "number"
								) {
									centerViewportAtNode(
										roundOfClosestNodeToCenter,
										matchClosestToCenter - 1,
									);
								}
							}}
						>
							<ArrowUp size={16} />
						</Button>
						<Button
							radius="full"
							variant="icon"
							className="drop-shadow-xl"
							color="alternate"
							isDisabled={
								!(
									typeof roundOfClosestNodeToCenter === "number" &&
									typeof matchClosestToCenter === "number"
								) ||
								(centeredRound
									? matchClosestToCenter === centeredRound.length - 1
									: true)
							}
							onPress={() => {
								if (
									typeof roundOfClosestNodeToCenter === "number" &&
									typeof matchClosestToCenter === "number"
								) {
									centerViewportAtNode(
										roundOfClosestNodeToCenter,
										matchClosestToCenter + 1,
									);
								}
							}}
						>
							<ArrowDown size={16} />
						</Button>
						<Button
							radius="full"
							variant="icon"
							className="drop-shadow-xl"
							color="alternate"
							isDisabled={
								typeof closestNodeToCenter?.data.nextMatchId !== "number"
							}
							onPress={() => {
								const rightNode = closestNodeToCenter?.data.nextMatchId;

								if (rightNode) {
									const coords = getNodeCoords(rightNode);

									centerViewportAtNode(coords[0], coords[1]);
								}
							}}
						>
							<ArrowRight size={16} />
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
