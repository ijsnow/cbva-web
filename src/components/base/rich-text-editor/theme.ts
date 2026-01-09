import type { EditorThemeClasses } from "lexical"

const theme: EditorThemeClasses = {
  code: "bg-slate-100 font-mono block py-2 px-2 pl-[52px] leading-6 text-[13px] m-0 mt-2 mb-2 [tab-size:2] overflow-x-auto relative before:content-[attr(data-gutter)] before:absolute before:bg-gray-100 before:left-0 before:top-0 before:border-r before:border-gray-300 before:py-2 before:px-2 before:text-gray-600 before:whitespace-pre-wrap before:text-right before:min-w-[25px] after:content-[attr(data-highlight-language)] after:top-0 after:right-1 after:py-1 after:px-1 after:text-[10px] after:uppercase after:absolute after:text-black/50",
  heading: {
    h1: "text-2xl text-gray-900 font-normal m-0 mb-3 p-0",
    h2: "text-[15px] text-gray-500 font-bold m-0 mt-3 p-0 uppercase",
    h3: "text-lg text-gray-700 font-semibold m-0 mt-2 p-0",
    h4: "text-base text-gray-700 font-medium m-0 mt-2 p-0",
    h5: "text-sm text-gray-600 font-medium m-0 mt-1 p-0",
  },
  image: "max-w-full h-auto",
  link: "text-blue-600 no-underline hover:underline",
  list: {
    // listitem: "my-2 mx-8",
    // nested: {
    //   listitem: "list-none",
    // },
    ol: "list-decimal ml-4",
    ul: "list-disc ml-4",
  },
  paragraph: "m-0 mb-4 relative last-of-type:mb-0",
  placeholder:
    "text-gray-500 overflow-hidden absolute text-ellipsis top-5 left-3 text-[15px] select-none inline-block pointer-events-none",
  quote: "m-0 ml-5 text-[15px] text-gray-500 border-l-4 border-gray-300 pl-4",
  table:
    "w-full border-separate border-spacing-0 overflow-hidden rounded-xl text-sm text-left border border-gray-300 mb-6",
  tableCell: "px-6 py-3 border-gray-300 border-r last-of-type:border-r-0",
  tableCellHeader:
    "px-6 py-3 font-semibold border-gray-300 border-r last-of-type:border-r-0 bg-navbar-background text-navbar-foreground",
  tableRow:
    "even:bg-transparent odd:bg-content-background-alt border-b border-gray-300 last-of-type:border-b-0 first-of-type:rounded-t-xl last-of-type:rounded-b-xl overflow-hidden",
  text: {
    bold: "font-bold",
    capitalize: "capitalize",
    code: "bg-slate-100 py-px px-1 font-mono text-[94%]",
    highlight:
      "bg-[rgba(255,212,0,0.14)] border-solid border-b-[2px] border-[rgba(255,212,0,0.3)]",
    italic: "italic",
    lowercase: "lowercase",
    strikethrough: "line-through",
    subscript: "text-[0.8em] !align-sub",
    superscript: "text-[0.8em] align-super",
    underline: "underline",
    underlineStrikethrough: "[text-decoration:underline_line-through]",
    uppercase: "uppercase",
  },
}

export default theme
