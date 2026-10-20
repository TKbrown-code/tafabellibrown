import Hero from "@/sections/home/hero";
import About from "@/sections/home/about";
import Skills from "@/sections/home/skills";
import { Projects } from "@/sections/home/project";
import { Experience } from "@/sections/home/experience";
import { BlogPreview } from "@/sections/home/previewBlogs";
import { Contact } from "@/sections/home/contact";
import { Services } from "@/sections/home/services";
import { useTitle } from "@/components/shared/Layout";

export default function Home() {
  useTitle(
    undefined,
    "Full-stack web developer building fast, reliable products with React, TypeScript, Node.js and PostgreSQL. Explore Tafa Belli Brown's selected projects, case studies and development notes.",
  );

  return (
    <>
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
