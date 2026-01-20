import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TreeView } from "@lexical/react/LexicalTreeView";
import type { JSX } from "react";

export function TreeViewPlugin(): JSX.Element {
	const [editor] = useLexicalComposerContext();

	return (
		<TreeView
			viewClassName="block bg-gray-800 text-white p-1 text-xs lap my-px mx-auto mb-3 max-h-64 relative overflow-x-scroll max-w-full leading-3"
			treeTypeButtonClassName="border-0 p-0 text-xs absolute top-3 right-4 bg-transparent text-white hover:underline"
			timeTravelPanelClassName="overflow-hidden pb-0 pt-3 m-auto flex"
			timeTravelButtonClassName="border-0 p-0 text-xs absolute top-3 right-4 bg-transparent text-white hover:underline"
			timeTravelPanelSliderClassName="p-0 flex-[8]"
			timeTravelPanelButtonClassName="p-0 border-0 bg-transparent flex-1 text-white text-xs hover:underline"
			editor={editor}
		/>
	);
}
