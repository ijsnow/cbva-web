import Uppy from "@uppy/core";
import ImageEditor from "@uppy/image-editor";
import { UppyContextProvider } from "@uppy/react";
import Dashboard from "@uppy/react/dashboard";
import Tus from "@uppy/tus";
import { EditIcon } from "lucide-react";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";

import { Button } from "../button";
import { Modal, ModalHeading } from "../modal";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";
import { Dropzone } from "./dropzone";
import { Uploader } from "./uploader";

function createUppy() {
	return new Uppy().use(Tus, { endpoint: "/api/upload" });
	// .use(Dashboard, { inline: true, target: "#uppy-dashboard" })
}

export function UploadImage() {
	const [uppy] = useState(createUppy);

	return (
		<DialogTrigger>
			<Button variant="icon" className="absolute top-3 right-3">
				<EditIcon />
			</Button>
			<Modal>
				<UppyContextProvider uppy={uppy}>
					<div className="p-3 flex flex-col space-y-8">
						<ModalHeading>Upload Image</ModalHeading>

						{/*<Dashboard uppy={uppy} />*/}
						<div className="flex flex-col space-y-3">
							<Uploader />
						</div>
					</div>
				</UppyContextProvider>
			</Modal>
		</DialogTrigger>
	);
}
