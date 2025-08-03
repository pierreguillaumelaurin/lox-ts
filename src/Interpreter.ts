import type {
  AssignExpr,
  BinaryExpr,
  BlockStmt,
  Expr,
  ExprStmt,
  GroupingExpr,
  LiteralExpr,
  PrintStmt,
  Stmt,
  UnaryExpr,
  VariableExpr,
  VarStmt,
} from "Ast";
import Environment from "Environment";
import Lox from "Lox";
import RuntimeError from "RuntimeError";
import TokenType from "TokenType";
import { assertUnreachable } from "utils";

export class Interpreter {
  private environment = new Environment();

  interpret(statements: Stmt[]) {
    try {
      statements.forEach((statement) => {
        this.execute(statement);
      });
    } catch (error) {
      if (error instanceof RuntimeError) {
        Lox.errorHandler.runtimeError(error);
      }
    }
  }

  private execute(stmt: Stmt) {
    switch (stmt.type) {
      case "ExprStmt":
        this.evaluate(stmt.expression);
        break;
      case "VarStmt":
        this.executeVarStatement(stmt);
        break;
      case "PrintStmt":
        this.executePrintStatement(stmt);
        break;
      case "BlockStmt":
        this.executeBlockStatement(stmt);
        break;
      default:
        return;
    }
  }

  private stringify(value: unknown) {
    return value == null ? "nil" : value.toString();
  }

  executeVarStatement(stmt: VarStmt) {
    if (stmt.initializer == null) {
      return;
    }

    const value = this.evaluate(stmt.initializer);
    this.environment.define(stmt.name.lexeme, value);
  }

  executePrintStatement(stmt: PrintStmt) {
    const value = this.evaluate(stmt.expression);
    console.log(value ?? "nil");
    return null;
  }

  executeBlockStatement(stmt: BlockStmt) {
    const previous = this.environment;
    const current = new Environment(previous);
    try {
      this.environment = current;

      stmt.statements.forEach((statement) => this.execute(statement));
    } finally {
      this.environment = previous;
    }
  }

  evaluateVarExpr(expr: VariableExpr) {
    return this.environment.get(expr.name);
  }

  evaluateLitteralExpr(expr: LiteralExpr) {
    return expr.value;
  }
  evaluateGroupingExpr(expr: GroupingExpr) {
    return this.evaluate(expr.expression);
  }

  evaluateUnaryExpr(expr: UnaryExpr) {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator.type, expr.right);
        return -(right as number);
      case TokenType.BANG:
        return !this.isTruthy(right);
      default:
        assertUnreachable(expr.operator.type);
    }
  }

  evaluateVariableExpr(expr: VariableExpr) {
    return this.environment.get(expr.name);
  }

  evaluateAssignExpr(expr: AssignExpr) {
    const value = this.evaluate(expr.value);

    this.environment.assign(expr.name, value);
    return value;
  }

  checkNumberOperand(operator: TokenType, operand: unknown) {
    if (typeof operand === "number") return;
    throw new RuntimeError(operator, `${operator} operands must be a number`);
  }

  evaluateBinaryExpr(expr: BinaryExpr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator.type, left, right);
        return (left as number) - (right as number);
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new RuntimeError(
          expr.operator.type,
          `${expr.operator.type} operands must be both string or numbers`,
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator.type, left, right);
        return (left as number) / (right as number);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator.type, left, right);
        return (left as number) * (right as number);
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator.type, left, right);
        return (left as number) > (right as number);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator.type, left, right);
        return (left as number) >= (right as number);
      case TokenType.EQUAL:
        return left == right;
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator.type, left, right);
        return (left as number) < (right as number);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator.type, left, right);
        return (left as number) <= (right as number);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
      default:
        assertUnreachable(expr.operator.type);
    }
  }

  evaluateExpressionStatement(stmt: ExprStmt) {
    this.evaluate(stmt.expression);
    return null;
  }

  checkNumberOperands(operator: TokenType, left: unknown, right: unknown) {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(operator, `${operator} operands must be numbers`);
  }

  private evaluate(expr: Expr): unknown {
    switch (expr.type) {
      case "BinaryExpr":
        return this.evaluateBinaryExpr(expr);
      case "GroupingExpr":
        return this.evaluateGroupingExpr(expr);
      case "LiteralExpr":
        return this.evaluateLitteralExpr(expr);
      case "UnaryExpr":
        return this.evaluateUnaryExpr(expr);
      case "VariableExpr":
        return this.evaluateVariableExpr(expr);
      case "AssignExpr":
        return this.evaluateAssignExpr(expr);
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
