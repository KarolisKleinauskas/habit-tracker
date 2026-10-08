"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteHabitAction } from "@/actions/habits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteHabitButton({
  habitId,
  habitName,
  compact = false,
}: {
  habitId: string;
  habitName: string;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon-lg" aria-label={`Ištrinti „${habitName}“`}>
            <Trash2 />
          </Button>
        ) : (
          <Button variant="destructive" className="h-10 w-full">
            <Trash2 /> Ištrinti visam laikui
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ištrinti „{habitName}“?</AlertDialogTitle>
          <AlertDialogDescription>
            Bus ištrinta ir visa šio įpročio istorija. To atšaukti negalima. Jei nori tik paslėpti
            įprotį, geriau jį archyvuok.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Atšaukti</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(() => deleteHabitAction(habitId));
            }}
          >
            {pending ? "Trinama…" : "Ištrinti"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
