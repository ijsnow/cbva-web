import { User } from "@react-aria/test-utils";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { range } from "lodash-es";
import { assert, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { ComboBox, ComboBoxItem } from "./combo-box";

describe("ComboBox", () => {
	const testUtilUser = new User({ interactionType: "mouse" });
	const user = userEvent.setup();

	test("ComboBox can select an option via keyboard", async () => {
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

		let options = comboboxTester.options();

		expect(options).toHaveLength(10);

		await comboboxTester.selectOption({ option: options[0] });
		expect(comboboxTester.combobox.value).toBe("Item 0");

		await comboboxTester.open({
			interactionType: "mouse",
		});

		options = comboboxTester.options();

		// await user.keyboard("{ArrowDown}");

		await comboboxTester.selectOption({ option: options[1] });
		expect(comboboxTester.combobox.value).toBe("Item 1");

		// Trigger arrow down keyboard event
		// await page.;

		await comboboxTester.open({
			interactionType: "keyboard",
		});

		assert(comboboxTester.listbox, "list box not open");

		// Get initial focus - should be on Item 1 (the selected item)
		let focusedOption = comboboxTester.focusedOption;
		expect(focusedOption?.textContent).toBe("Item 1");

		// Dispatch ArrowDown event directly to the listbox
		const listbox = comboboxTester.listbox;
		assert(listbox, "listbox not found");

		// Fire keydown event
		listbox.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "ArrowDown",
				code: "ArrowDown",
				bubbles: true,
				cancelable: true,
			}),
		);

		// Small delay to let the UI update
		await new Promise((resolve) => setTimeout(resolve, 100));

		focusedOption = comboboxTester.focusedOption;

		assert(focusedOption, "nothing focused after arrow down");

		// Should have moved from Item 1 to Item 2
		expect(focusedOption?.textContent).toBe("Item 2");

		// Press ArrowDown again
		listbox.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "ArrowDown",
				code: "ArrowDown",
				bubbles: true,
				cancelable: true,
			}),
		);
		await new Promise((resolve) => setTimeout(resolve, 100));

		focusedOption = comboboxTester.focusedOption;

		// Should have moved from Item 2 to Item 3 (not Item 4!)
		expect(focusedOption?.textContent).toBe("Item 3");
	});
});
