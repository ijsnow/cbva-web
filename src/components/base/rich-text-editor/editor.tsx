/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LinkNode } from "@lexical/link";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {
	type InitialConfigType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import {
	$isTextNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type DOMExportOutputMap,
	type EditorState,
	isHTMLElement,
	type Klass,
	type LexicalEditor,
	type LexicalNode,
	ParagraphNode,
	type SerializedEditorState,
	TextNode,
} from "lexical";
import { useEffect, useRef, useState } from "react";
import { EDITOR_CONFIG_DEFAULTS } from "./config";
import { TableActionMenuPlugin } from "./plugins/table-action-menu";
import { ToolbarPlugin } from "./plugins/toolbar";
import { parseAllowedColor, parseAllowedFontSize } from "./style-config";
import Theme from "./theme";
import { twMerge } from "tailwind-merge";

const placeholder = "Enter some rich text...";

export type RichTextEditorProps = {
	name: string;
	initialValue?: string | SerializedEditorState;
	onChange?: (editorState: EditorState, editor: LexicalEditor) => void;
	onSave?: (state: SerializedEditorState) => Promise<void>;
	onClose?: () => void;
	placeholder?: string;
	height?: "md" | "sm" | "xs";
};

export function RichTextEditor({
	name,
	initialValue,
	onChange,
	onSave,
	onClose,
	placeholder: customPlaceholder = placeholder,
	height = "md",
}: RichTextEditorProps) {
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (editorContainerRef.current) {
			setAnchorElem(editorContainerRef.current);
		}
	}, []);

	const editorConfig: InitialConfigType = {
		...EDITOR_CONFIG_DEFAULTS,
		namespace: name,
		onError(error: Error) {
			throw error;
		},
		editorState: initialValue
			? (editor) => editor.setEditorState(editor.parseEditorState(initialValue))
			: undefined,
	};

	const [editorState, setEditorState] = useState<EditorState>();

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (editorState && onSave) {
				return await onSave(editorState.toJSON());
			}
		},
		onSuccess: () => {
			if (onClose) {
				onClose();
			}
		},
	});

	return (
		<div
			className={clsx(
				"m-0 font-medium antialiased max-w-full w-full border border-gray-500 rounded-lg",
			)}
		>
			<LexicalComposer initialConfig={editorConfig}>
				<div className="w-full max-w-content text-black relative leading-5 font-normal text-left">
					<ToolbarPlugin
						isPending={isPending}
						onSave={
							onSave
								? () => {
										mutate();
									}
								: undefined
						}
						onCancel={onClose}
					/>
					<div className="relative" ref={editorContainerRef}>
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									contentEditable={true}
									className={twMerge(
										"editor-input resize-none text-md caret-black relative outline-0 py-5 px-3",
										height === "md" && "min-h-96",
										height === "sm" && "min-h-64",
										height === "xs" && "min-h-32",
									)}
									aria-placeholder={customPlaceholder}
									placeholder={
										<div className="text-placeholder overflow-hidden text-ellipsis absolute top-5 left-3 text-md select-none inline-block pointer-events-none">
											{customPlaceholder}
										</div>
									}
								/>
							}
							ErrorBoundary={LexicalErrorBoundary}
						/>
						<HistoryPlugin />
						<AutoFocusPlugin />
						<LinkPlugin />
						<ListPlugin />
						<TablePlugin hasCellMerge={true} hasCellBackgroundColor={true} />
						{anchorElem && <TableActionMenuPlugin anchorElem={anchorElem} />}
						<OnChangePlugin
							onChange={(state, editor) => {
								setEditorState(state);
								onChange?.(state, editor);
							}}
						/>
					</div>
				</div>
			</LexicalComposer>
		</div>
	);
}
