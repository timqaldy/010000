export class AdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdapterError";
  }
}

export class AdapterBlockedError extends AdapterError {
  constructor(message: string) {
    super(message);
    this.name = "AdapterBlockedError";
  }
}
