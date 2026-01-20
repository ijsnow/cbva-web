import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { JSDOM } from "jsdom";
import type { SerializedEditorState } from "lexical";
import { Suspense } from "react";
import type { LexicalState } from "@/db/schema/shared";
import { EDITOR_CONFIG_DEFAULTS } from "./config";
import { RichTextEditorModal } from "./modal";

export type RichTextDisplayProps = {
	name: string;
	content?: LexicalState | null;
	onSave?: (state: LexicalState) => Promise<void>;
};

function setupDom() {
	const dom = new JSDOM();

	const _window = global.window;
	const _document = global.document;

	// @ts-expect-error
	global.window = dom.window;
	global.document = dom.window.document;

	return () => {
		global.window = _window;
		global.document = _document;
	};
}

const generateHtml = createIsomorphicFn()
	// const generateHtml = createServerFn()
	// .inputValidator(({ name, state }: { name: string; state: string }) => ({
	//   name,
	//   state,
	// }))
	// .handler(async ({ data: { name, state } }) => {
	.server(async (name: string, state: string) => {
		return await new Promise<string>((resolve) => {
			const editor = createHeadlessEditor({
				...EDITOR_CONFIG_DEFAULTS,
				namespace: name,
				onError(error: Error) {
					throw error;
				},
			});

			editor.setEditorState(editor.parseEditorState(state));

			editor.update(() => {
				try {
					const cleanup = setupDom();
					const _html = $generateHtmlFromNodes(editor, null);
					cleanup();

					resolve(_html);
				} catch (e) {
					console.log(e);
				}
			});
		});
	})
	.client(async (name: string, state: string) => {
		return await new Promise<string>((resolve) => {
			const editor = createHeadlessEditor({
				...EDITOR_CONFIG_DEFAULTS,
				namespace: name,
				onError(error: Error) {
					throw error;
				},
			});

			editor.setEditorState(editor.parseEditorState(state));

			editor.update(() => {
				try {
					const _html = $generateHtmlFromNodes(editor, null);

					resolve(_html);
				} catch (e) {
					console.log(e);
				}
			});
		});
	});

export function RichTextDisplay({
	name,
	content,
	onSave,
}: RichTextDisplayProps) {
	const state = JSON.stringify(content);

	const { data: html } = useSuspenseQuery({
		queryKey: [state],
		queryFn: () => generateHtml(name, state),
	});

	return (
		<Suspense>
			<div className="flex-1 relative group/edit">
				<div dangerouslySetInnerHTML={{ __html: html }} />

				{onSave && (
					<RichTextEditorModal
						triggerClassName="absolute top-0 right-0 invisible -translate-y-full group-hover/edit:visible"
						name={name}
						title="Update Page Content"
						initialValue={content as SerializedEditorState | undefined}
						onSave={async (state) => {
							await onSave(state as LexicalState);
						}}
					/>
				)}
			</div>
		</Suspense>
	);
}
