import { ArrowUp } from "lucide-react"
import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableHeader as AriaTableHeader,
  Button,
  type CellProps,
  Checkbox,
  Collection,
  type ColumnProps,
  ColumnResizer,
  Group,
  ResizableTableContainer,
  type RowProps,
  type TableHeaderProps,
  type TableProps,
  composeRenderProps,
  useTableOptions,
} from "react-aria-components"
import { tv, VariantProps } from "tailwind-variants"

import { composeTailwindRenderProps, focusRing } from "./utils"

export { TableBody } from "react-aria-components"

// max-h-[280px] scroll-pt-[2.281rem]

export function Table(props: TableProps) {
  return (
    <ResizableTableContainer className="w-full overflow-auto relative border bg-white rounded-lg">
      <AriaTable
        {...props}
        className="border-collapse w-full min-w-full bg-white"
      />
    </ResizableTableContainer>
  )
}

const columnStyles = tv({
  extend: focusRing,
  base: "px-2 h-5 flex-1 flex gap-1 items-center",
  variants: {
    overflow: {
      hidden: "overflow-hidden",
      visible: "overflow-visible",
    },
  },
  defaultVariants: {
    overflow: "hidden",
  },
})

const resizerStyles = tv({
  extend: focusRing,
  base: "w-px px-[8px] box-content py-1 h-5 bg-clip-content bg-gray-400 forced-colors:bg-[ButtonBorder] cursor-col-resize rounded-xs resizing:bg-blue-600 forced-colors:resizing:bg-[Highlight] resizing:w-[2px] resizing:pl-[7px] -outline-offset-2",
})

export function TableColumn(
  props: ColumnProps & VariantProps<typeof columnStyles>
) {
  return (
    <AriaColumn
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "[&:hover]:z-20 focus-within:z-20 text-start text-sm font-semibold text-gray-700 dark:text-zinc-300 cursor-default"
      )}
    >
      {composeRenderProps(
        props.children,
        (children, { allowsSorting, sortDirection }) => (
          <div className="flex items-center">
            <Group
              role="presentation"
              tabIndex={-1}
              className={columnStyles({ overflow: props.overflow })}
            >
              <span className="truncate">{children}</span>
              {allowsSorting && (
                <span
                  className={`w-4 h-4 flex items-center justify-center transition ${
                    sortDirection === "descending" ? "rotate-180" : ""
                  }`}
                >
                  {sortDirection && (
                    <ArrowUp
                      aria-hidden
                      className="w-4 h-4 text-gray-500 dark:text-zinc-400 forced-colors:text-[ButtonText]"
                    />
                  )}
                </span>
              )}
            </Group>
            {!props.width && <ColumnResizer className={resizerStyles} />}
          </div>
        )
      )}
    </AriaColumn>
  )
}

export function TableHeader<T extends object>(props: TableHeaderProps<T>) {
  let { selectionBehavior, selectionMode, allowsDragging } = useTableOptions()

  return (
    <AriaTableHeader
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "sticky top-0 z-10 bg-navbar-background supports-[-moz-appearance:none]:bg-navbar-background forced-colors:bg-[Canvas] border-b border-b-gray-200"
      )}
    >
      {/* Add extra columns for drag and drop and selection. */}
      {allowsDragging && <TableColumn />}
      {selectionBehavior === "toggle" && (
        <AriaColumn
          width={36}
          minWidth={36}
          className="text-start text-sm font-semibold cursor-default p-2"
        >
          {selectionMode === "multiple" && <Checkbox slot="selection" />}
        </AriaColumn>
      )}
      <Collection items={props.columns}>{props.children}</Collection>
    </AriaTableHeader>
  )
}

const rowStyles = tv({
  extend: focusRing,
  base: "group/row relative cursor-default select-none -outline-offset-2 text-gray-900 disabled:text-gray-300 text-sm hover:bg-gray-100 selected:bg-blue-100 selected:hover:bg-blue-200",
})

export function TableRow<T extends object>({
  id,
  columns,
  children,
  ...otherProps
}: RowProps<T>) {
  let { selectionBehavior, allowsDragging } = useTableOptions()

  return (
    <AriaRow id={id} {...otherProps} className={rowStyles}>
      {allowsDragging && (
        <TableCell>
          <Button slot="drag">≡</Button>
        </TableCell>
      )}
      {selectionBehavior === "toggle" && (
        <TableCell>
          <Checkbox slot="selection" />
        </TableCell>
      )}
      <Collection items={columns}>{children}</Collection>
    </AriaRow>
  )
}

const cellStyles = tv({
  extend: focusRing,
  base: "border-b border-b-gray-200 dark:border-b-zinc-700 group-last/row:border-b-0 [--selected-border:var(--color-blue-200)] dark:[--selected-border:var(--color-blue-900)] group-selected/row:border-(--selected-border) in-[:has(+[data-selected])]:border-(--selected-border) p-2 truncate -outline-offset-2",
})

export function TableCell(props: CellProps) {
  return (
    <AriaCell
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        cellStyles({ ...renderProps, className })
      )}
    />
  )
}
