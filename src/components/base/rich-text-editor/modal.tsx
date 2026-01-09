import { EditIcon } from "lucide-react"
import { type ReactNode, useState } from "react"
import { DialogTrigger, Heading } from "react-aria-components"

import { Button } from "../button"
import { Modal } from "../modal"
import { title as titleStyles } from "../primitives"
import { RichTextEditor, type RichTextEditorProps } from "./editor"

export type RichTextEditorModalProps = Omit<RichTextEditorProps, "onClose"> & {
  triggerClassName?: string
  title: ReactNode
}

export function RichTextEditorModal({
  title,
  triggerClassName,
  ...props
}: RichTextEditorModalProps) {
  const [isOpen, setOpen] = useState(false)

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button className={triggerClassName} color="alternate" size="sm">
        <EditIcon className="text-blue-500" size={14} />
        Edit
      </Button>

      <Modal size="2xl" isDismissable isOpen={isOpen} onOpenChange={setOpen}>
        <div className="p-3 flex flex-col space-y-4 relative">
          <Heading className={titleStyles({ size: "sm" })} slot="title">
            {title}
          </Heading>
          <RichTextEditor {...props} onClose={() => setOpen(false)} />
        </div>
      </Modal>
    </DialogTrigger>
  )
}
