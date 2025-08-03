import RuntimeError from "RuntimeError";
import type { Token } from "Token";
import TokenType from "TokenType";

class Environment {
  private values: Record<string, unknown> = {};
  enclosing?: Environment;

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  define(name: string, value: unknown) {
    this.values[name] = value;
  }

  assign(name: Token, value: unknown) {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value;
      return;
    }
    if (this.enclosing != null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(TokenType.VAR, `Undefined variable ${name.lexeme}.`);
  }

  get(name: Token): unknown {
    const value = this.values[name.lexeme];

    if (value) return value;
    if (this.enclosing != null) return this.enclosing.get(name);

    throw new RuntimeError(TokenType.VAR, `Undefined variable ${name.lexeme}.`);
  }
}

export default Environment;
