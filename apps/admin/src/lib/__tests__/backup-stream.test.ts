import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { healBackupJson, ALL_TABLES } from "../backup";
import * as schema from "@pmg/db/schema";
import { isTable } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";

describe("backup stream formatting and self-healing", () => {
  it("heals malformed backup JSON missing the opening bracket", () => {
    const brokenJson = '{"version":1,"createdAt":"2026-09-09T09:57:36.000Z","tables":{"user":{"id":"u1","name":"Alice"}],"client_contact":{"id":"c1","name":"Bob"}],"empty_tbl":[]}}';

    // Normal JSON.parse should fail on the broken JSON
    expect(() => JSON.parse(brokenJson)).toThrow();

    // healBackupJson repairs the syntax
    const healed = healBackupJson(brokenJson);
    const parsed = JSON.parse(healed);

    expect(parsed.version).toBe(1);
    expect(parsed.tables.user).toEqual([{ id: "u1", name: "Alice" }]);
    expect(parsed.tables.client_contact).toEqual([{ id: "c1", name: "Bob" }]);
    expect(parsed.tables.empty_tbl).toEqual([]);
  });

  it("does not corrupt already valid backup JSON", () => {
    const validData = {
      version: 1,
      createdAt: "2026-09-09T09:57:36.000Z",
      tables: {
        user: [{ id: "u1", name: "Alice" }],
        organization: [{ id: "org1", name: "Org 1" }],
        empty_tbl: [],
      },
    };
    const validJson = JSON.stringify(validData);
    const result = healBackupJson(validJson);
    expect(JSON.parse(result)).toEqual(validData);
  });

  it("covers 100% of tables defined in database schema", () => {
    const schemaTableNames = new Set<string>();
    for (const exportVal of Object.values(schema)) {
      if (isTable(exportVal)) {
        schemaTableNames.add(getTableConfig(exportVal).name);
      }
    }

    expect(schemaTableNames.size).toBe(33);

    const missingTables = [...schemaTableNames].filter(
      (tableName) => !ALL_TABLES.includes(tableName),
    );

    expect(missingTables).toEqual([]);
    expect(ALL_TABLES.length).toBe(schemaTableNames.size);
  });
});
