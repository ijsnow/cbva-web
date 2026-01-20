import { useState, useEffect } from "react";
import {
	DialogTrigger,
	Button,
	Input,
	Label,
	Heading,
} from "react-aria-components";
import { Modal } from "../../modal";

interface LinkModalProps {
	onInsertLink: (url: string) => void;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	currentUrl?: string | null;
}

export function LinkModal({
	onInsertLink,
	isOpen,
	onOpenChange,
	currentUrl,
}: LinkModalProps) {
	const [url, setUrl] = useState(currentUrl || "");

	// Reset URL when modal opens
	useEffect(() => {
		if (isOpen) {
			setUrl(currentUrl || "");
		}
	}, [isOpen, currentUrl]);

	const handleSubmit = () => {
		if (url.trim()) {
			onInsertLink(url.trim());
			setUrl("");
			onOpenChange(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleCancel = () => {
		setUrl("");
		onOpenChange(false);
	};

	const modalTitle = currentUrl ? "Edit Link" : "Insert Link";
	const submitButtonText = currentUrl ? "Update" : "Insert";

	return (
		<Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
			<div className="p-6">
				<Heading className="text-lg font-semibold mb-4" slot="title">
					{modalTitle}
				</Heading>
				<div className="space-y-4">
					<div className="flex flex-col gap-2">
						<Label className="text-sm font-medium">URL</Label>
						<Input
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="https://example.com"
							autoFocus
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							onPress={handleCancel}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Cancel
						</Button>
						<Button
							onPress={handleSubmit}
							isDisabled={!url.trim()}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							{submitButtonText}
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
