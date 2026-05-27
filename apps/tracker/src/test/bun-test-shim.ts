const testGlobals = globalThis as typeof globalThis & {
  describe: jest.Describe;
  it: jest.It;
  test: jest.It;
  expect: jest.Expect;
  beforeAll: jest.Lifecycle;
  afterAll: jest.Lifecycle;
  beforeEach: jest.Lifecycle;
  afterEach: jest.Lifecycle;
};

export const describe = testGlobals.describe;
export const it = testGlobals.it;
export const test = testGlobals.test;
export const expect = testGlobals.expect;
export const beforeAll = testGlobals.beforeAll;
export const afterAll = testGlobals.afterAll;
export const beforeEach = testGlobals.beforeEach;
export const afterEach = testGlobals.afterEach;
