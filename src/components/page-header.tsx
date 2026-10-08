export function PageHeader({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        {description ? (
          <p className="text-sm text-muted-foreground first-letter:uppercase">{description}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}
