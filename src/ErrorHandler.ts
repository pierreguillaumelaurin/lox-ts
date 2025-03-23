class ErrorHandler {
  public hadError = false;

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
