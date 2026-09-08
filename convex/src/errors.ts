export type AutumnErrorData = {
  code: string;
  operation: string;
  statusCode?: number;
  message: string;
};

export class AutumnIndeterminateError extends Error {
  readonly code = "AUTUMN_INDETERMINATE";
  readonly operation: string;
  readonly statusCode?: number;

  constructor(operation: string, statusCode?: number) {
    super("The Autumn operation has an indeterminate outcome.");
    this.name = "AutumnIndeterminateError";
    this.operation = operation;
    this.statusCode = statusCode;
  }
}

export class AutumnConfigurationError extends Error {
  readonly code = "AUTUMN_CONFIGURATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "AutumnConfigurationError";
  }
}

export class AutumnValidationError extends Error {
  readonly code = "AUTUMN_VALIDATION_ERROR";
  readonly operation: string;

  constructor(operation: string, message: string) {
    super(message);
    this.name = "AutumnValidationError";
    this.operation = operation;
  }
}
