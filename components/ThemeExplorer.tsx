"use client";

type ThemeExplorerProps = {
  themes: string[];
  activeTheme: string | null;
  onToggleTheme: (theme: string) => void;
};

export default function ThemeExplorer({
  themes,
  activeTheme,
  onToggleTheme,
}: ThemeExplorerProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-950">Theme explorer</h3>
        <p className="text-sm text-neutral-600">
          Filter globe markers by a shared theme. Click again to clear.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => {
          const active = activeTheme === theme;
          return (
            <button
              key={theme}
              type="button"
              onClick={() => onToggleTheme(theme)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                  : "border-neutral-300 bg-neutral-50 text-neutral-800 hover:border-neutral-400 hover:bg-white"
              }`}
            >
              {theme}
            </button>
          );
        })}
      </div>
    </section>
  );
}
