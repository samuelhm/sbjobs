export class HttpError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const toErrorResponse = (error) => {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  if (error?.code === '23505') {
    return {
      statusCode: 409,
      body: {
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists.',
        },
      },
    };
  }

  if (error?.code === '23503') {
    return {
      statusCode: 400,
      body: {
        error: {
          code: 'FK_VIOLATION',
          message: 'Referenced resource does not exist.',
        },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected server error.',
      },
    },
  };
};
