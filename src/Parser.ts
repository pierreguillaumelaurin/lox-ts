import type {
  Expr,
  LiteralExpr,
  GroupingExpr,
  Stmt,
  ExprStmt,
  VarStmt,
} from "Ast";
import ErrorHandler from "ErrorHandler";
import type { Token } from "Token";
import TokenType from "TokenType";

const EOF_TOKEN = { type: TokenType.EOF, lexeme: "", literal: null, line: 0 };

class Parser {
  private readonly tokens: Token[];
  private errorHandler: ErrorHandler;
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.errorHandler = new ErrorHandler();
  }

  public parse() {
    const statements: Stmt[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements;
  }

  private declaration(): DeclarationStatement {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      if (error instanceof ParseError) {
        this.synchronize();
        return null;
      }
    }
  }

  private varDeclaration(): VarStmt {}

  private statement(): ExprStmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();

    return this.expressionStatement();
  }

  private printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return { type: "PrintStmt", expression: value };
  }

  private expressionStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return { type: "ExprStmt", expression: value };
  }

  private expression(): Expr {
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

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right: Expr = this.unary();
      return { type: "UnaryExpr", operator, right };
    }

    return this.primary();
  }

  private primary() {
    if (this.match(TokenType.FALSE))
      return { type: "LiteralExpr", value: false } as LiteralExpr;
    if (this.match(TokenType.TRUE))
      return { type: "LiteralExpr", value: true } as LiteralExpr;
    if (this.match(TokenType.NIL))
      return { type: "LiteralExpr", value: null } as LiteralExpr;

    if (this.match(TokenType.NUMBER, TokenType.STRING))
      return {
        type: "LiteralExpr",
        value: this.previous().literal,
      } as LiteralExpr;

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return { type: "GroupingExpr", expression: expr } as GroupingExpr;
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    this.error(this.peek(), message);
  }

  private error(token: Token, message: string) {
    switch (token.type) {
      case TokenType.EOF:
        this.errorHandler.error(token.line, ` at end ${message}`);
        break;
      default:
        this.errorHandler.error(token.line, ` at '${token.lexeme}' ${message}`);
    }

    throw new Error("parse error");
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

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

  private peek(): Token {
    return this.tokens[this.current] ?? EOF_TOKEN;
  }

  private previous(): Token {
    return this.tokens[this.current - 1] ?? EOF_TOKEN;
  }
}

export default Parser;
