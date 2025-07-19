import type TokenType from "TokenType";

class RuntimeError extends Error {
  token: TokenType;
  constructor(token: TokenType, message: string) {
    super(message);
    Object.setPrototypeOf(this, RuntimeError.prototype);
    this.token = token;
  }
}

export default RuntimeError;
