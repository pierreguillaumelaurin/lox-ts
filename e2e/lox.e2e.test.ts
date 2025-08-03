import { describe, it, expect } from "vitest";
import Lox from "../src/Lox";

const runLoxCode = (code: string): string[] => {
  const lox = new Lox();
  const output: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    output.push(args.map(String).join(" "));
  };

  lox.run(code);

  console.log = originalLog;
  return output;
};

describe("Lox E2E", () => {
  it("should handle variable declaration", () => {
    const code = "var a = 1; print a;";
    const output = runLoxCode(code);
    expect(output).toEqual(["1"]);
  });

  it("should handle variable assignment", () => {
    const code = "var a = 1; a = 2; print a;";
    const output = runLoxCode(code);
    expect(output).toEqual(["2"]);
  });

  it("should handle arithmetic operations", () => {
    const code = "print 1 + 2 * 3 - 4 / 2;";
    const output = runLoxCode(code);
    expect(output).toEqual(["5"]);
  });

  it("should handle scoping", () => {
    const code = `
      var a = "global a";
      var b = "global b";
      var c = "global c";
      {
        var a = "outer a";
        var b = "outer b";
        {
          var a = "inner a";
          print a;
          print b;
          print c;
        }
        print a;
        print b;
        print c;
      }
      print a;
      print b;
      print c;
    `;
    const output = runLoxCode(code);
    expect(output).toEqual([
      "inner a",
      "outer b",
      "global c",
      "outer a",
      "outer b",
      "global c",
      "global a",
      "global b",
      "global c",
    ]);
  });
});
