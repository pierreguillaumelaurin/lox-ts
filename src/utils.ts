export const assertUnreachable = (_impossibleCase: never): never => {
  throw new Error("Unreachable case");
};
