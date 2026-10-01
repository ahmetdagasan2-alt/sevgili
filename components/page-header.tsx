export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="font-hand text-2xl text-primary">{eyebrow}</p> : null}
        <h1 className="text-3xl font-semibold text-rose-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
