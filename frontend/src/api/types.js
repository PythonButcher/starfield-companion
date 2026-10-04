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
/**
 * @typedef {{name:string,rank:1|2|3|4}} CrewSkill
 * @typedef {{id:number,name:string,role:string,faction:string,is_companion:boolean,skills:CrewSkill[],traits:string[],assigned_ship:string,assigned_outpost:string,affinity:string,notes:string,portrait_url:string,_sources:string[]}} CrewMember
 * @typedef {{member:CrewMember,score:number,reasons:{skill:string,rank:number,weight:number,points:number}[]}} CrewRecommendation
 */
/**
 * @typedef {{id:number,name:string,symbol:string,type:'organic'|'inorganic',rarity:string}} Resource
 * @typedef {Object} PlanetProfile
 * @property {number} id
 * @property {string} name
 * @property {string} system_name
 * @property {string} type
 * @property {number|null} gravity
 * @property {string} temperature
 * @property {string} atmosphere
 * @property {string} magnetosphere
 * @property {string} water
 * @property {string[]} biomes
 * @property {string[]} planetary_traits
 * @property {Resource[]} resources
 * @property {number|null} flora
 * @property {number|null} fauna
 * @property {string[]} hazards
 * @property {string} user_notes
 * @property {number} surveyed_percent
 * @property {boolean} favorite
 * @property {boolean} outpost_candidate
 * @property {boolean} approximate
 * @property {string[]} _sources
 */
