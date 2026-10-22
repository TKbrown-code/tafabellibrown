import { useQuery } from "@tanstack/react-query";
import { site } from "@/data/site";
import type { Lang } from "@/data/site";
import { Beari } from "@/lib/api";

type LocalizedSetting =
  | "role"
  | "heroTitle"
  | "heroBody"
  | "aboutTitle"
  | "aboutBody1"
  | "aboutBody2"
  | "contactTitle"
  | "contactBody"
  | "location"
  | "educationDegree"
  | "educationSchool"
  | "educationPlace"
  | "educationPeriod";

type LocaleSuffix = "En" | "Fr" | "Zh" | "Es" | "Ar" | "Pcm";

export type SiteSettings = {
  name: string;
  email: string;
  github: string;
  linkedin: string;
  website: string;
  profileImagePath: string;
  profileImageUrl: string;
  resumePath?: string;
  resumeUrl?: string;
  resumeThumbnailPath?: string;
  resumeThumbnailUrl?: string;
  resumeContent?: {
    name: string;
    headline: string;
    email: string;
    location: string;
    summary: string;
    experience: string;
    education: string;
    skills: string;
  };
} & {
  [Key in `${LocalizedSetting}${LocaleSuffix}`]?: string;
};

// These values provide a loading fallback and initial public site content.
export const defaultSiteSettings: SiteSettings = {
  name: site.name,
  email: site.email,
  roleEn: site.role.en,
  roleZh: site.role.zh,
  heroTitleEn: "I build fast, reliable web products that ship.",
  heroTitleZh: "我打造快速、可靠的 Web 产品并让它们真正上线。",
  heroBodyEn: [
    "Full-stack developer working across React, TypeScript, Node.js and PostgreSQL.",
    "I've shipped three live platforms — and I care about the details that make them fast.",
  ].join(" "),
  heroBodyZh:
    "全栈开发者，熟练使用 React、TypeScript、Node.js 与 PostgreSQL。已独立交付三个上线平台，专注于让产品更快、更稳的每一个细节。",
  aboutTitleEn: "Developer, student, builder.",
  aboutTitleZh: "开发者、学生、实践者。",
  aboutBody1En: [
    "I'm an international Computer Science student at Liaoning University of Technology in China,",
    "and I've been building and deploying production web applications alongside my studies.",
  ].join(" "),
  aboutBody1Zh:
    "我是辽宁工业大学计算机科学专业的国际学生，在学习之余持续构建并部署生产级 Web 应用。",
  aboutBody2En: [
    "My strengths are API design, query optimization and front-end performance — the parts of a product",
    "users never see but always feel. I work remotely, communicate clearly,",
    "and like shipping in small, tested increments.",
  ].join(" "),
  aboutBody2Zh:
    "我擅长 API 设计、查询优化与前端性能——这些是用户看不见、却时刻能感受到的部分。我习惯远程协作、沟通清晰，喜欢以小步迭代、充分测试的方式交付。",
  github: site.github,
  linkedin: site.linkedin,
  website: "",
  locationEn: site.location.en,
  locationZh: site.location.zh,
  educationDegreeEn: site.education.degree.en,
  educationDegreeZh: site.education.degree.zh,
  educationSchoolEn: site.education.school.en,
  educationSchoolZh: site.education.school.zh,
  educationPlaceEn: site.education.place.en,
  educationPlaceZh: site.education.place.zh,
  educationPeriodEn: site.education.period.en,
  educationPeriodZh: site.education.period.zh,
  profileImagePath: "profile/tafa-profile.png",
  profileImageUrl:
    "/api/assets?bucket=site-assets&path=profile%2Ftafa-profile.png",
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      try {
        const response = await Beari.get("/settings");
        return response.data.data as Partial<SiteSettings>;
      } catch (error) {
        console.warn(
          "Could not load site settings; using default settings.",
          error,
        );
        return defaultSiteSettings;
      }
    },
    initialData: defaultSiteSettings,
    initialDataUpdatedAt: 0,
    staleTime: 300_000,
    select: (saved) => ({
      ...defaultSiteSettings,
      ...saved,
    }),
  });
}

export function pickSetting(
  settings: SiteSettings,
  english: keyof SiteSettings,
  chinese: keyof SiteSettings,
  language: Lang,
) {
  const localeKey =
    `${String(english).replace(/En$/, "")}${language[0].toUpperCase()}${language.slice(1)}` as keyof SiteSettings;

  // Prefer the selected language, then Chinese fallback, then English.
  return String(
    settings[localeKey] ||
      (language === "zh" ? settings[chinese] : undefined) ||
      settings[english] ||
      "",
  );
}
