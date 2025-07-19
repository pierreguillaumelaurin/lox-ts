import * as fs from "fs";
import * as readline from "readline";
import { Scanner } from "./Scanner";
import Parser from "./Parser";
import ErrorHandler from "ErrorHandler";
import { Interpreter } from "Interpreter";

export default class Lox {
  private interpreter = new Interpreter();
  errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = new ErrorHandler();
  }

  main(args: string[]) {
    if (args.length > 1) {
      console.log("Usage: lox_ts [script]");
      process.exit(64);
    } else if (args.length === 1) {
      this.runFile(args[0] as string);
    } else {
      this.runPrompt();
    }
  }

  private runFile(filePath: string): void {
    try {
      const data = fs.readFileSync(filePath, { encoding: "utf-8" });
      this.run(data);
      if (this.errorHandler.hadError) {
        process.exit(65);
      }
      if (this.errorHandler.hadRuntimeError) {
        process.exit(70);
      }
    } catch (error) {
      console.error("Error reading file:", error);
      process.exit(1);
    }
  }

  private runPrompt(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt("> ");
    rl.prompt();

    rl.on("line", (line) => {
      this.run(line);
      this.errorHandler.hadError = false;
      rl.prompt();
    }).on("close", () => {
      console.log("Goodbye!");
      process.exit(0);
    });
  }

  private run(source: string): void {
    const scanner = new Scanner(source, this.errorHandler);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const expression = parser.parse();

    if (this.errorHandler.hadError) {
      return;
    }

    this.interpreter.interpret(expression);
  }
}
