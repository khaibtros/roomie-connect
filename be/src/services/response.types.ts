/**
 * Response Type Enum — Standardised pipeline outcome labels.
 *
 * Business rule:  SYSTEM_ERROR is ONLY for genuine exceptions (DB crash,
 *                 unexpected throws).  Every other "no data" or "user error"
 *                 scenario has its own explicit type.
 *
 * KnockCoin rule: only DB_SUCCESS and LLM_SUCCESS result in a charge.
 */

export const ResponseType = {
  /** Input failed validation (empty, too long, malformed). */
  VALIDATION: "VALIDATION",
  /** Location is outside supported area (Thạch Hòa / Tân Xã). */
  OUT_OF_SCOPE: "OUT_OF_SCOPE",
  /** DB query returned results — user receives tangible value. */
  DB_SUCCESS: "DB_SUCCESS",
  /** DB query returned zero rows — NOT an error. */
  DB_EMPTY: "DB_EMPTY",
  /** LLM generated a meaningful answer (GENERAL_QA / SMALL_TALK). */
  LLM_SUCCESS: "LLM_SUCCESS",
  /** Bot asks user for more info before querying (e.g. roommate criteria). */
  CLARIFICATION: "CLARIFICATION",
  /** Real exception: DB crash, unexpected throw, LLM connection failure. */
  SYSTEM_ERROR: "SYSTEM_ERROR",
} as const;

export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];

/** Response types that result in a KnockCoin deduction. */
export const CHARGEABLE_TYPES: ReadonlySet<ResponseType> = new Set([
  ResponseType.DB_SUCCESS,
  ResponseType.LLM_SUCCESS,
]);

/** Response types that count as a used turn (including free ones that still consume the quota). */
export const COUNTABLE_TYPES: ReadonlySet<ResponseType> = new Set([
  ResponseType.DB_SUCCESS,
  ResponseType.LLM_SUCCESS,
  ResponseType.DB_EMPTY, // No coin charged, but still uses a free-chat slot
]);

/** Response types that are explicitly FREE and don't consume any quota. */
export const FREE_TYPES: ReadonlySet<ResponseType> = new Set([
  ResponseType.VALIDATION,
  ResponseType.OUT_OF_SCOPE,
  ResponseType.CLARIFICATION,
  ResponseType.SYSTEM_ERROR,
]);
