import Database from "better-sqlite3";
import path from "path";
import { readFileSync } from "node:fs";

/**
 * Database connection wrapper
 */
export class DatabaseConnection {
  private db: Database.Database;
  private bankFilePath: string;

  constructor(bankFilePath: string, readonly = false) {
    this.bankFilePath = bankFilePath;
    const dbPath = path.join(bankFilePath, "StoreContent", "core.sql");
    this.db = new Database(dbPath, { readonly });
  }

  /**
   * Get the underlying database instance
   */
  get instance(): Database.Database {
    return this.db;
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get the database's configured home currency ID
   */
  getDefaultCurrencyId(): number | null {
    let currencyCode: string | null = null;

    try {
      const attributesPath = path.join(this.bankFilePath, "StoreAttributes.plist");
      const attributes = readFileSync(attributesPath, "utf8");
      const match = attributes.match(
        /<key>(?:homeCurrency|displayCurrencyCode)<\/key>\s*<string>([^<]+)<\/string>/
      );
      currencyCode = match?.[1] ?? null;
    } catch {
      currencyCode = null;
    }

    if (currencyCode) {
      const sql = `SELECT Z_PK as id FROM ZCURRENCY WHERE ZPCODE = ?`;
      const row = this.db.prepare(sql).get(currencyCode) as
        | { id: number }
        | undefined;
      if (row?.id !== undefined) return row.id;
    }

    const sql = `SELECT Z_PK as id FROM ZCURRENCY LIMIT 1`;
    const row = this.db.prepare(sql).get() as { id: number } | undefined;
    return row?.id ?? null;
  }

  /**
   * Get currency ID by code
   */
  getCurrencyIdByCode(code: string): number | null {
    const sql = `SELECT Z_PK as id FROM ZCURRENCY WHERE ZPCODE = ?`;
    const row = this.db.prepare(sql).get(code) as { id: number } | undefined;
    return row?.id ?? null;
  }

  /**
   * Get transaction type ID by name
   */
  getTransactionTypeId(typeName: string): number | null {
    const sql = `SELECT Z_PK as id FROM ZTRANSACTIONTYPE WHERE ZPNAME = ? OR ZPSHORTNAME = ?`;
    const row = this.db.prepare(sql).get(typeName, typeName) as { id: number } | undefined;
    return row?.id ?? null;
  }
}
