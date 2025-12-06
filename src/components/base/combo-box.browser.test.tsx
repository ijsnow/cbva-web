import { User } from "@react-aria/test-utils";
import { render } from "@testing-library/react";
import { range } from "lodash-es";
import { beforeAll, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
// import { render } from "vitest-browser-react";
import { ComboBox, ComboBoxItem } from "./combo-box";

describe("ComboBox", () => {
	// beforeAll(()=> {
	//   jsdom
	// })

	const testUtilUser = new User({ interactionType: "mouse" });

	test("ComboBox can select an option via keyboard", async () => {
		// Render your test component/app and initialize the combobox tester
		// const { getByTestId } =
		render(
			<ComboBox
				data-testid="test-combobox"
				items={range(10).map((i) => ({
					value: i,
					display: `Item ${i}`,
				}))}
			>
				{(item) => (
					<ComboBoxItem id={item.value} textValue={item.display}>
						{item.display}
					</ComboBoxItem>
				)}
			</ComboBox>,
		);

		const comboboxTester = testUtilUser.createTester("ComboBox", {
			root: page
				.getByTestId("test-combobox")
				.element() as unknown as HTMLElement,
			interactionType: "keyboard",
		});

		await comboboxTester.open();
		expect(comboboxTester.listbox).toBeInTheDocument();

		const options = comboboxTester.options();
		await comboboxTester.selectOption({ option: options[0] });
		expect(comboboxTester.combobox.value).toBe("Item 0");

		// TODO: comboboxTester arrow down ;
		// TODO:
		// comboboxTester.

		// expect(comboboxTester.listbox).not.toBeInTheDocument();
	});

	// test("keyboard navigation moves one element at a time", async () => {
	// 	const user = userEvent.setup();

	// 	render(
	// 		<ComboBox label="Test ComboBox" items={testItems}>
	// 			{(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
	// 		</ComboBox>,
	// 	);

	// 	const input = screen.getByRole("combobox");

	// 	// Focus the input to open the listbox
	// 	await user.click(input);

	// 	// Wait for the listbox to appear
	// 	const listbox = await screen.findByRole("listbox");
	// 	expect(listbox).toBeInTheDocument();

	// 	// Get all options
	// 	const options = screen.getAllByRole("option");
	// 	expect(options).toHaveLength(5);

	// 	// Press down arrow once - should focus first item
	// 	await user.keyboard("{ArrowDown}");
	// 	expect(options[0]).toHaveAttribute("data-focused", "true");

	// 	// Press down arrow again - should focus second item
	// 	await user.keyboard("{ArrowDown}");
	// 	expect(options[1]).toHaveAttribute("data-focused", "true");
	// 	expect(options[0]).not.toHaveAttribute("data-focused", "true");

	// 	// Press down arrow again - should focus third item
	// 	await user.keyboard("{ArrowDown}");
	// 	expect(options[2]).toHaveAttribute("data-focused", "true");
	// 	expect(options[1]).not.toHaveAttribute("data-focused", "true");

	// 	// Press up arrow - should focus second item
	// 	await user.keyboard("{ArrowUp}");
	// 	expect(options[1]).toHaveAttribute("data-focused", "true");
	// 	expect(options[2]).not.toHaveAttribute("data-focused", "true");

	// 	// Press up arrow again - should focus first item
	// 	await user.keyboard("{ArrowUp}");
	// 	expect(options[0]).toHaveAttribute("data-focused", "true");
	// 	expect(options[1]).not.toHaveAttribute("data-focused", "true");
	// });

	// test("keyboard navigation does not skip items", async () => {
	// 	const user = userEvent.setup();

	// 	render(
	// 		<ComboBox label="Test ComboBox" items={testItems}>
	// 			{(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
	// 		</ComboBox>,
	// 	);

	// 	const input = screen.getByRole("combobox");
	// 	await user.click(input);

	// 	const options = screen.getAllByRole("option");

	// 	// Press down arrow and track which items get focused
	// 	const focusedIndices: number[] = [];

	// 	await user.keyboard("{ArrowDown}");
	// 	const firstFocused = options.findIndex((opt) =>
	// 		opt.hasAttribute("data-focused"),
	// 	);
	// 	focusedIndices.push(firstFocused);

	// 	await user.keyboard("{ArrowDown}");
	// 	const secondFocused = options.findIndex((opt) =>
	// 		opt.hasAttribute("data-focused"),
	// 	);
	// 	focusedIndices.push(secondFocused);

	// 	await user.keyboard("{ArrowDown}");
	// 	const thirdFocused = options.findIndex((opt) =>
	// 		opt.hasAttribute("data-focused"),
	// 	);
	// 	focusedIndices.push(thirdFocused);

	// 	// Each press should increment by exactly 1
	// 	expect(focusedIndices[1] - focusedIndices[0]).toBe(1);
	// 	expect(focusedIndices[2] - focusedIndices[1]).toBe(1);
	// });
});
