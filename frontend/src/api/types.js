/**
 * @typedef {Object} ExpeditionLog
 * @property {number} id
 * @property {string} title
 * @property {string} planet_name
 * @property {string} system_name
 * @property {string} location
 * @property {string} mood
 * @property {'Exploration'|'Combat'|'Trade'|'Faction'|'Personal'} log_type
 * @property {string} raw_notes
 * @property {string} ai_narrative
 * @property {string[]} tags
 * @property {number|null} planet_id
 * @property {string} date UTC ISO 8601
 * @property {string} updated_at UTC ISO 8601
 * @property {string} stardate Cosmetic Earth year + 304, day of year
 * @typedef {{narrative:string, model:string, mode:'mock'|'live'}} Narrative
 * @typedef {{error:{code:string, message:string, details?:unknown}}} ErrorResponse
 */
export {};
