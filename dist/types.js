"use strict";
/**
 * Rooguys Node.js SDK Type Definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponseBody = exports.extractRequestId = exports.extractRateLimitInfo = exports.HttpClient = exports.mapStatusToError = exports.ServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthenticationError = exports.ValidationError = exports.RooguysError = void 0;
// Re-export error types
var errors_1 = require("./errors");
Object.defineProperty(exports, "RooguysError", { enumerable: true, get: function () { return errors_1.RooguysError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return errors_1.AuthenticationError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return errors_1.ForbiddenError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errors_1.NotFoundError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return errors_1.ConflictError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_1.RateLimitError; } });
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return errors_1.ServerError; } });
Object.defineProperty(exports, "mapStatusToError", { enumerable: true, get: function () { return errors_1.mapStatusToError; } });
// Re-export HTTP client types
var http_client_1 = require("./http-client");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return http_client_1.HttpClient; } });
Object.defineProperty(exports, "extractRateLimitInfo", { enumerable: true, get: function () { return http_client_1.extractRateLimitInfo; } });
Object.defineProperty(exports, "extractRequestId", { enumerable: true, get: function () { return http_client_1.extractRequestId; } });
Object.defineProperty(exports, "parseResponseBody", { enumerable: true, get: function () { return http_client_1.parseResponseBody; } });
