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
      case "/":
        if (this.match("/")) {
          // A comment goes until the end of the line.
          while (this.peek() != "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.line++;
        break;
      case '"':
        this.string();
        break;
      default:
        if (c && Scanner.isDigit(c)) {
          this.number();
        } else {
          this.errorHandler.error(this.line, "Unexpected character");
        }
    }
  }

  private number() {
    let next = this.peek();
    while (next && Scanner.isDigit(next)) {
      this.advance();
      next = this.peek();
    }

    if (next && Scanner.isDigit(this.peekPeek() as string)) {
      this.advance();
      next = this.peek();

      while (next && Scanner.isDigit(next)) {
        this.advance();
        next = this.peek();
      }
    }

    this.addToken(
      TokenType.NUMBER,
      parseFloat(this.source.substring(this.start, this.current)),
    );
  }

  private peekPeek() {
    return this.current + 1 >= this.source.length
      ? "\0"
      : this.source[this.current + 1];
  }

  private static isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  private string() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.errorHandler.error(this.line, "Unterminated string.");
      return;
    }

    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private peek() {
    return this.isAtEnd() ? "\0" : this.source[this.current];
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
