import type RuntimeError from "RuntimeError";

class ErrorHandler {
  public hadRuntimeError = false;
  public hadError = false;

  runtimeError(error: RuntimeError) {
    this.report({ line: error.token.line, message: error.message });
    this.hadRuntimeError = true;
  }

  error(line: number, message: string) {
    this.report({ line, message });
    this.hadError = true;
  }

  private report({
    line,
    where,
    message,
  }: {
    line: number;
    message: string;
    where?: string;
  }) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
  }
}

export default ErrorHandler;
