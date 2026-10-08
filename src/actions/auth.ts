"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signInSchema, signUpSchema, toFieldErrors, type FieldErrors } from "@/lib/validation";

export type AuthFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  values?: { name?: string; email?: string };
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Neteisingas el. paštas arba slaptažodis",
  USER_ALREADY_EXISTS: "Vartotojas su tokiu el. paštu jau egzistuoja",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Vartotojas su tokiu el. paštu jau egzistuoja",
  PASSWORD_TOO_SHORT: "Slaptažodis per trumpas",
  PASSWORD_TOO_LONG: "Slaptažodis per ilgas",
};

function authErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
    if (error.statusCode === 429) return "Per daug bandymų. Pabandyk po minutės.";
  }
  console.error("Auth error", error);
  return "Įvyko klaida. Pabandyk dar kartą.";
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error), values };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    return { error: authErrorMessage(error), values };
  }
  redirect("/");
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error), values };
  }

  try {
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    return { error: authErrorMessage(error), values };
  }
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    // Session may already be gone; still send the user to /login.
    console.error("Sign out error", error);
  }
  redirect("/login");
}
