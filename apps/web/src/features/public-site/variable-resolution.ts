import type { PublishedSitePayload, PublicVariant } from "./types";

const VARIABLE_TOKEN_PATTERN = /\{\{([a-zA-Z0-9_-]+)\}\}/g;

export type VariableValueMap = Map<string, string>;

export function buildVariableValueMap(
  payload: Pick<PublishedSitePayload, "variables">,
  variant: PublicVariant | null,
): VariableValueMap {
  const values = new Map<string, string>();

  for (const variable of payload.variables) {
    const variantValue = variant?.variableValues[variable.id];
    values.set(variable.id, variantValue && variantValue.trim().length > 0 ? variantValue : variable.defaultValue);
  }

  return values;
}

export function resolveVariables(value: string, values: VariableValueMap): string {
  if (!value.includes("{{")) {
    return value;
  }

  return value.replace(VARIABLE_TOKEN_PATTERN, (_match, variableId: string) => values.get(variableId) ?? "");
}

export function resolveUrl(value: string, values: VariableValueMap): string | null {
  const resolved = resolveVariables(value, values).trim();

  try {
    const url = new URL(resolved);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
