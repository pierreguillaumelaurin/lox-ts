import RuntimeError from "RuntimeError";
import type { Token } from "Token";
import TokenType from "TokenType";

class Environment {
  private values: Record<string, unknown> = {};

  define(name: string, value: unknown) {
    this.values[name] = value;
  }

  assign(name: Token, value: unknown) {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value;
      return;
    }

    throw new RuntimeError(TokenType.VAR, `Undefined variable ${name.lexeme}.`);
  }

  get(name: Token) {
    const value = this.values[name.lexeme];

    if (!value) {
      throw new RuntimeError(
        TokenType.VAR,
        `Undefined variable ${name.lexeme}.`,
      );
    }

    return value;
  }
}

export default Environment;
