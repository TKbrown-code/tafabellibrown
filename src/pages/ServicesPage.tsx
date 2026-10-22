import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Services } from "@/sections/home/services";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/lib/seo";

export function ServicesPage() {
  const { lang } = useI18n();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const pageTitle = ({ en: "Services", zh: "服务", fr: "Services", es: "Servicios", ar: "الخدمات", pcm: "Services" } as const)[lang];
  const backLabel = ({ en: "Back to home", zh: "返回首页", fr: "Retour à l’accueil", es: "Volver al inicio", ar: "العودة إلى الصفحة الرئيسية", pcm: "Back to home" } as const)[lang];
  const description = ({ en: "Explore Tafa's web development services and examples from real projects.", zh: "浏览 Tafa 的 Web 开发服务和真实项目案例。", fr: "Découvrez les services web de Tafa et des exemples de projets réels.", es: "Explora los servicios web de Tafa y ejemplos de proyectos reales.", ar: "استكشف خدمات تطوير الويب لدى Tafa وأمثلة من مشاريع فعلية.", pcm: "See Tafa web services with examples from real projects." } as const)[lang];
  return <><SEO title={`${pageTitle} | Tafa Belli Brown`} description={description} path="/services" /><h1 className="sr-only">{pageTitle}</h1><div className="container pt-8"><Link to="/" state={{ scrollTo: "services" }} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> {backLabel}</Link></div><Services fullPage initialCategory={category} /></>;
}
