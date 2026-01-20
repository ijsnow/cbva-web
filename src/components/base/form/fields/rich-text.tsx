import clsx from "clsx";
import type { SerializedEditorState } from "lexical";
import { RichTextEditor } from "@/components/base/rich-text-editor/editor";
import { useIsMounted } from "@/lib/dom";
import type { FieldProps } from "./shared";
import { Description, Errors, Label } from "./shared";

export type RichTextFieldProps = FieldProps & {
	className?: string;
	isRequired?: boolean;
};

export function RichTextField({
	className,
	label,
	description,
	placeholder,
	field,
	isRequired,
}: RichTextFieldProps) {
	const isMounted = useIsMounted();

	const value = field.state.value as SerializedEditorState | undefined;

	const handleChange = (state: SerializedEditorState) => {
		console.log("change");

		field.handleChange(state);
	};

	return (
		<div className={clsx("flex flex-col gap-1", className)}>
			{label && <Label isRequired={isRequired}>{label}</Label>}

			{isMounted && (
				<RichTextEditor
					name={field.name}
					initialValue={value}
					onChange={(editorState) => {
						handleChange(editorState.toJSON());
					}}
					placeholder={placeholder}
				/>
			)}

			{description && <Description>{description}</Description>}
			<Errors field={field} />
		</div>
	);
}
