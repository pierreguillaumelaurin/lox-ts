import type { Token } from "./Token.ts";

type BinaryExpr = { type: "Binary"; left: Expr; operator: Token; right: Expr };
export type Expr = BinaryExpr;
