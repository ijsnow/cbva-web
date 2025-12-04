export const UNAUTHORIZED = "UNAUTHORIZED";
export const FORBIDDEN = "FORBIDDEN";
export const NOT_FOUND = "NOT_FOUND";
export const BAD_REQUEST = "BAD_REQUEST";

export enum ErrorKind {
	UNAUTHORIZED = "UNAUTHORIZED",
	FORBIDDEN = "FORBIDDEN",
	NOT_FOUND = "NOT_FOUND",
	BAD_REQUEST = "BAD_REQUEST",
	INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export function makeError(code: ErrorKind, message: string = code) {
	throw new Error(
		JSON.stringify({
			code,
			message,
		}),
	);
}

function isErrorCode(error: unknown, code: string): boolean {
	const parsed = JSON.parse((error as Error).message) as {
		code: string;
		message: string;
	};

	return parsed.code === code;
}

export function isUnauthorized(error: unknown): boolean {
	return isErrorCode(error, ErrorKind.UNAUTHORIZED);
}

export function isForbidden(error: unknown): boolean {
	return isErrorCode(error, ErrorKind.FORBIDDEN);
}

export function isNotFound(error: unknown): boolean {
	return isErrorCode(error, ErrorKind.NOT_FOUND);
}

export function isBadRequest(error: unknown): boolean {
	return isErrorCode(error, ErrorKind.BAD_REQUEST);
}

export function isInternalServerError(error: unknown): boolean {
	return isErrorCode(error, ErrorKind.INTERNAL_SERVER_ERROR);
}
