/**
 * Arabic label lookups for the audit log (P2-19).
 *
 * Audit entries are keyed by technical identifiers (dotted action codes,
 * camelCase field names, raw enum values) so the underlying data stays
 * stable. This module translates those identifiers into the Arabic labels
 * a non-technical user recognises, via messages/ar.json ("auditLog.actions",
 * "auditLog.fields", "auditLog.values"). Unknown identifiers fall back to
 * the raw key rather than throwing, since static mock/future data may
 * introduce values not yet catalogued here.
 */

type Translator = (key: string) => string;

export function getAuditActionLabel(t: Translator, action: string): string {
  return translateOrFallback(t, `actions.${action}`, action);
}

export function getAuditFieldLabel(t: Translator, field: string): string {
  return translateOrFallback(t, `fields.${field}`, field);
}

export function getAuditValueLabel(t: Translator, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return translateOrFallback(t, `values.${value}`, String(value));
  const raw = String(value);
  return translateOrFallback(t, `values.${raw}`, raw);
}

function translateOrFallback(t: Translator, key: string, fallback: string): string {
  try {
    const label = t(key);
    // next-intl returns the key itself (or wraps it) when a message is missing.
    if (!label || label === key) return fallback;
    return label;
  } catch {
    return fallback;
  }
}
