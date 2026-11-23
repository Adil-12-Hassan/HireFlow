// One error shape for the whole API.
// Every error the client sees is { "error": "message" }.
// We never send raw database errors or stack traces to the browser.

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export function badRequest(message = "Invalid request"): ApiError {
    return new ApiError(400, message);
}

export function unauthorized(message = "You must sign in to continue"): ApiError {
    return new ApiError(401, message);
}

export function forbidden(message = "You are not allowed to do this"): ApiError {
    return new ApiError(403, message);
}

export function notFound(message = "Not found"): ApiError {
    return new ApiError(404, message);
}

export function conflict(message = "This already exists"): ApiError {
    return new ApiError(409, message);
}

export function tooManyRequests(message = "Too many requests, please try again later"): ApiError {
    return new ApiError(429, message);
}

export function internalError(message = "Something went wrong"): ApiError {
    return new ApiError(500, message);
}

export function serviceUnavailable(message = "Service is not available now"): ApiError {
    return new ApiError(503, message);
}