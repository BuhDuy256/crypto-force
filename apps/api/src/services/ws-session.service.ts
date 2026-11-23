import type { SessionRepository } from '../repositories/session.repository';

export interface ActiveWsSession {
  sessionId: string;
  expiresAt: number;
}

export interface WsSessionService {
  findExpiredInMemory(active: ActiveWsSession[]): string[];
  findExpiredOrRevoked(active: ActiveWsSession[]): Promise<string[]>;
}

export function createWsSessionService({
  sessionRepository,
  now,
}: {
  sessionRepository: SessionRepository;
  now: () => number;
}): WsSessionService {
  return {
    findExpiredInMemory(active) {
      const current = now();
      return [
        ...new Set(active.filter((item) => item.expiresAt <= current).map((i) => i.sessionId)),
      ];
    },
    async findExpiredOrRevoked(active) {
      if (active.length === 0) return [];
      const uniqueIds = [...new Set(active.map((item) => item.sessionId))];
      const rows = await sessionRepository.findByIds(uniqueIds);
      const current = now();
      const validIds = new Set(
        rows.filter((row) => row.expiresAt.getTime() > current).map((row) => row.id),
      );
      return uniqueIds.filter((id) => !validIds.has(id));
    },
  };
}
