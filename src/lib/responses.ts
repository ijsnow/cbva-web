import { notFound as notFoundResult } from "@tanstack/react-router";
import {
	setResponseHeader,
	setResponseStatus,
} from "@tanstack/react-start/server";
import { ErrorKind, makeError } from "./errors";

export function badRequest(message = "BAD_REQUEST") {
	setResponseStatus(400);

	return new Error(message);
}

export function unauthorized(message = "UNAUTHORIZED") {
	setResponseStatus(401);

	throw makeError(ErrorKind.UNAUTHORIZED, message);
}

export function forbidden(message = "FORBIDDEN") {
	setResponseStatus(403);

	throw makeError(ErrorKind.FORBIDDEN, message);
}

export function tooManyRequests(
	retryAfterSecs: number,
	message = "TOO_MANY_REQUESTS",
) {
	setResponseStatus(429);
	setResponseHeader("Retry-After", retryAfterSecs.toString());

	throw makeError(ErrorKind.TOO_MANY_REQUESTS, message);
}

export function notFound() {
	setResponseStatus(404);

	throw notFoundResult();
}

export function internalServerError(message: string) {
	setResponseStatus(500);

	// Error message is for internal usage.
	console.log("INTERNAL_SERVER_ERROR:", message);

	throw makeError(ErrorKind.INTERNAL_SERVER_ERROR);
}
