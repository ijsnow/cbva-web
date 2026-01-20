import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from "lucide-react";
import {
	DropIndicator,
	type Key,
	Text,
	useDragAndDrop,
} from "react-aria-components";
import { useListData } from "react-stately";
import { ListBox, ListBoxItem } from "./list-box";
import type { Option } from "./select";
import { Button } from "./button";
import { useCallback, useEffect } from "react";
import { isEqual } from "lodash-es";

type ListBoxProps<V extends Key> = {
	items: Option<V>[];
	onChange: (keys: V[]) => void;
};

export function OrderingList<V extends Key>(props: ListBoxProps<V>) {
	const { items: defaultItems, onChange } = props;

	const list = useListData({
		initialItems: defaultItems,
		getKey: (item) => item.value,
	});

	useEffect(() => {
		const ordered = list.items.map(({ value }) => value);

		if (!isEqual(defaultItems, ordered)) {
			onChange(ordered);
		}
	}, [list, defaultItems, onChange]);

	const isFirst = (value: V) => list.items[0].value === value;
	const isLast = (value: V) =>
		list.items[list.items.length - 1].value === value;

	const moveUp = useCallback(
		(key: Key) => {
			const index = list.items.findIndex((item) => item.value === key);

			if (index > 0) {
				const previousKey = list.items[index - 1].value;
				list.moveBefore(previousKey, new Set([key]));
			}
		},
		[list],
	);

	const moveDown = useCallback(
		(key: Key) => {
			const index = list.items.findIndex((item) => item.value === key);
			if (index < list.items.length - 1) {
				const nextKey = list.items[index + 1].value;
				list.moveAfter(nextKey, new Set([key]));
			}
		},
		[list],
	);

	const { dragAndDropHooks } = useDragAndDrop<Option<V>>({
		getItems(keys, items) {
			return items.map((item) => {
				return {
					"text/plain": `${item.display}`,
					"text/html": `<strong>${item.display}</strong>`,
					item: JSON.stringify(item),
				};
			});
		},
		renderDropIndicator(target) {
			return (
				<DropIndicator
					target={target}
					className={({ isDropTarget }) =>
						`h-0.5 mx-1 rounded-full ${isDropTarget ? "bg-blue-500" : "bg-transparent"}`
					}
				/>
			);
		},
		onReorder(e) {
			if (e.target.dropPosition === "before") {
				list.moveBefore(e.target.key, e.keys);
			} else if (e.target.dropPosition === "after") {
				list.moveAfter(e.target.key, e.keys);
			}
		},
	});

	return (
		<ListBox
			aria-label="Ordering list"
			selectionMode="multiple"
			items={list.items}
			renderEmptyState={() => "Drop items here"}
			dragAndDropHooks={dragAndDropHooks}
			dependencies={[list]}
		>
			{(item) => (
				<ListBoxItem id={item.value} textValue={item.display}>
					<span className="flex flex-row gap-2">
						<span>
							<GripVerticalIcon />
						</span>
						<Text slot="label">{item.display}</Text>
					</span>
					<span className="flex flex-row gap-2">
						<Button
							variant="icon"
							size="sm"
							onPress={() => moveUp(item.value)}
							isDisabled={isFirst(item.value)}
						>
							<ArrowUpIcon />
						</Button>
						<Button
							variant="icon"
							size="sm"
							onPress={() => moveDown(item.value)}
							isDisabled={isLast(item.value)}
						>
							<ArrowDownIcon />
						</Button>
					</span>
				</ListBoxItem>
			)}
		</ListBox>
	);
}
