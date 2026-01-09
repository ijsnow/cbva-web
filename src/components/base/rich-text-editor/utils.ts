import { $generateHtmlFromNodes } from "@lexical/html"
import type { EditorState, LexicalEditor } from "lexical"

/**
 * Convert EditorState to HTML string for database storage
 */
export function editorStateToHtml(
  editorState: EditorState,
  editor: LexicalEditor
): string {
  return editorState.read(() => {
    return $generateHtmlFromNodes(editor, null)
  })
}

/**
 * Helper function to create an onChange handler that converts to HTML
 */
export function createHtmlOnChangeHandler(
  onHtmlChange: (html: string) => void
) {
  return (editorState: EditorState, editor: LexicalEditor) => {
    const html = editorStateToHtml(editorState, editor)
    onHtmlChange(html)
  }
}

/**
 * Debounced version for auto-save functionality
 */
export function createDebouncedHtmlOnChangeHandler(
  onHtmlChange: (html: string) => void,
  delay = 500
) {
  let timeoutId: NodeJS.Timeout

  return (editorState: EditorState, editor: LexicalEditor) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      const html = editorStateToHtml(editorState, editor)
      onHtmlChange(html)
    }, delay)
  }
}
