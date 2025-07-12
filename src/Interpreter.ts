import type {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "Ast";
import Lox from "Lox";
import RuntimeError from "RuntimeError";
import TokenType from "TokenType";
import { assertUnreachable } from "utils";

export class Interpreter {
  interpret(expr: Expr) {
    try {
      const value = this.evaluate(expr);
      console.log(this.stringify(value));
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.errorHandler.runtimeError(error);
      }
    }
  }

  private stringify(value: unknown) {
    return value == null ? "nil" : value.toString();
  }

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
        this.checkNumberOperand(expr.operator.type, expr.right);
        return -right;
      case TokenType.BANG:
        return !this.isTruthy(right);
      default:
        assertUnreachable(expr.operator.type);
    }
  }

  checkNumberOperand(operator: TokenType, operand: unknown) {
    if (typeof operand === "number") return;
    throw new RuntimeError(`${operator} operands must be a number`);
  }

  visitBinaryExpr(expr: BinaryExpr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator.type, left, right);
        return left - right;
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new RuntimeError(
          `${expr.operator.type} operands must be both string or numbers`,
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator.type, left, right);
        return left / right;
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator.type, left, right);
        return left * right;
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator.type, left, right);
        return left > right;
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator.type, left, right);
        return left >= right;
      case TokenType.EQUAL:
        return left == right;
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator.type, left, right);
        return left < right;
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator.type, left, right);
        return left <= right;
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      default:
        assertUnreachable(expr.operator.type);
    }
  }

  checkNumberOperands(operator: TokenType, left: unknown, right: unknown) {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(`${operator} operands must be numbers`);
  }

  private evaluate(expr: Expr): unknown {
    switch (expr.type) {
      case "BinaryExpr":
        return this.visitBinaryExpr(expr);
      case "GroupingExpr":
        return this.visitGroupingExpr(expr);
      case "LiteralExpr":
        return this.visitLitteralExpr(expr);
      case "UnaryExpr":
        return this.visitUnaryExpr(expr);
      case "VariableExpr":
      case "AssignExpr":
      case "LogicalExpr":
      case "CallExpr":
      case "GetExpr":
      case "SetExpr":
      case "ThisExpr":
      case "SuperExpr":
        throw new RuntimeError(`${expr.type} not implemented.`);
    }
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
