import { EditIcon } from "lucide-react"
import { DialogTrigger } from "react-aria-components"

import { Button } from "../button"
import { Modal, ModalHeading } from "../modal"

import "@uppy/core/css/style.min.css"
import "@uppy/dashboard/css/style.min.css"
import { Uploader, type UploaderProps } from "./uploader"

export type UploadImageModalProps = Pick<
  UploaderProps,
  "bucket" | "prefix" | "onUploadSuccess"
>

export function UploadImageModal(props: UploadImageModalProps) {
  return (
    <DialogTrigger>
      <Button
        variant="icon"
        className="absolute top-3 right-3"
        tooltip="Edit Image"
      >
        <EditIcon />
      </Button>
      <Modal>
        <div className="p-3 flex flex-col space-y-8">
          <ModalHeading>Upload Image</ModalHeading>

          <Uploader {...props} />
        </div>
      </Modal>
    </DialogTrigger>
  )
}
