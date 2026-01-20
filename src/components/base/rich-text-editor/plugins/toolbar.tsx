/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$isListNode,
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListNode,
	REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
	INSERT_TABLE_COMMAND,
	type InsertTableCommandPayload,
	type InsertTableCommandPayloadHeaders,
} from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import {
	$createLinkNode,
	$isLinkNode,
	TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
	$createParagraphNode,
	$createTextNode,
	$getNodeByKey,
	$getSelection,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_LOW,
	FORMAT_ELEMENT_COMMAND,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	SELECTION_CHANGE_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import {
	BoldIcon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	LoaderCircleIcon,
	RedoIcon,
	StrikethroughIcon,
	TextAlignCenterIcon,
	TextAlignEndIcon,
	TextAlignJustifyIcon,
	TextAlignStartIcon,
	UnderlineIcon,
	UndoIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";
import { tv } from "tailwind-variants";
import { Button as BaseButton } from "../../button";
import { TableSizePicker } from "../components/table-size-picker";
import { LinkModal } from "./link-modal";

function Divider() {
	return <div className="w-px bg-gray-200 mx-1" />;
}

const buttonClassName = tv({
	base: "rounded-md p-2 cursor-pointer hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed",
	variants: {
		active: {
			true: "bg-gray-300",
		},
	},
});

export function ToolbarPlugin({
	onSave,
	onCancel,
	isPending,
}: {
	onSave?: () => void;
	onCancel?: () => void;
	isPending: boolean;
}) {
	const [editor] = useLexicalComposerContext();
	const toolbarRef = useRef(null);
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);
	const [isLink, setIsLink] = useState(false);
	const [currentLinkUrl, setCurrentLinkUrl] = useState<string | null>(null);
	const [isBulletList, setIsBulletList] = useState(false);
	const [isNumberedList, setIsNumberedList] = useState(false);

	const $updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			// Update text format
			setIsBold(selection.hasFormat("bold"));
			setIsItalic(selection.hasFormat("italic"));
			setIsUnderline(selection.hasFormat("underline"));
			setIsStrikethrough(selection.hasFormat("strikethrough"));

			// Update link state
			const node = selection.getNodes()[0];
			const parent = node.getParent();
			if ($isLinkNode(parent) || $isLinkNode(node)) {
				setIsLink(true);
				// Extract the URL from the link node
				const linkNode = $isLinkNode(parent) ? parent : node;
				setCurrentLinkUrl(linkNode.getURL());
			} else {
				setIsLink(false);
				setCurrentLinkUrl(null);
			}

			// Update list state
			const anchorNode = selection.anchor.getNode();
			const focusNode = selection.focus.getNode();
			let currentListNode = null;

			// Check if selection is within a list
			let element = anchorNode.getParent();
			while (element !== null) {
				if ($isListNode(element)) {
					currentListNode = element;
					break;
				}
				element = element.getParent();
			}

			if (!currentListNode) {
				element = focusNode.getParent();
				while (element !== null) {
					if ($isListNode(element)) {
						currentListNode = element;
						break;
					}
					element = element.getParent();
				}
			}

			if (currentListNode) {
				const listType = currentListNode.getListType();
				setIsBulletList(listType === "bullet");
				setIsNumberedList(listType === "number");
			} else {
				setIsBulletList(false);
				setIsNumberedList(false);
			}
		}
	}, []);

	useEffect(() => {
		return mergeRegister(
			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						$updateToolbar();
					},
					{ editor },
				);
			}),
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(_payload, _newEditor) => {
					$updateToolbar();
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload) => {
					setCanUndo(payload);
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload) => {
					setCanRedo(payload);
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}, [editor, $updateToolbar]);

	const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

	const insertLink = useCallback(() => {
		setIsLinkModalOpen(true);
	}, []);

	const handleInsertLink = useCallback(
		(url: string) => {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
		},
		[editor],
	);

	return (
		<div
			className="flex flex-row mb-px p-1 justify-between border-b border-gray-300"
			ref={toolbarRef}
		>
			<div className="flex flex-row items-center">
				<Button
					isDisabled={!canUndo}
					onPress={() => {
						editor.dispatchCommand(UNDO_COMMAND, undefined);
					}}
					className={buttonClassName()}
					aria-label="Undo"
				>
					<UndoIcon size={16} />
				</Button>
				<Button
					isDisabled={!canRedo}
					onPress={() => {
						editor.dispatchCommand(REDO_COMMAND, undefined);
					}}
					className={buttonClassName()}
					aria-label="Redo"
				>
					<RedoIcon size={16} />
				</Button>
				<Divider />
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
					}}
					className={buttonClassName({ active: isBold })}
					aria-label="Format Bold"
				>
					<BoldIcon size={16} />
				</Button>
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
					}}
					className={buttonClassName({ active: isItalic })}
					aria-label="Format Italics"
				>
					<ItalicIcon size={16} />
				</Button>
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
					}}
					className={buttonClassName({ active: isUnderline })}
					aria-label="Format Underline"
				>
					<UnderlineIcon size={16} />
				</Button>
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
					}}
					className={buttonClassName({ active: isStrikethrough })}
					aria-label="Format Strikethrough"
				>
					<StrikethroughIcon size={16} />
				</Button>
				<Divider />
				<Button
					onPress={insertLink}
					className={buttonClassName({ active: isLink })}
					aria-label="Insert Link"
				>
					<LinkIcon size={16} />
				</Button>
				<Divider />
				<Button
					onPress={() => {
						if (isBulletList) {
							editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
						} else {
							editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
						}
					}}
					className={buttonClassName({ active: isBulletList })}
					aria-label="Bullet List"
				>
					<ListIcon size={16} />
				</Button>
				<Button
					onPress={() => {
						if (isNumberedList) {
							editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
						} else {
							editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
						}
					}}
					className={buttonClassName({ active: isNumberedList })}
					aria-label="Numbered List"
				>
					<ListOrderedIcon size={16} />
				</Button>
				<Divider />
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
					}}
					className={buttonClassName()}
					aria-label="Left Align"
				>
					<TextAlignStartIcon size={16} />
				</Button>
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
					}}
					className={buttonClassName()}
					aria-label="Center Align"
				>
					<TextAlignCenterIcon size={16} />
				</Button>
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
					}}
					className={buttonClassName()}
					aria-label="Right Align"
				>
					<TextAlignEndIcon size={16} />
				</Button>
				<Button
					onPress={() => {
						editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
					}}
					className={buttonClassName()}
					aria-label="Justify Align"
				>
					<TextAlignJustifyIcon size={16} />
				</Button>
				<Divider />
				<TableSizePicker
					onSelect={(rows, columns) => {
						editor.dispatchCommand(INSERT_TABLE_COMMAND, {
							columns: String(columns),
							rows: String(rows),
							includeHeaders: {
								rows: true,
								columns: false,
							} as InsertTableCommandPayloadHeaders,
						});
					}}
				/>
			</div>
			<div className="flex flex-row space-x-2">
				{onSave && (
					<BaseButton
						onPress={onSave}
						className={buttonClassName()}
						color="primary"
						aria-label="Save changes"
						isDisabled={isPending}
					>
						{isPending && (
							<LoaderCircleIcon size={12} className="animate-spin" />
						)}
						Save
					</BaseButton>
				)}
				{onCancel && (
					<BaseButton
						onPress={onCancel}
						className={buttonClassName()}
						aria-label="Cancel"
						isDisabled={isPending}
					>
						Cancel
					</BaseButton>
				)}
			</div>
			<LinkModal
				onInsertLink={handleInsertLink}
				isOpen={isLinkModalOpen}
				onOpenChange={setIsLinkModalOpen}
				currentUrl={currentLinkUrl}
			/>
		</div>
	);
}
