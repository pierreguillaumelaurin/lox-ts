import type { Expr } from "Ast";
import type { Token } from "Token";
import TokenType from "TokenType";

class Parser {
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
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

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = {type: "BinaryExpr", left: expr, operator, right};
    }

    return expr;
  }

  private term() {
      let expr = this.factor();

      while (this.match(TokenType.MINUS, TokenType.PLUS)) {
        const operator = this.previous();
        const right = this.factor();
        expr = {type: "BinaryExpr", left: expr, operator, right};
      }

      return expr;
    }

  private factor() {
   let expr = this.unary();
   while (this.match(TokenType.SLASH, TokenType.STAR)) {
     const operator = this.previous();
     const right = this.unary();
     expr = {type: "BinaryExpr", left: expr, operator, right};
   }
    
   return expr;
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
    return previous();
  }

  private isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  private peek() {
    return this.tokens[this.current] ?? { type: TokenType.EOF };
  }

  private previous() {
    return this.tokens[this.current - 1] ?? { type: TokenType.EOF };
  }
}

export default Parser;
