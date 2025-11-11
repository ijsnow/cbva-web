import { setResponseStatus } from "@tanstack/react-start/server";

export { notFound } from '@tanstack/react-router'

export function badRequest(message?: string) {
	setResponseStatus(400);

	return new Error(message || "BAD_REQUEST");
}
