import type TokenType from "TokenType";

class ParseError extends Error {
  token: TokenType;
  constructor(token: TokenType, message: string) {
    super(message);
    Object.setPrototypeOf(this, ParseError.prototype);
    this.token = token;
  }
}

export default ParseError;
