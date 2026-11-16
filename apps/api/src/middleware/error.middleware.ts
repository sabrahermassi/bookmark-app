import type { Request, Response, NextFunction } from "express";
import type { ErrorResponse } from "../types/bookmarks.types.js";

export class AppError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    });
    return;
  }

  // Broken JSON in the request body (thrown by express.json())
  if (
    err instanceof SyntaxError &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body is not valid JSON.",
      },
    });
    return;
  }

  // Other body-reading errors from express.json() (413 too large, 415 encoding)
  if (
    err instanceof Error &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  ) {
    res.status(err.status).json({
      error: {
        code: "BAD_REQUEST",
        message: "The request body could not be read.",
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
  });
};
