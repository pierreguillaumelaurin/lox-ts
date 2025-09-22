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

  it("should handle logical expressions", () => {
    const code = `
      print true and false;
      print true or false;
      print false or true;
      print false and true;
      print 1 and 2;
      print nil and 2;
      print 1 or 2;
      print nil or 2;
    `;
    const output = runLoxCode(code);
    expect(output).toEqual([
      "false",
      "true",
      "true",
      "false",
      "2",
      "nil",
      "1",
      "2",
    ]);
  });

  it("should handle while loops", () => {
    const code = `
      var i = 0;
      while (i < 3) {
        print i;
        i = i + 1;
      }
    `;
    const output = runLoxCode(code);
    expect(output).toEqual(["0", "1", "2"]);
  });

  it("should handle for loops", () => {
    const code = `
      for (var i = 0; i < 3; i = i + 1) {
        print i;
      }
    `;
    const output = runLoxCode(code);
    expect(output).toEqual(["0", "1", "2"]);
  });
});
