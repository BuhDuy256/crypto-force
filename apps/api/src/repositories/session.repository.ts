import { inArray } from 'drizzle-orm';
import type { Database } from '../database/client';
import { session } from '../database/schema/index';

interface SessionRecord {
  id: string;
  expiresAt: Date;
}

export interface SessionRepository {
  findByIds(ids: string[]): Promise<SessionRecord[]>;
}

export function createSessionRepository(db: Database): SessionRepository {
  return {
    async findByIds(ids) {
      if (ids.length === 0) return [];
      return db
        .select({ id: session.id, expiresAt: session.expiresAt })
        .from(session)
        .where(inArray(session.id, ids));
    },
  };
}
