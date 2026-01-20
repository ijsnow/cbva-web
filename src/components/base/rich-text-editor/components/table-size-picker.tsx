import { useState } from "react";
import { Button, Popover } from "react-aria-components";
import { TableIcon } from "lucide-react";
import { tv } from "tailwind-variants";

const MAX_ROWS = 10;
const MAX_COLS = 10;

const buttonClassName = tv({
	base: "rounded-md p-2 cursor-pointer hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed",
	variants: {
		active: {
			true: "bg-gray-300",
		},
	},
});

type TableSizePickerProps = {
	onSelect: (rows: number, columns: number) => void;
};

export function TableSizePicker({ onSelect }: TableSizePickerProps) {
	const [hoveredCell, setHoveredCell] = useState<{
		row: number;
		col: number;
	} | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const handleCellClick = (row: number, col: number) => {
		onSelect(row + 1, col + 1);
		setIsOpen(false);
		setHoveredCell(null);
	};

	const isCellHighlighted = (row: number, col: number) => {
		if (!hoveredCell) return false;
		return row <= hoveredCell.row && col <= hoveredCell.col;
	};

	return (
		<>
			<Button
				onPress={() => setIsOpen(!isOpen)}
				className={buttonClassName()}
				aria-label="Insert Table"
			>
				<TableIcon size={16} />
			</Button>
			{isOpen && (
				<Popover
					isOpen={isOpen}
					onOpenChange={setIsOpen}
					className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg p-3 mt-1"
				>
					<div className="flex flex-col gap-2">
						<div className="text-sm font-medium text-gray-700 text-center">
							{hoveredCell
								? `${hoveredCell.row + 1} × ${hoveredCell.col + 1}`
								: "Select table size"}
						</div>
						<div className="grid gap-0.5">
							{Array.from({ length: MAX_ROWS }, (_, rowIndex) => (
								<div key={rowIndex} className="flex gap-0.5">
									{Array.from({ length: MAX_COLS }, (_, colIndex) => (
										<button
											key={colIndex}
											type="button"
											className={`w-5 h-5 border border-gray-300 hover:border-gray-400 transition-colors ${
												isCellHighlighted(rowIndex, colIndex)
													? "bg-blue-200"
													: "bg-white"
											}`}
											onMouseEnter={() =>
												setHoveredCell({ row: rowIndex, col: colIndex })
											}
											onClick={() => handleCellClick(rowIndex, colIndex)}
										/>
									))}
								</div>
							))}
						</div>
					</div>
				</Popover>
			)}
		</>
	);
}
