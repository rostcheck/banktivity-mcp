import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStatement = {
  get: vi.fn(),
};
const mockDbInstance = {
  prepare: vi.fn().mockReturnValue(mockStatement),
  close: vi.fn(),
};

vi.mock("better-sqlite3", () => {
  return {
    default: class MockDatabase {
      constructor() {
        return mockDbInstance;
      }
    },
  };
});

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(() => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>displayCurrencyCode</key>
  <string>USD</string>
</dict>
</plist>`),
}));

import { DatabaseConnection } from "../src/connection.js";

describe("DatabaseConnection default currency", () => {
  beforeEach(() => {
    mockStatement.get.mockReset();
    mockStatement.get.mockImplementation((code?: string) => {
      if (code === "USD") return { id: 5 };
      return { id: 1 };
    });
  });

  it("returns the currency configured in StoreAttributes.plist", () => {
    const connection = new DatabaseConnection("/path/to/file.bank8");

    expect(connection.getDefaultCurrencyId()).toBe(5);
    expect(mockStatement.get).toHaveBeenCalledWith("USD");
  });
});
