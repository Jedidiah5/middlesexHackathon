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
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-black">Theme explorer</h3>
        <p className="text-sm text-black/70">
          Filter globe markers by a{" "}
          <span className="font-medium text-accent">shared theme</span>. Click
          again to clear.
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
                  ? "border-accent bg-accent text-white shadow-sm"
                  : "border-black/15 bg-white text-black hover:border-black/30"
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
