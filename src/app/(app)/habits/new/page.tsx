import type { Metadata } from "next";
import { createHabitAction } from "@/actions/habits";
import { BackLink } from "@/components/back-link";
import { HabitForm } from "@/components/habit-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Naujas įprotis" };

export default function NewHabitPage() {
  return (
    <div className="max-w-2xl">
      <BackLink href="/habits">Įpročiai</BackLink>
      <PageHeader title="Naujas įprotis" />
      <Card>
        <CardContent>
          <HabitForm action={createHabitAction} submitLabel="Sukurti" />
        </CardContent>
      </Card>
    </div>
  );
}
