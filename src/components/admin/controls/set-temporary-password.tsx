import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { authClient } from "@/auth/client";
import { CopyIcon, LockIcon } from "lucide-react";
import { dbg } from "@/utils/dbg";

// Code for password generation from https://dev.to/hayrhotoca/build-a-secure-password-generator-with-javascript-41nl
function secureRandom() {
	try {
		const array = new Uint8Array(8);
		const buf = window.crypto.getRandomValues(array);
		const offset = Math.random() < 0.5 ? 0 : buf.length - 4;
		const dataView = new DataView(buf.buffer);
		const intVal = dataView.getUint32(offset, true); // Convert bytes to an unsigned 32-bit integer
		const normalized = intVal / (2 ** 32 - 1); // Scale to [0, 1)
		return normalized;
	} catch (error) {
		console.error("Error generating secure random number:", error);
		throw error; // Rethrow or handle as needed
	}
}

function generatePassword() {
	const length = 32;
	const uppercase = true;
	const lowercase = true;
	const numbers = true;
	const symbols = true;

	let chars = "";
	if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
	if (numbers) chars += "0123456789";
	if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

	let password = "";

	for (let i = 0; i < length; i++) {
		password += chars.charAt(Math.floor(dbg(secureRandom()) * chars.length));
	}

	return password;
}

export type SetTemporaryPasswordForm = {
	id: string;
	name: string;
};

export function SetTemporaryPasswordForm({
	id: userId,
	name,
}: SetTemporaryPasswordForm) {
	const [isOpen, setOpen] = useState(false);

	const {
		mutate,
		data: password,
		reset: resetMutation,
	} = useMutation({
		mutationFn: async () => {
			const password = generatePassword();

			const res = await authClient.admin.setUserPassword({
				userId,
				newPassword: password,
			});

			if (res.error) {
				throw res.error;
			}

			const { error } = await authClient.admin.updateUser({
				userId,
				data: { needsPasswordChange: true },
			});

			if (error) {
				throw error;
			}

			return password;
		},
	});

	const handleCopyPress = () => {
		if (password) {
			navigator.clipboard.writeText(password);
		}
	};

	const form = useAppForm({
		onSubmit: () => {
			mutate();
		},
	});

	useEffect(() => {
		if (!isOpen) {
			form.reset();
			resetMutation();
		}
	}, [form, isOpen, resetMutation]);

	return (
		<>
			<Button
				variant="icon"
				color="default"
				onPress={() => setOpen(true)}
				tooltip="Generate temporary password"
			>
				<LockIcon />
			</Button>

			<Modal isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-3">
					<Heading className={title({ size: "sm" })} slot="title">
						Set Temporary Password
					</Heading>
					{!password ? (
						<>
							<p>
								Generate a temporary password for{" "}
								<span className="font-semibold italic">{name}</span>.
							</p>
							<form
								onSubmit={(e) => {
									e.preventDefault();

									form.handleSubmit();
								}}
							>
								<form.AppForm>
									<form.Footer className="col-span-full">
										<Button onPress={() => setOpen(false)}>Cancel</Button>

										<form.SubmitButton requireChange={false}>
											Submit
										</form.SubmitButton>
									</form.Footer>
								</form.AppForm>
							</form>
						</>
					) : (
						<>
							<p>
								Copy the password below to send to{" "}
								<span className="font-semibold italic">{name}</span>. You will
								not be able to see this password again. If it is lost, generate
								another one.
							</p>
							<div className="rounded-lg border border-gray-900 p-3 flex flex-row items-center justify-between">
								<span>{password}</span>
								<Button variant="icon" tooltip="Copy" onPress={handleCopyPress}>
									<CopyIcon />
								</Button>
							</div>
							<Button
								onPress={() => setOpen(false)}
								className="self-end"
								color="primary"
							>
								Done
							</Button>
						</>
					)}
				</div>
			</Modal>
		</>
	);
}
