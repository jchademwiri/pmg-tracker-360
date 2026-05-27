type Statements = Record<string, unknown>;

export function createAccessControl(_statement: Statements) {
  return {
    newRole(statements: Statements) {
      return { statements };
    },
  };
}
