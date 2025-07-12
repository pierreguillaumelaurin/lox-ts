import type { Token } from "Token";

class RuntimeError extends Error {
  token: Token;
  constructor(token: Token, message: string) {
    super(message);
    Object.setPrototypeOf(this, RuntimeError.prototype);
    this.token = token;
  }
}

export default RuntimeError;
