export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} tidak ditemukan`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Akses tidak diizinkan') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki akses ke resource ini') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
