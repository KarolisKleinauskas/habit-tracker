"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction, type AuthFormState } from "@/actions/auth";
import { FormError, FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prisijungimas</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4" noValidate>
          <FormError message={state.error} />
          <FormField
            name="email"
            type="email"
            label="El. paštas"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.values?.email}
            error={state.fieldErrors?.email}
          />
          <FormField
            name="password"
            type="password"
            label="Slaptažodis"
            autoComplete="current-password"
            required
            error={state.fieldErrors?.password}
          />
          <Button type="submit" size="lg" className="h-11 text-base" disabled={pending}>
            {pending ? "Jungiamasi…" : "Prisijungti"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Neturi paskyros?&nbsp;
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Registruokis
        </Link>
      </CardFooter>
    </Card>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    (prev: AuthFormState, formData: FormData) => {
      // Default the user's time zone to the browser's; it can be changed in settings.
      formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
      return signUpAction(prev, formData);
    },
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registracija</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4" noValidate>
          <FormError message={state.error} />
          <FormField
            name="name"
            label="Vardas"
            autoComplete="given-name"
            required
            defaultValue={state.values?.name}
            error={state.fieldErrors?.name}
          />
          <FormField
            name="email"
            type="email"
            label="El. paštas"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.values?.email}
            error={state.fieldErrors?.email}
          />
          <FormField
            name="password"
            type="password"
            label="Slaptažodis"
            autoComplete="new-password"
            minLength={8}
            required
            error={state.fieldErrors?.password}
          />
          <Button type="submit" size="lg" className="h-11 text-base" disabled={pending}>
            {pending ? "Kuriama…" : "Sukurti paskyrą"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Jau turi paskyrą?&nbsp;
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Prisijunk
        </Link>
      </CardFooter>
    </Card>
  );
}
