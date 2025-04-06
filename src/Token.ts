import TokenType from "./TokenType";

export type Token = {
  type: TokenType;
  lexeme: string;
  literal: unknown;
  line: number;
};
