"use client";

import { useActionState, useRef } from "react";
import { updateTimeZoneAction, type SettingsFormState } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: SettingsFormState = {};

export function TimeZoneForm({
  current,
  timeZones,
}: {
  current: string;
  timeZones: string[];
}) {
  const [state, action, pending] = useActionState(updateTimeZoneAction, initialState);
  const selectRef = useRef<HTMLSelectElement>(null);

  function applyBrowserZone() {
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (selectRef.current && timeZones.includes(browserZone)) {
      selectRef.current.value = browserZone;
    }
  }

  return (
    <form action={action} className="grid gap-3">
      <Label htmlFor="timezone">Laiko zona</Label>
      <select
        ref={selectRef}
        id="timezone"
        name="timezone"
        defaultValue={current}
        key={current}
        className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {timeZones.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <p className="text-sm text-muted-foreground">
        Pagal ją skaičiuojama, kada prasideda ir baigiasi diena.
      </p>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok && !pending ? <p className="text-sm text-muted-foreground">Išsaugota ✓</p> : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="h-10 flex-1" onClick={applyBrowserZone}>
          Naudoti naršyklės
        </Button>
        <Button type="submit" className="h-10 flex-1" disabled={pending}>
          {pending ? "Saugoma…" : "Išsaugoti"}
        </Button>
      </div>
    </form>
  );
}
