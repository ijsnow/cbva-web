import { $createLinkNode, LinkNode } from "@lexical/link";
import {
	$createListItemNode,
	$createListNode,
	ListItemNode,
	ListNode,
} from "@lexical/list";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import {
	$createTableCellNode,
	$createTableNode,
	$createTableRowNode,
	TableCellHeaderStates,
	TableCellNode,
	TableNode,
	TableRowNode,
} from "@lexical/table";
import {
	$isTextNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type DOMExportOutputMap,
	isHTMLElement,
	type Klass,
	type LexicalEditor,
	type LexicalNode,
	ParagraphNode,
	TextNode,
} from "lexical";
import { parseAllowedColor, parseAllowedFontSize } from "./style-config";

import Theme from "./theme";

const removeStylesExportDOM = (
	editor: LexicalEditor,
	target: LexicalNode,
): DOMExportOutput => {
	const output = target.exportDOM(editor);
	if (output && isHTMLElement(output.element)) {
		// Remove table-specific styles but preserve text formatting styles
		// Children are checked as well since TextNode can be nested
		// in i, b, and strong tags.
		for (const el of [
			output.element,
			...output.element.querySelectorAll("[style],[class]"),
		]) {
			// For table-related nodes, remove all styles
			// For other nodes, preserve text formatting styles
			if (
				target instanceof TableNode ||
				target instanceof TableRowNode ||
				target instanceof TableCellNode
			) {
				// Remove all styles from table elements
				el.removeAttribute("style");
			} else {
				// For non-table elements, preserve text formatting styles
				const style = el.getAttribute("style");
				if (style) {
					// Remove table-specific styles but keep text formatting
					const preservedStyles = style
						.split(";")
						.filter((styleRule) => {
							const [property] = styleRule.split(":").map((s) => s.trim());
							// Preserve text formatting properties
							return [
								"font-size",
								"color",
								"background-color",
								"text-align",
								"font-weight",
								"font-style",
								"text-decoration",
								"line-height",
								"letter-spacing",
								"text-transform",
								"vertical-align",
							].includes(property);
						})
						.join(";");

					if (preservedStyles) {
						el.setAttribute("style", preservedStyles);
					} else {
						el.removeAttribute("style");
					}
				}
			}
		}
	}
	return output;
};

const exportMap: DOMExportOutputMap = new Map<
	Klass<LexicalNode>,
	(editor: LexicalEditor, target: LexicalNode) => DOMExportOutput
>([
	[ParagraphNode, removeStylesExportDOM],
	[TextNode, removeStylesExportDOM],
	[LinkNode, removeStylesExportDOM],
	[ListNode, removeStylesExportDOM],
	[ListItemNode, removeStylesExportDOM],
	[TableNode, removeStylesExportDOM],
	[TableRowNode, removeStylesExportDOM],
	[TableCellNode, removeStylesExportDOM],
]);

const getExtraStyles = (element: HTMLElement): string => {
	// Parse styles from pasted input, but only if they match exactly the
	// sort of styles that would be produced by exportDOM
	let extraStyles = "";
	const fontSize = parseAllowedFontSize(element.style.fontSize);
	const backgroundColor = parseAllowedColor(element.style.backgroundColor);
	const color = parseAllowedColor(element.style.color);
	if (fontSize !== "" && fontSize !== "15px") {
		extraStyles += `font-size: ${fontSize};`;
	}
	if (backgroundColor !== "" && backgroundColor !== "rgb(255, 255, 255)") {
		extraStyles += `background-color: ${backgroundColor};`;
	}
	if (color !== "" && color !== "rgb(0, 0, 0)") {
		extraStyles += `color: ${color};`;
	}
	return extraStyles;
};

const constructImportMap = (): DOMConversionMap => {
	const importMap: DOMConversionMap = {
		a: (node: Node) => {
			const element = node as HTMLAnchorElement;
			const url = element.getAttribute("href");
			if (url) {
				return {
					conversion: () => {
						const linkNode = $createLinkNode(url);
						return {
							node: linkNode,
						};
					},
					priority: 1,
				};
			}
			return null;
		},
		ul: (node: Node) => {
			return {
				conversion: () => {
					const listNode = $createListNode("bullet");
					return {
						node: listNode,
					};
				},
				priority: 1,
			};
		},
		ol: (node: Node) => {
			return {
				conversion: () => {
					const listNode = $createListNode("number");
					return {
						node: listNode,
					};
				},
				priority: 1,
			};
		},
		li: (node: Node) => {
			return {
				conversion: () => {
					const listItemNode = $createListItemNode();
					return {
						node: listItemNode,
					};
				},
				priority: 1,
			};
		},
		table: (node: Node) => {
			const element = node as HTMLTableElement;
			return {
				conversion: () => {
					const tableNode = $createTableNode();
					return {
						node: tableNode,
					};
				},
				priority: 1,
			};
		},
		tr: (node: Node) => {
			const element = node as HTMLTableRowElement;
			return {
				conversion: () => {
					const tableRowNode = $createTableRowNode();
					return {
						node: tableRowNode,
					};
				},
				priority: 1,
			};
		},
		td: (node: Node) => {
			const element = node as HTMLTableCellElement;
			return {
				conversion: () => {
					const tableCellNode = $createTableCellNode(
						TableCellHeaderStates.NO_STATUS,
					);
					return {
						node: tableCellNode,
					};
				},
				priority: 1,
			};
		},
		th: (node: Node) => {
			const element = node as HTMLTableCellElement;
			return {
				conversion: () => {
					const tableCellNode = $createTableCellNode(TableCellHeaderStates.ROW);
					return {
						node: tableCellNode,
					};
				},
				priority: 1,
			};
		},
		// Paragraph node conversion
		p: (node: Node) => {
			const element = node as HTMLParagraphElement;
			return {
				conversion: () => {
					const paragraphNode = new ParagraphNode();
					return {
						node: paragraphNode,
					};
				},
				priority: 1,
			};
		},
		// Text node conversion for text content
		"#text": (node: Node) => {
			const textContent = node.textContent?.trim();
			if (textContent) {
				return {
					conversion: () => {
						const textNode = new TextNode(textContent);
						return {
							node: textNode,
						};
					},
					priority: 0,
				};
			}
			return null;
		},
	};

	return importMap;
};

export const EDITOR_CONFIG_DEFAULTS: Pick<
	InitialConfigType,
	"html" | "nodes" | "theme"
> = {
	html: {
		export: exportMap,
		// import: constructImportMap(),
	},
	nodes: [
		ParagraphNode,
		TextNode,
		LinkNode,
		ListNode,
		ListItemNode,
		TableNode,
		TableCellNode,
		TableRowNode,
	],
	theme: Theme,
};
