import { isNotNullOrUndefined } from "./types";

export function assert<T>(
	value: T | null | undefined,
	message?: string,
): asserts value is T {
	if (isNotNullOrUndefined(value) && value !== false) {
		throw new Error(message || `assertion failed with value: ${typeof value}`);
	}
}
