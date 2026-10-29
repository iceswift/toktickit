import { ActionStatus } from '@prisma/client';

export class ActionFailure extends Error {
  constructor(public readonly status: number, public readonly code: string,
    public readonly fields: Record<string,string> = {}) { super(code); }
}
export const badInput = (field: string, message = 'Choose a valid value.'): never => {
  throw new ActionFailure(400, 'VALIDATION_ERROR', { [field]: message });
};
export function positive(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) return badInput(name);
  return value;
}
function date(value: unknown): Date {
  if (typeof value !== 'string') return badInput('actionDateTime');
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match) return badInput('actionDateTime','Use a timezone-qualified ISO date/time.');
  const [y,m,d,h,min,s] = match.slice(1).map(Number);
  const calendar = new Date(Date.UTC(y,m-1,d));
  const result = new Date(value);
  if (calendar.getUTCFullYear() !== y || calendar.getUTCMonth() !== m-1 || calendar.getUTCDate() !== d
      || h > 23 || min > 59 || s > 59 || !Number.isFinite(result.getTime())) return badInput('actionDateTime');
  return result;
}
const editable = ['actionDateTime','description','result','followUpRequired','followUpNote','attachmentNotes'];
export function parseActionInput(mode: 'create'|'edit'|'assign'|'status', body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return badInput('body');
  const input = body as Record<string,unknown>;
  const dataKeys = mode === 'assign' ? ['assigneeUserId'] : mode === 'status' ? ['status']
    : [...editable, ...(mode === 'create' ? ['assigneeUserId'] : [])];
  const allowed = [...dataKeys,'expectedTicketVersion', ...(mode !== 'create' ? ['expectedVersion'] : [])];
  if (Object.keys(input).some(key => !allowed.includes(key))) return badInput('body','Unknown or immutable fields are not accepted.');
  const expectedTicketVersion = positive(input.expectedTicketVersion,'expectedTicketVersion');
  const expectedVersion = mode === 'create' ? undefined : positive(input.expectedVersion,'expectedVersion');
  const data: { actionDateTime?: Date; description?: string; result?: string; followUpRequired?: boolean;
    followUpNote?: string; attachmentNotes?: string; assigneeUserId?: number; status?: ActionStatus } = {};
  for (const field of dataKeys) {
    let value = input[field];
    if (value === undefined && mode !== 'create') continue;
    if (field === 'actionDateTime') data.actionDateTime = date(value);
    else if (field === 'assigneeUserId') data.assigneeUserId = positive(value,field);
    else if (field === 'status') {
      if (typeof value !== 'string' || !Object.values(ActionStatus).includes(value as ActionStatus)) return badInput(field);
      data.status = value as ActionStatus;
    } else if (field === 'followUpRequired') {
      if (typeof value !== 'boolean') return badInput(field);
      data.followUpRequired = value;
    } else {
      if (value === undefined && mode === 'create' && field !== 'description') value = '';
      if (typeof value !== 'string' || value.trim().length > 2000 || (field === 'description' && !value.trim())) return badInput(field);
      (data as Record<string,unknown>)[field] = value.trim();
    }
  }
  if (!Object.keys(data).length) return badInput('body','Supply at least one mutable field.');
  if (data.followUpRequired && mode === 'create' && !data.followUpNote) return badInput('followUpNote');
  return { data, expectedTicketVersion, expectedVersion };
}
export function permittedActionTransition(from: ActionStatus, to: ActionStatus) {
  return from === 'PLANNED' && (to === 'IN_PROGRESS' || to === 'CANCELLED')
    || from === 'IN_PROGRESS' && (to === 'COMPLETED' || to === 'CANCELLED');
}
