import Hero from "@/sections/home/hero";
import About from "@/sections/home/about";
import Skills from "@/sections/home/skills";
import { Projects } from "@/sections/home/project";
import { Experience } from "@/sections/home/experience";
import { BlogPreview } from "@/sections/home/previewBlogs";
import { Contact } from "@/sections/home/contact";
import { Services } from "@/sections/home/services";
import { SEO, CANONICAL_ORIGIN } from "@/lib/seo";

export default function Home() {
  const description = "Full-stack web developer building fast, reliable products with React, TypeScript, Node.js and PostgreSQL. Explore selected projects, case studies and development notes.";

  return (
    <>
      <SEO title="Tafa Belli Brown | Full-Stack Web Developer" description={description} path="/" structuredData={[
        {
          "@context": "https://schema.org",
          "@type": "Person",
          "@id": `${CANONICAL_ORIGIN}/#person`,
          name: "Tafa Belli Brown",
          url: CANONICAL_ORIGIN,
          jobTitle: "Full-Stack Web Developer",
          address: { "@type": "PostalAddress", addressLocality: "Jinzhou", addressRegion: "Liaoning", addressCountry: "CN" },
          sameAs: ["https://github.com/TKbrown-code", "https://www.linkedin.com/in/tafabilly"],
          knowsAbout: ["Full-stack web development", "React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Supabase", "Redis", "Web performance"],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${CANONICAL_ORIGIN}/#website`,
          url: CANONICAL_ORIGIN,
          name: "Tafa Belli Brown",
          description: "Portfolio of Tafa Belli Brown, a full-stack web developer.",
          inLanguage: ["en", "zh", "fr", "es", "ar"],
          publisher: { "@id": `${CANONICAL_ORIGIN}/#person` },
        },
      ]} />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Services />
      <Experience />
      <BlogPreview />
      <Contact />
    </>
  );
}
