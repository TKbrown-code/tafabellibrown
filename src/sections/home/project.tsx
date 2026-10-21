import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProjects } from "@/lib/api";
import { Reveal, Skeleton } from "@/components/shared/ui";
import { ProjectCard } from "@/sections/home/projectCards";

export function Projects() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useProjects();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: lang === "ar" ? "rtl" : "ltr",
    align: "start",
    loop: false,
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateCarousel = useCallback(() => {
    if (!emblaApi) return;

    setSelectedIndex(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    updateCarousel();

    emblaApi.on("select", updateCarousel);
    emblaApi.on("reInit", updateCarousel);

    return () => {
      emblaApi.off("select", updateCarousel);
      emblaApi.off("reInit", updateCarousel);
    };
  }, [emblaApi, updateCarousel, data]);

  return (
    <section
      id="projects"
      className="section border-t border-border bg-surface/50"
    >
      <div className="container">
        <Reveal>
          <p className="kicker">{t("projects_kicker")}</p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="h-section">{t("projects_title")}</h2>

            {!isLoading && (data?.length ?? 0) > 1 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => emblaApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                  aria-label="Previous project"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className={`h-5 w-5 ${lang === "ar" ? "rtl-mirror" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={() => emblaApi?.scrollNext()}
                  disabled={!canScrollNext}
                  aria-label="Next project"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowRight className={`h-5 w-5 ${lang === "ar" ? "rtl-mirror" : ""}`} />
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {isLoading ? (
          <div className="mt-12 space-y-8">
            {[1, 2].map((k) => (
              <Skeleton key={k} className="h-80" />
            ))}
          </div>
        ) : (data?.length ?? 0) > 0 ? (
          <div className="mt-12">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex touch-pan-y">
                {data?.map((project, index) => (
                  <div
                    key={project.id}
                    className="min-w-0 flex-[0_0_100%]"
                  >
                    <ProjectCard p={project} index={index} />
                  </div>
                ))}
              </div>
            </div>

            {snapCount > 1 && (
              <div
                className="mt-6 flex items-center justify-center gap-1"
                aria-label="Choose a project"
              >
                {Array.from({ length: snapCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`Go to project ${index + 1}`}
                    aria-current={
                      selectedIndex === index ? "true" : undefined
                    }
                    className="grid h-11 w-11 place-items-center rounded-full focus-visible:outline-accent"
                  ><span className={`h-2.5 rounded-full border transition-all duration-300 ${selectedIndex === index ? "w-6 border-accent bg-accent" : "w-2.5 border-border bg-border hover:border-accent"}`} /></button>
                ))}
              </div>
            )}

          </div>
        ) : (
          <p className="mt-12 text-muted">No projects available yet.</p>
        )}
      </div>
    </section>
  );
}
