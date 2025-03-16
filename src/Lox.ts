import * as fs from "fs";
import * as readline from "readline";

export default class Lox {
  static main(args: string[]) {
    if (args.length > 1) {
      console.log("Usage: lox_ts [script]");
      process.exit(64);
    } else if (args.length === 1) {
      this.runFile(args[0] as string);
    } else {
      this.runPrompt();
    }
  }

  private static runFile(filePath: string): void {
    try {
      const data = fs.readFileSync(filePath, { encoding: "utf-8" });
      this.run(data);
    } catch (error) {
      console.error("Error reading file:", error);
      process.exit(1);
    }
  }

  private static runPrompt(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt("> ");
    rl.prompt();

    rl.on("line", (line) => {
      this.run(line);
      rl.prompt();
    }).on("close", () => {
      console.log("Goodbye!");
      process.exit(0);
    });
  }

  private static run(source: string): void {
    console.log("Executing:", source);
  }
}
