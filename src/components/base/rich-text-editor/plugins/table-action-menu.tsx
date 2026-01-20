import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$deleteTableColumn__EXPERIMENTAL,
	$deleteTableRow__EXPERIMENTAL,
	$getTableCellNodeFromLexicalNode,
	$getTableColumnIndexFromTableCellNode,
	$getTableNodeFromLexicalNodeOrThrow,
	$getTableRowIndexFromTableCellNode,
	$insertTableColumn__EXPERIMENTAL,
	$insertTableRow__EXPERIMENTAL,
	$isTableCellNode,
	$isTableRowNode,
	TableCellHeaderStates,
	TableCellNode,
} from "@lexical/table";
import { $getSelection, $isRangeSelection } from "lexical";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	Button,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
} from "react-aria-components";

export function TableActionMenuPlugin({
	anchorElem = document.body,
}: {
	anchorElem?: HTMLElement;
}) {
	const [editor] = useLexicalComposerContext();
	const [tableCellNode, setTableCellNode] = useState<TableCellNode | null>(
		null,
	);
	const [menuPosition, setMenuPosition] = useState<{
		top: number;
		left: number;
	} | null>(null);

	const updateTableCellNode = useCallback(() => {
		editor.getEditorState().read(() => {
			const selection = $getSelection();

			if ($isRangeSelection(selection)) {
				const node = selection.anchor.getNode();
				const cellNode = $getTableCellNodeFromLexicalNode(node);

				if (cellNode) {
					setTableCellNode(cellNode);
				} else {
					setTableCellNode(null);
				}
			} else {
				setTableCellNode(null);
			}
		});
	}, [editor]);

	useEffect(() => {
		return editor.registerUpdateListener(() => {
			updateTableCellNode();
		});
	}, [editor, updateTableCellNode]);

	useEffect(() => {
		if (!tableCellNode) {
			setMenuPosition(null);
			return;
		}

		const updatePosition = () => {
			const cellElement = editor.getElementByKey(tableCellNode.getKey());

			if (cellElement) {
				const cellRect = cellElement.getBoundingClientRect();
				const anchorRect = anchorElem.getBoundingClientRect();

				setMenuPosition({
					left: cellRect.right - 30 - anchorRect.left,
					top: cellRect.top + 4 - anchorRect.top,
				});
			}
		};

		updatePosition();

		// Update position on scroll or resize
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);

		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [editor, tableCellNode, anchorElem]);

	const insertTableRowAtSelection = useCallback(
		(shouldInsertAfter: boolean) => {
			editor.update(() => {
				$insertTableRow__EXPERIMENTAL(shouldInsertAfter);
			});
		},
		[editor],
	);

	const insertTableColumnAtSelection = useCallback(
		(shouldInsertAfter: boolean) => {
			editor.update(() => {
				$insertTableColumn__EXPERIMENTAL(shouldInsertAfter);
			});
		},
		[editor],
	);

	const deleteTableRowAtSelection = useCallback(() => {
		editor.update(() => {
			$deleteTableRow__EXPERIMENTAL();
		});
	}, [editor]);

	const deleteTableColumnAtSelection = useCallback(() => {
		editor.update(() => {
			$deleteTableColumn__EXPERIMENTAL();
		});
	}, [editor]);

	const toggleTableRowIsHeader = useCallback(() => {
		editor.update(() => {
			if (tableCellNode) {
				const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
				const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
				const tableRows = tableNode.getChildren();

				if (tableRowIndex >= 0 && tableRowIndex < tableRows.length) {
					const tableRow = tableRows[tableRowIndex];

					if ($isTableRowNode(tableRow)) {
						tableRow.getChildren().forEach((tableCell) => {
							if ($isTableCellNode(tableCell)) {
								tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW);
							}
						});
					}
				}
			}
		});
	}, [editor, tableCellNode]);

	const toggleTableColumnIsHeader = useCallback(() => {
		editor.update(() => {
			if (tableCellNode) {
				const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
				const tableColumnIndex =
					$getTableColumnIndexFromTableCellNode(tableCellNode);
				const tableRows = tableNode.getChildren();

				for (let r = 0; r < tableRows.length; r++) {
					const tableRow = tableRows[r];

					if ($isTableRowNode(tableRow)) {
						const tableCells = tableRow.getChildren();

						if (tableColumnIndex >= 0 && tableColumnIndex < tableCells.length) {
							const tableCell = tableCells[tableColumnIndex];

							if ($isTableCellNode(tableCell)) {
								tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN);
							}
						}
					}
				}
			}
		});
	}, [editor, tableCellNode]);

	if (!tableCellNode || !menuPosition) {
		return null;
	}

	return createPortal(
		<span
			className="absolute"
			style={{ top: menuPosition.top, left: menuPosition.left }}
		>
			<MenuTrigger>
				<Button className="flex items-center justify-center w-6 h-6 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-opacity shadow-sm">
					<ChevronDown size={14} />
				</Button>
				<Popover className="bg-white border border-gray-300 rounded-md shadow-lg py-1 z-50 min-w-[180px]">
					<Menu className="outline-none">
						<MenuItem
							id="insert-row-above"
							onAction={() => insertTableRowAtSelection(false)}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Insert row above
						</MenuItem>
						<MenuItem
							id="insert-row-below"
							onAction={() => insertTableRowAtSelection(true)}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Insert row below
						</MenuItem>
						<MenuItem
							id="insert-column-left"
							onAction={() => insertTableColumnAtSelection(false)}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Insert column left
						</MenuItem>
						<MenuItem
							id="insert-column-right"
							onAction={() => insertTableColumnAtSelection(true)}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Insert column right
						</MenuItem>
						<hr className="my-1 border-gray-200" />
						<MenuItem
							id="delete-row"
							onAction={deleteTableRowAtSelection}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Delete row
						</MenuItem>
						<MenuItem
							id="delete-column"
							onAction={deleteTableColumnAtSelection}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Delete column
						</MenuItem>
						<hr className="my-1 border-gray-200" />
						<MenuItem
							id="toggle-row-header"
							onAction={toggleTableRowIsHeader}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Toggle row header
						</MenuItem>
						<MenuItem
							id="toggle-column-header"
							onAction={toggleTableColumnIsHeader}
							className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
						>
							Toggle column header
						</MenuItem>
					</Menu>
				</Popover>
			</MenuTrigger>
		</span>,
		anchorElem,
	);
}
