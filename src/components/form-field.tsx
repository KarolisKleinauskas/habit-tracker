import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = React.ComponentProps<typeof Input> & {
  name: string;
  label: string;
  error?: string;
};

/** Labelled input with an inline validation message. */
export function FormField({ name, label, error, id, ...inputProps }: FormFieldProps) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11 text-base"
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
