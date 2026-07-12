import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en el entorno.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const sql = readFileSync(
  "prisma/migrations/20260707143938_init/migration.sql",
  "utf-8",
);

const withoutComments = sql
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");

const statements = withoutComments
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Encontradas ${statements.length} sentencias SQL.`);

for (const statement of statements) {
  console.log("Ejecutando:", statement.slice(0, 60).replace(/\n/g, " "), "...");
  await client.execute(statement);
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%'",
);
console.log(
  "Tablas creadas:",
  tables.rows.map((r) => r.name),
);

client.close();
