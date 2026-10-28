import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Phase 2 data contract (source checks, not database execution)', () => {
  it('adds work/history/retry records without dropping legacy models', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    for (const model of ['Category', 'RelatedSystem', 'DevelopmentRequester', 'User',
      'AuthSession', 'Ticket', 'Attachment', 'PublicComment', 'InternalNote',
      'ActionTaken', 'ActionEvent', 'TicketWorkflowEvent', 'IdempotencyRecord']) {
      expect(schema).toContain(`model ${model} {`);
    }
    expect(schema).toContain('lastResolvedAt');
    expect(schema).toContain('enum ActionStatus');
  });
});
