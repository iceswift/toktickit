import { describe, expect, it } from 'vitest';
import { parseActionInput, permittedActionTransition } from '../../src/lab4/action-validation.js';

const create = { expectedTicketVersion: 1, assigneeUserId: 2, actionDateTime: '2026-10-28T09:00:00+07:00', description: '  Inspect laptop  ', followUpRequired: false };
describe('Lab4 Action input and transition rules', () => {
  it('normalizes strings and UTC dates without accepting a spoofed actor or status', () => {
    expect(parseActionInput('create', create)).toMatchObject({ expectedTicketVersion: 1,
      data: { description: 'Inspect laptop', result: '', followUpNote: '', attachmentNotes: '', actionDateTime: new Date('2026-10-28T02:00:00Z') } });
    for (const field of ['performedByUserId','ticketId','id','status','version','createdAt']) {
      expect(() => parseActionInput('create', { ...create, [field]: 1 })).toThrow();
    }
  });
  it.each(['2026-02-30T00:00:00Z','not a date','2026-10-28T09:00:00','2026-13-01T00:00:00Z'])(
    'rejects invalid/timezone-free date %s', actionDateTime => expect(() => parseActionInput('create', { ...create, actionDateTime })).toThrow());
  it.each([null, [], {}, { ...create, description: ' ' }, { ...create, description: 'x'.repeat(2001) },
    { ...create, followUpRequired: true }, { ...create, expectedTicketVersion: '1' }, { ...create, assigneeUserId: -1 }])(
    'rejects malformed or invalid create payload %#', value => expect(() => parseActionInput('create', value)).toThrow());
  it('requires a genuine editable subset and both versions; separate assign/status inputs', () => {
    const versions = { expectedVersion: 1, expectedTicketVersion: 2 };
    expect(parseActionInput('edit', { ...versions, result: ' done ' }).data.result).toBe('done');
    for (const value of [versions, { ...versions, status: 'COMPLETED' }, { ...versions, assigneeUserId: 4 }, { description: 'No versions' }]) {
      expect(() => parseActionInput('edit', value)).toThrow();
    }
    expect(parseActionInput('assign', { ...versions, assigneeUserId: 4 }).data.assigneeUserId).toBe(4);
    expect(parseActionInput('status', { ...versions, status: 'COMPLETED' }).data.status).toBe('COMPLETED');
  });
  for (const from of ['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'] as const) {
    for (const to of ['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'] as const) {
      it(`enforces Action transition ${from} -> ${to}`, () => {
        expect(permittedActionTransition(from,to)).toBe(from === 'PLANNED' && ['IN_PROGRESS','CANCELLED'].includes(to)
          || from === 'IN_PROGRESS' && ['COMPLETED','CANCELLED'].includes(to));
      });
    }
  }
});
