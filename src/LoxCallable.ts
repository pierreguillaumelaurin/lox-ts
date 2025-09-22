import type { Interpreter } from "Interpreter";

export interface LoxCallable {
  call: (interpreter: Interpreter, args: unknown[]) => object;
  arity: number;
}
