import { Link} from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { SEO } from "@/lib/seo";

export function NotFound() {
  const { t } = useI18n();
  return (
    <>
    <SEO title="Page not found | Tafa Belli Brown" description="The page you requested could not be found." path="/404" robots="noindex, nofollow" />
    <div className="container grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-3 text-4xl font-extrabold">{t("not_found")}</h1>
        <Link to="/" className="btn-primary mt-8">{t("back_home")}</Link>
      </div>
    </div>
    </>
  );
}
