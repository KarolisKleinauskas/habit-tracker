import type { Metadata } from "next";
import { Suspense } from "react";
import { signOutAction } from "@/actions/auth";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimeZoneForm } from "@/components/timezone-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Nustatymai" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Nustatymai" />
      {/* CSS columns: cards stack per column without row-height gaps */}
      <div className="grid gap-4 *:break-inside-avoid md:block md:columns-2 md:*:mb-4">

        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}
        >
          <AccountSettings />
        </Suspense>
      </div>
    </>
  );
}

function listTimeZones(current: string): string[] {
  const zones = new Set(Intl.supportedValuesOf("timeZone"));
  zones.add("UTC");
  zones.add(current);
  return [...zones].sort();
}

async function AccountSettings() {
  const user = await requireUser();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Laiko zona</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeZoneForm current={user.timezone} timeZones={listTimeZones(user.timezone)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Paskyra</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="text-sm">
            <div className="font-medium">{user.name}</div>
            <div className="text-muted-foreground">{user.email}</div>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="h-10 w-full">
              Atsijungti
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
