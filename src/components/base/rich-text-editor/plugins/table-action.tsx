import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableColumnAtSelection,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableRowAtSelection,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableColumnAtSelection,
  $insertTableRow__EXPERIMENTAL,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableRowNode,
  $unmergeCell,
  getTableObserverFromTableElement,
  HTMLTableElementWithWithTableSelectionState,
  TableCellHeaderStates,
  TableCellNode,
} from "@lexical/table"
import { $getSelection, $isRangeSelection } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

function computeSelectionCount(selection: {
  columns: Set<number>
  rows: Set<number>
}): {
  columns: number
  rows: number
} {
  return {
    columns: selection.columns.size,
    rows: selection.rows.size,
  }
}

export function TableActionMenuPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}) {
  const [editor] = useLexicalComposerContext()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRootRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(
    null
  )

  const moveMenu = useCallback(() => {
    const menu = menuButtonRef.current
    const selection = window.getSelection()
    const nativeSelection = window.getSelection()
    const activeElement = document.activeElement

    if (selection == null || menu == null) {
      setTableMenuCellNode(null)
      return
    }

    const rootElement = editor.getRootElement()

    if (
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      editor.getEditorState().read(() => {
        const selection = $getSelection()

        if ($isRangeSelection(selection)) {
          const node = selection.anchor.getNode()
          const tableCellNode = $getTableCellNodeFromLexicalNode(node)

          if (tableCellNode) {
            const tableCellElement = editor.getElementByKey(
              tableCellNode.getKey()
            )

            if (tableCellElement) {
              const tableCellRect = tableCellElement.getBoundingClientRect()
              const menuRect = menu.getBoundingClientRect()
              const anchorRect = anchorElem.getBoundingClientRect()

              menu.style.opacity = "1"
              menu.style.left = `${
                tableCellRect.right - menuRect.width - 10 - anchorRect.left
              }px`

              menu.style.top = `${tableCellRect.top + 4 - anchorRect.top}px`

              setTableMenuCellNode(tableCellNode)
            }
          } else {
            setTableMenuCellNode(null)
          }
        }
      })
    }
  }, [editor, anchorElem])

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        moveMenu()
      })
    })
  })

  useEffect(() => {
    const menuButtonDOM = menuButtonRef.current

    if (menuButtonDOM != null && tableCellNode != null) {
      const rootElement = editor.getRootElement()

      if (rootElement != null) {
        rootElement.addEventListener("click", moveMenu)

        return () => {
          rootElement.removeEventListener("click", moveMenu)
        }
      }
    }
  }, [menuButtonRef, tableCellNode, editor, moveMenu])

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode !== null) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const tableElement = editor.getElementByKey(
          tableNode.getKey()
        ) as HTMLTableElementWithWithTableSelectionState

        if (tableElement != null) {
          const tableSelection = getTableObserverFromTableElement(tableElement)
          if (tableSelection !== null) {
            tableSelection.$clearHighlight()
          }
        }
      }
    })
  }, [editor, tableCellNode])

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        if (tableCellNode) {
          $insertTableRowAtSelection(shouldInsertAfter)
          clearTableSelection()
        }
      })
    },
    [editor, tableCellNode, clearTableSelection]
  )

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        if (tableCellNode) {
          $insertTableColumnAtSelection(shouldInsertAfter)
          clearTableSelection()
        }
      })
    },
    [editor, tableCellNode, clearTableSelection]
  )

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode) {
        $deleteTableRowAtSelection()
      }
    })
  }, [editor, tableCellNode])

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode) {
        $deleteTableColumnAtSelection()
      }
    })
  }, [editor, tableCellNode])

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

        const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode)

        const tableRows = tableNode.getChildren()

        if (tableRowIndex >= 0 && tableRowIndex < tableRows.length) {
          const tableRow = tableRows[tableRowIndex]

          if ($isTableRowNode(tableRow)) {
            tableRow.getChildren().forEach((tableCell) => {
              if ($isTableCellNode(tableCell)) {
                tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW)
              }
            })
          }
        }

        clearTableSelection()
      }
    })
  }, [editor, tableCellNode, clearTableSelection])

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

        const tableColumnIndex =
          $getTableColumnIndexFromTableCellNode(tableCellNode)

        const tableRows = tableNode.getChildren()

        for (let r = 0; r < tableRows.length; r++) {
          const tableRow = tableRows[r]

          if ($isTableRowNode(tableRow)) {
            const tableCells = tableRow.getChildren()

            if (tableColumnIndex >= 0 && tableColumnIndex < tableCells.length) {
              const tableCell = tableCells[tableColumnIndex]

              if ($isTableCellNode(tableCell)) {
                tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN)
              }
            }
          }
        }

        clearTableSelection()
      }
    })
  }, [editor, tableCellNode, clearTableSelection])

  return createPortal(
    <div ref={menuRootRef} className="table-action-menu-container">
      {tableCellNode != null && (
        <>
          <button
            className="table-action-button"
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation()
              setIsMenuOpen(!isMenuOpen)
            }}
          >
            <span className="chevron-down" />
          </button>
          {isMenuOpen && (
            <div className="table-action-menu">
              <button
                className="menu-item"
                onClick={() => {
                  insertTableRowAtSelection(false)
                  setIsMenuOpen(false)
                }}
              >
                Insert row above
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  insertTableRowAtSelection(true)
                  setIsMenuOpen(false)
                }}
              >
                Insert row below
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  insertTableColumnAtSelection(false)
                  setIsMenuOpen(false)
                }}
              >
                Insert column left
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  insertTableColumnAtSelection(true)
                  setIsMenuOpen(false)
                }}
              >
                Insert column right
              </button>
              <hr />
              <button
                className="menu-item"
                onClick={() => {
                  deleteTableRowAtSelection()
                  setIsMenuOpen(false)
                }}
              >
                Delete row
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  deleteTableColumnAtSelection()
                  setIsMenuOpen(false)
                }}
              >
                Delete column
              </button>
              <hr />
              <button
                className="menu-item"
                onClick={() => {
                  toggleTableRowIsHeader()
                  setIsMenuOpen(false)
                }}
              >
                Toggle row header
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  toggleTableColumnIsHeader()
                  setIsMenuOpen(false)
                }}
              >
                Toggle column header
              </button>
            </div>
          )}
        </>
      )}
    </div>,
    anchorElem
  )
}
