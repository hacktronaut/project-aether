export class AetherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CompilationError extends AetherError {
  constructor(message: string, public readonly file?: string, public readonly line?: number) {
    super(message);
  }
}

export class RuntimeError extends AetherError {
  constructor(message: string) {
    super(message);
  }
}
