import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Image as ImageIcon, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useServices } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Reveal, Skeleton } from "@/components/shared/ui";

export function Services({ fullPage = false, initialCategory }: { fullPage?: boolean; initialCategory?: string }) {
  const { data = [], isLoading } = useServices();
  const { lang } = useI18n();
  const [activeCategory, setActiveCategory] = useState(initialCategory ?? "");
  const local = (service: (typeof data)[number], field: "category" | "subcategory" | "title" | "description" | "screenshot_alt") =>
    (service[`${field}_${lang}` as keyof typeof service] as string | null | undefined) || service[field];
  const categories = useMemo(() => {
    const groups = new Map<string, Map<string, typeof data>>();
    for (const service of data) {
      if (!groups.has(service.category)) groups.set(service.category, new Map());
      const subcategories = groups.get(service.category)!;
      if (!subcategories.has(service.subcategory)) subcategories.set(service.subcategory, []);
      subcategories.get(service.subcategory)!.push(service);
    }
    return [...groups.entries()];
  }, [data]);

  const selected = categories.find(([key]) => key === activeCategory) ?? categories[0];
  const selectedKey = selected?.[0] ?? "";
  const selectedItems = selected
    ? [...selected[1].entries()].flatMap(([subcategory, items]) => items.map((service) => ({ service, subcategory })))
    : [];
  const visibleItems = fullPage ? selectedItems : selectedItems.slice(0, 3);
  const categoryLabel = selectedItems[0] ? local(selectedItems[0].service, "category") : selectedKey;
  const totalCategories = categories.length;

  return (
    <section id="services" className="section border-t border-border">
      <div className="container">
        <Reveal>
          <p className="kicker">{({ en: "What I do", zh: "服务", fr: "Mes services", es: "Lo que hago", ar: "ما أقدمه", pcm: "Wetin I dey do" } as const)[lang]}</p>
          <h2 className="h-section">{({ en: "Services built around your goals.", zh: "从想法到上线产品。", fr: "Des services adaptés à vos objectifs.", es: "Servicios pensados para tus objetivos.", ar: "خدمات مصممة لتحقيق أهدافك.", pcm: "Services wey fit your goals." } as const)[lang]}</h2>
          <p className="mt-3 max-w-2xl text-muted">{({ en: "Explore services by category, with examples from real work.", zh: "按类别浏览我的服务和实际作品示例。", fr: "Découvrez mes services par catégorie avec des exemples de projets réels.", es: "Explora los servicios por categoría con ejemplos de trabajos reales.", ar: "تصفح الخدمات حسب الفئة مع أمثلة من أعمال فعلية.", pcm: "See my services by category, with examples from real work." } as const)[lang]}</p>
        </Reveal>

        {isLoading ? <div className="mt-8 grid gap-5 md:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div> : categories.length ? (
          <>
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface/70 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Layers3 className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{lang === "zh" ? "按类别浏览" : "Browse by category"}</p>
                  <p className="mt-0.5 text-xs text-muted">{lang === "zh" ? `共 ${totalCategories} 个类别，选择一个查看服务` : `${totalCategories} categories · choose one to see matching services`}</p>
                </div>
              </div>
              <label className="relative block w-full sm:max-w-xs">
                <span className="sr-only">{lang === "zh" ? "服务类别" : "Service category"}</span>
                <select value={selectedKey} onChange={(event) => setActiveCategory(event.target.value)} className="input appearance-none pr-10 font-medium" aria-label={lang === "zh" ? "服务类别" : "Service category"} data-testid="select-service-category">
                  {categories.map(([key, subcategories]) => {
                    const firstItem = [...subcategories.values()][0]?.[0];
                    const count = [...subcategories.values()].reduce((sum, items) => sum + items.length, 0);
                    return <option key={key} value={key}>{firstItem ? local(firstItem, "category") : key} · {count}</option>;
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </label>
            </div>

            {selected && <div className="mt-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">{lang === "zh" ? "所选类别" : "Selected category"}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">{categoryLabel}</h3>
                </div>
                <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">{lang === "zh" ? `${selectedItems.length} 项服务` : `${selectedItems.length} ${selectedItems.length === 1 ? "service" : "services"}`}</span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {visibleItems.map(({ service, subcategory }) => {
                  const imageUrl = service.screenshot_url ?? "";
                  return (
                    <article key={service.id} className="card group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lift">
                      {imageUrl ? <img src={imageUrl} alt={local(service, "screenshot_alt") || local(service, "title")} loading="lazy" className="aspect-[16/9] w-full border-b border-border bg-surface-2 object-cover transition-transform duration-300 group-hover:scale-[1.015]" /> : <div className="grid aspect-[16/9] place-items-center border-b border-border bg-gradient-to-br from-surface-2 to-surface text-faint"><ImageIcon className="h-8 w-8" aria-hidden="true" /></div>}
                      <div className="p-5 sm:p-6">
                        <span className="inline-flex rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">{local(service, "subcategory") || subcategory}</span>
                        <h4 className="mt-3 font-sans text-lg font-semibold tracking-tight">{local(service, "title")}</h4>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{local(service, "description")}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!fullPage && selectedItems.length > visibleItems.length && <p className="mt-4 text-center text-xs text-muted">{lang === "zh" ? `还有 ${selectedItems.length - visibleItems.length} 项服务` : `And ${selectedItems.length - visibleItems.length} more in this category`}</p>}
            </div>}
          </>
        ) : <p className="mt-8 text-sm text-muted">{({ en: "Services will appear here soon.", zh: "服务即将推出。", fr: "Les services apparaîtront ici bientôt.", es: "Los servicios aparecerán aquí pronto.", ar: "ستظهر الخدمات هنا قريبًا.", pcm: "Services go show here soon." } as const)[lang]}</p>}

        {!fullPage && categories.length > 0 && <div className="mt-8 flex justify-center"><Link to={`/services${selectedKey ? `?category=${encodeURIComponent(selectedKey)}` : ""}`} className="btn-ghost">{({ en: "Explore all services", zh: "查看所有服务", fr: "Découvrir tous les services", es: "Ver todos los servicios", ar: "استكشف جميع الخدمات", pcm: "See all services" } as const)[lang]}<ArrowRight className="h-4 w-4" /></Link></div>}
      </div>
    </section>
  );
}
