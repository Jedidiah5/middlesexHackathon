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
    <section className="glass-card rounded-2xl p-4 lg:p-6">
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
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                active
                  ? "border border-accent bg-accent text-white shadow-sm"
                  : "glass-chip border-black/10 text-black hover:border-black/20"
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
