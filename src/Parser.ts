import type {
  Expr,
  LiteralExpr,
  GroupingExpr,
  Stmt,
  VarStmt,
  AssignExpr,
} from "./Ast";
import ErrorHandler from "./ErrorHandler";
import ParseError from "./ParseError";
import RuntimeError from "./RuntimeError";
import type { Token } from "./Token";
import TokenType from "./TokenType";

const EOF_TOKEN = { type: TokenType.EOF, lexeme: "", literal: null, line: 0 };

class Parser {
  private readonly tokens: Token[];
  private errorHandler: ErrorHandler;
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.errorHandler = new ErrorHandler();
  }

  public parse(): Stmt[] {
    const statements: (Stmt | null | undefined)[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements.filter((statement) => statement != null) as Stmt[];
  }

  private declaration() {
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

  private varDeclaration(): VarStmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name");

    const initializer = this.match(TokenType.EQUAL) ? this.expression() : null;

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");

    if (!name) {
      throw new RuntimeError(
        { type: TokenType.VAR, lexeme: "var", literal: null, line: 0 },
        "Undefined variable name during variable declaration",
      );
    }

    return { type: "VarStmt", name, initializer };
  }

  private statement(): Stmt {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.LEFT_BRACE)) return this.blockStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();

    return this.expressionStatement();
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition = null;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    let increment = null;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }

    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.statement();

    if (increment != null) {
      body = {
        type: "BlockStmt" as const,
        statements: [body, { type: "ExprStmt", expression: increment }],
      };
    }

    if (condition == null) {
      condition = { type: "LiteralExpr" as const, value: true };
    }
    body = { type: "WhileStmt", condition, body };

    if (initializer != null) {
      body = {
        type: "BlockStmt" as const,
        statements: [initializer, body],
      };
    }

    return body;
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");
    const body = this.statement();

    return { type: "WhileStmt" as const, condition, body };
  }

  private ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return { type: "IfStmt" as const, condition, thenBranch, elseBranch };
  }

  private printStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return { type: "PrintStmt" as const, expression: value };
  }

  private blockStatement() {
    const statements = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return {
      type: "BlockStmt" as const,
      statements: statements.filter(Boolean) as Stmt[],
    };
  }

  private expressionStatement() {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return { type: "ExprStmt" as const, expression: value };
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const previous = this.previous();
      if (expr.type === "VariableExpr") {
        return {
          type: "AssignExpr",
          name: expr.name,
          value: this.assignment(),
        } as AssignExpr;
      }
      this.error(previous, "Invalid assignment target");
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = { type: "LogicalExpr", left: expr, operator, right };
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = { type: "LogicalExpr", left: expr, operator, right };
    }

    return expr;
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

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): Expr {
    const args = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after arguments",
    );

    return { type: "CallExpr", callee, paren, arguments: args };
  }

  private primary(): Expr {
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

    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: "VariableExpr",
        name: this.previous(),
      };
    }

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
