import journalHandler from './handlers/journalImportHandler';
const handlers = [journalHandler];
export function registerHandler(handler) { handlers.unshift(handler); }
export async function dispatch(payload, context = {}) {
  const handler = handlers.find((candidate) => candidate.canHandle(payload, context));
  if (!handler) throw new Error('This drop format is not supported.');
  return handler.handle(payload, context);
}
