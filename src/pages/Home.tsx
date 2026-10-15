import Hero from "@/sections/home/hero";
import About from "@/sections/home/about";
import Skills from "@/sections/home/skills";
import { Projects } from "@/sections/home/project";
import { Experience } from "@/sections/home/experience";
import { BlogPreview } from "@/sections/home/previewBlogs";
import { Contact } from "@/sections/home/contact";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <BlogPreview />
      <Contact />
    </>
  );
}
