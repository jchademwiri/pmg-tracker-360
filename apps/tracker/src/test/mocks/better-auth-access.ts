type Statements = Record<string, unknown>;

export function createAccessControl() {
  return {
    newRole(statements: Statements) {
      return { statements };
    },
  };
}
