// frontend/src/cosmodrag/cosmoDragDispatcher.js

// imports
import journalHandler from "./handlers/journalImportHandler.js";

// Internal registry of handlers
const handlers = [journalHandler];

/**
 * Register a new handler.
 * handler shape:
 * {
 *   id: string,
 *   canHandle: (payload, context) => boolean,
 *   handle: (payload, context) => void
 * }
 */
export function registerHandler(handler) {
  handlers.push(handler);
}

/**
 * Dispatch a payload to the first handler that can handle it.
 * For now: no priorities, no async guarantees.
 */
export function dispatch(payload, context) {
  console.log(payload, dispatch, "We have this these handlers: ", {registerHandler})
  for (const handler of handlers) {
    try {
      if (handler.canHandle(payload, context)) {
        return handler.handle(payload, context);
      }
    } catch (err) {
      // Keep it simple — swallow or log
      console.error(`Handler ${handler.id} failed`, err);
    }
  }
}
