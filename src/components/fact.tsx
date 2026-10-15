export function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <div className="min-w-0 text-sm text-muted">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
        {children}
      </div>
    </div>
  );
}
