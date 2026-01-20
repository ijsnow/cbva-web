import { GripVerticalIcon } from "lucide-react";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "./table";
import { DragAndDropHooks, Key } from "react-aria-components";
import { Option } from "./select";

type OrderingTableProps<V extends Key> = {
	items?: Option<V>[];
	dragAndDropHooks?: DragAndDropHooks<V>;
};

export function OrderingTable<V extends Key>(props: OrderingTableProps<V>) {
	const { items, dragAndDropHooks } = props;

	return (
		<Table
			aria-label="Ordering table"
			selectionMode="multiple"
			dragAndDropHooks={dragAndDropHooks}
		>
			<TableHeader>
				<TableColumn width={48} minWidth={48} />
				<TableColumn isRowHeader width="1fr">
					Name
				</TableColumn>
			</TableHeader>
			<TableBody items={items}>
				{(item) => (
					<TableRow id={item.value}>
						<TableCell>
							<GripVerticalIcon />
						</TableCell>
						<TableCell>{item.value}</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
