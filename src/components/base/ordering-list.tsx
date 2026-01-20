import { GripVerticalIcon } from "lucide-react";
import {
	type DragAndDropHooks,
	type Key,
	Text,
	useDragAndDrop,
} from "react-aria-components";
import { ListBox, ListBoxItem } from "./list-box1";
import type { Option } from "./select";

interface ListBoxProps<V extends Key> {
	items?: Option<V>[];
	dragAndDropHooks?: DragAndDropHooks<Option<V>>;
}

export function OrderingList<V extends Key>(props: ListBoxProps<V>) {
	const { items } = props;

	const { dragAndDropHooks } = useDragAndDrop<Option<V>>({
		renderDragPreview(items) {
			return (
				<div className="drag-preview">
					{items[0]["text/plain"]}
					<span className="badge">{items.length}</span>
				</div>
			);
		},
		getItems(keys, items) {
			return items.map((item) => {
				return {
					"text/plain": `${item.display}`,
					"text/html": `<strong>${item.display}</strong>`,
					item: JSON.stringify(item),
				};
			});
		},
	});

	return (
		<ListBox
			aria-label="Pokemon list"
			selectionMode="multiple"
			items={items}
			renderEmptyState={() => "Drop items here"}
			dragAndDropHooks={dragAndDropHooks}
		>
			{(item) => (
				<ListBoxItem id={item.value} textValue={item.display}>
					<span>
						<GripVerticalIcon />
					</span>
					<Text slot="label">{item.display}</Text>
				</ListBoxItem>
			)}
		</ListBox>
	);
}
