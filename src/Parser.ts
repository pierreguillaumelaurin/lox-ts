import type { Expr, UnaryExpr } from "Ast";
import ErrorHandler from "ErrorHandler";
import type * as Token from "Token";
import TokenType from "TokenType";

class Parser {
  private readonly tokens: Token.Token[];
  private errorHandler: ErrorHandler;
  private current = 0;

  constructor(tokens: Token.Token[]) {
    this.tokens = tokens;
    this.errorHandler = new ErrorHandler();
  }

  private expression() {
    return this.equality();
  }

  private equality() {
    let expr: Expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = { type: "BinaryExpr", left: expr, operator, right };
    }
    return expr;
  }

  private comparison() {
    let expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = { type: "BinaryExpr", left: expr, operator, right };
    }

    return expr;
  }

  private term() {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = { type: "BinaryExpr", left: expr, operator, right };
    }

    return expr;
  }

  private factor() {
    let expr = this.unary();
    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = { type: "BinaryExpr", left: expr, operator, right };
    }

    return expr;
  }

  private unary() {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right: UnaryExpr = this.unary();
      return { type: "UnaryExpr", operator, right };
    }

    return this.primary();
  }

  private primary() {
    if (this.match(TokenType.FALSE))
      return { type: "LiteralExpr", value: false };
    if (this.match(TokenType.TRUE)) return { type: "LiteralExpr", value: true };
    if (this.match(TokenType.NIL)) return { type: "LiteralExpr", value: null };

    if (this.match(TokenType.NUMBER, TokenType.STRING))
      return { type: "LiteralExpr", value: this.previous().literal };

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return { type: "GroupingExpr", expr };
    }
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    this.error(this.peek(), message);
  }

  private error() {}

  private match(...types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  private advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  private peek() {
    return this.tokens[this.current] ?? { type: TokenType.EOF, literal: null };
  }

  private previous() {
    return (
      this.tokens[this.current - 1] ?? { type: TokenType.EOF, literal: null }
    );
  }
}

export default Parser;
