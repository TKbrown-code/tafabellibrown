import { Head } from "vite-react-ssg";
import { DEFAULT_CANONICAL_ORIGIN } from "../../seo-config.mjs";

export const CANONICAL_ORIGIN = (import.meta.env.VITE_CANONICAL_ORIGIN || DEFAULT_CANONICAL_ORIGIN).replace(/\/$/, "");
export const DEFAULT_OG_IMAGE = `${CANONICAL_ORIGIN}/og-default.png`;

type SEOProps = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  robots?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

function within(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const clipped = normalized.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > max * 0.65 ? lastSpace : max - 1).trimEnd()}…`;
}

function absoluteImage(image?: string | null) {
  if (!image) return DEFAULT_OG_IMAGE;
  try {
    return new URL(image, CANONICAL_ORIGIN).toString();
  } catch {
    return DEFAULT_OG_IMAGE;
  }
}

export function SEO({ title, description, path, image, type = "website", robots = "index, follow, max-image-preview:large", structuredData }: SEOProps) {
  const pageTitle = within(title, 59);
  const pageDescription = within(description, 159);
  const canonical = new URL(path, CANONICAL_ORIGIN).toString();
  const socialImage = absoluteImage(image);
  const jsonLd = structuredData ? (Array.isArray(structuredData) ? structuredData : [structuredData]) : [];

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content="Tafa Belli Brown" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={socialImage} />
      <meta name="twitter:image:alt" content={pageTitle} />
      {jsonLd.map((schema, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">{JSON.stringify(schema)}</script>
      ))}
    </Head>
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, CANONICAL_ORIGIN).toString(),
    })),
  };
}
