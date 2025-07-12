import type {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "Ast";
import TokenType from "TokenType";
import { assertUnreachable } from "utils";

export class Interpreter {
  visitLitteralExpr(expr: LiteralExpr) {
    return expr.value;
  }
  visitGroupingExpr(expr: GroupingExpr) {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: UnaryExpr) {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        return -right;
      case TokenType.BANG:
        return !this.isTruthy(right);
      default:
        assertUnreachable(expr.operator.type);
    }
  }
  visitBinaryExpr(expr: BinaryExpr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        return left - right;
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new Error(
          `invalid operand with plus operator. Left: ${left} Right: ${right}`,
        );
      case TokenType.SLASH:
        return left / right;
      case TokenType.STAR:
        return left * right;
      case TokenType.GREATER:
        return left > right;
      case TokenType.GREATER_EQUAL:
        return left >= right;
      case TokenType.EQUAL:
        return left == right;
      case TokenType.LESS:
        return left < right;
      case TokenType.LESS_EQUAL:
        return left <= right;
      case TokenType.BANG_EQUAL:
        return left != right;
      case TokenType.EQUAL_EQUAL:
        return left === right;
      default:
        assertUnreachable(expr.operator.type);
    }
  }

  private evaluate(expr: Expr) {
    return expr.accept(this);
  }

  private isTruthy(value: unknown) {
    if (value == null) return false;
    if (typeof value === "boolean") return value;

    return true;
  }

  private isEqual(left: unknown, right: unknown) {
    if (left == null && right == null) return true;
    if (left == null) return false;

    return left === right;
  }
}
