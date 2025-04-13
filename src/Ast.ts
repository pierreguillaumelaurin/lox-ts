import type { Token } from "./Token.ts";

export type BinaryExpr = {
  type: "BinaryExpr";
  left: Expr;
  operator: Token;
  right: Expr;
};
export type GroupingExpr = { type: "GroupingExpr"; expression: Expr };
export type CallExpr = {
  type: "CallExpr";
  callee: Expr;
  paren: Token;
  arguments: Expr[];
};
export type LiteralExpr = { type: "LiteralExpr"; value: unknown };
export type LogicalExpr = {
  type: "LogicalExpr";
  left: Expr;
  operator: Token;
  right: Expr;
};
export type UnaryExpr = { type: "UnaryExpr"; operator: Token; right: Expr };
export type VariableExpr = { type: "VariableExpr"; name: Token };
export type AssignExpr = { type: "AssignExpr"; name: Token; value: Expr };
export type GetExpr = { type: "GetExpr"; name: Token; object: Expr };
export type SetExpr = {
  type: "SetExpr";
  object: Expr;
  name: Token;
  value: Expr;
};
export type ThisExpr = { type: "ThisExpr"; keyword: Token };
export type SuperExpr = { type: "SuperExpr"; keyword: Token; method: Token };

export type Expr =
  | BinaryExpr
  | GroupingExpr
  | LiteralExpr
  | UnaryExpr
  | VariableExpr
  | AssignExpr
  | LogicalExpr
  | CallExpr
  | GetExpr
  | SetExpr
  | ThisExpr
  | SuperExpr;
