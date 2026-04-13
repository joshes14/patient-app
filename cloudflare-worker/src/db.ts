export type Env = {
  patientapp: D1Database;
  CLINIC_PRACTITIONER_ID?: string;
  CLINIC_PASSWORD?: string;
  CLINIC_SESSION_SECRET?: string;
};

export const getDb = (env: Env): D1Database => env.patientapp;

export const dbAll = async <T>(db: D1Database, query: string, params: unknown[] = []): Promise<T[]> => {
  const result = await db.prepare(query).bind(...params).all<T>();
  return result.results ?? [];
};

export const dbFirst = async <T>(db: D1Database, query: string, params: unknown[] = []): Promise<T | null> => {
  const result = await db.prepare(query).bind(...params).first<T>();
  return result ?? null;
};

export type DbRunResult = D1Result & { changes: number };

export const dbRun = async (db: D1Database, query: string, params: unknown[] = []): Promise<DbRunResult> => {
  const result = await db.prepare(query).bind(...params).run();
  return Object.assign(result, { changes: result.meta.changes });
};
