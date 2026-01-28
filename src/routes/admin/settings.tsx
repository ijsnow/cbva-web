import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { title } from "@/components/base/primitives";
import { AdminLayout } from "@/layouts/admin";
import {
	Disclosure,
	DisclosureGroup,
	DisclosureHeader,
	DisclosurePanel,
} from "@/components/base/disclosure";
import { getAllSettingsQueryOptions } from "@/functions/admin/get-all-settings";
import { SettingsType, Setting } from "@/db/schema/settings";
import { useAppForm } from "@/components/base/form";
import { updateSettingMutationOptions } from "@/functions/settings/update-setting";
import { queue } from "@/components/base/toast";

export const Route = createFileRoute("/admin/settings")({
	loader: async ({ context: { queryClient, ...context } }) => {
		const viewer = context.viewer;

		if (!viewer || viewer.role !== "admin") {
			throw redirect({ to: "/not-found" });
		}
	},
	component: RouteComponent,
});

function formatValue(value: string, type: SettingsType) {
	if (type === "money") {
		const formatter = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		});

		return formatter.format(Number.parseFloat(value));
	}

	if (type === "float") {
		return Number.parseFloat(value);
	}

	if (type === "int") {
		return Number.parseInt(value, 10);
	}

	return value;
}

function RouteComponent() {
	const { data: settings } = useSuspenseQuery(getAllSettingsQueryOptions());

	return (
		<AdminLayout
			classNames={{
				content: "flex flex-col space-y-8 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<section className="flex flex-col space-y-4">
				<h2
					className={title({
						size: "sm",
						class: "flex flex-row justify-between items-center",
					})}
				>
					<span>Settings</span>
				</h2>

				<DisclosureGroup className="bg-white">
					{settings?.map(({ key, ...setting }) => (
						<Disclosure key={key}>
							<DisclosureHeader
								size="sm"
								contentClassName="flex-1 flex flex-row justify-start items-center gap-4"
							>
								<span className="text-xs">{setting.label}:</span>
								<span className="text-xs font-semibold">
									{setting.value
										? formatValue(setting.value, setting.type)
										: "not set"}
								</span>
							</DisclosureHeader>
							<DisclosurePanel>
								<UpdateSettingsForm {...setting} settingKey={key} />
							</DisclosurePanel>
						</Disclosure>
					))}
				</DisclosureGroup>
			</section>
		</AdminLayout>
	);
}

function UpdateSettingsForm({
	settingKey,
	label,
	value,
	type,
}: Omit<Setting, "key"> & { settingKey: string }) {
	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		...updateSettingMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(getAllSettingsQueryOptions());

			queue.add({
				variant: "success",
				title: "Success!",
				description: "Updated setting successfully.",
			});
		},
	});

	const form = useAppForm({
		defaultValues: {
			value,
			unsetValue: value === null,
		},
		listeners: {
			onChange: ({ fieldApi, formApi }) => {
				if (fieldApi.name === "unsetValue" && fieldApi.state.value) {
					formApi.setFieldValue("value", null);
				} else if (fieldApi.name === "unsetValue" && !fieldApi.state.value) {
					formApi.setFieldValue("value", value);
				}
			},
		},
		onSubmit: ({ value: { value, unsetValue }, formApi }) => {
			mutate(
				{
					key: settingKey,
					value: unsetValue ? null : (value?.toString() ?? null),
				},
				{
					onSuccess: () => {
						formApi.reset();
					},
				},
			);
		},
	});

	return (
		<form
			className="flex flex-col gap-y-3"
			onSubmit={(e) => {
				e.preventDefault();

				form.handleSubmit();
			}}
		>
			<h2>Update {label}</h2>

			<form.Subscribe selector={(state) => state.values.unsetValue}>
				{(unsetValue) => (
					<form.AppField name="value">
						{(field) => (
							<>
								{["money", "int", "float"].includes(type) ? (
									<field.Number
										field={field}
										formatOptions={
											type === "money"
												? {
														style: "currency",
														currency: "USD",
													}
												: undefined
										}
										isDisabled={unsetValue}
									/>
								) : (
									<field.Text field={field} />
								)}
							</>
						)}
					</form.AppField>
				)}
			</form.Subscribe>

			<form.AppField name="unsetValue">
				{(field) => <field.Checkbox label="Remove value" field={field} />}
			</form.AppField>

			<form.AppForm>
				<form.Footer>
					<form.SubmitButton>Save</form.SubmitButton>
				</form.Footer>
			</form.AppForm>
		</form>
	);
}
