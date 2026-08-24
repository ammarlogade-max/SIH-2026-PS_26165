/**
 * Environment variable validation
 * Called at startup to catch missing config early
 */
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GROQ_API_KEY",
  "OPENAI_API_KEY",
] as const;

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  return { valid: missing.length === 0, missing };
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`MISSING ENV VAR: ${key}`);
    return "";
  }
  return value;
}
