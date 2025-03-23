import type { Token } from "Token";
import TokenType from "TokenType";
import ErrorHandler from "ErrorHandler";

export class Scanner {
  private errorHandler: ErrorHandler;
  private source = "";
  private tokens: Token[] = [];

  private start = 0;
  private current = 0;
  private line = 1;

  constructor(source: string, errorHandler: ErrorHandler) {
    this.source = source;
    this.errorHandler = errorHandler;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push();
    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL,
        );
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER,
        );
        break;
      default:
        this.errorHandler.error(this.line, "Unexpected character");
    }
  }

  private match(expected: string) {
    if (this.isAtEnd()) {
      return false;
    }
    if (this.source[this.current] != expected) {
      return false;
    }
    this.current++;
    return true;
  }

  private advance() {
    this.current++;
    return this.source[this.current - 1];
  }

  private addToken(type: TokenType, literal?: unknown) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push({ type, lexeme: text, literal, line: this.line });
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }
}
