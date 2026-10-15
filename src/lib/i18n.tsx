import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang, L } from "@/data/site";
import { safeStorage } from "./storage";

const dict = {
  nav_about: { en: "About", zh: "关于" },
  nav_skills: { en: "Skills", zh: "技能" },
  nav_projects: { en: "Projects", zh: "项目" },
  nav_experience: { en: "Experience", zh: "经历" },
  nav_blog: { en: "Blog", zh: "博客" },
  nav_contact: { en: "Contact", zh: "联系" },
  available: { en: "Available for remote work worldwide", zh: "可接受全球远程工作" },
  hero_title_1: { en: "I build fast, reliable", zh: "我打造快速、可靠的" },
  hero_title_2: { en: "web products", zh: "Web 产品" },
  hero_title_3: { en: "that ship.", zh: "并让它们真正上线。" },
  hero_body: {
    en: "Full-stack developer working across React, TypeScript, Node.js and PostgreSQL. I've shipped three live platforms — and I care about the details that make them fast.",
    zh: "全栈开发者，熟练使用 React、TypeScript、Node.js 与 PostgreSQL。已独立交付三个上线平台，专注于让产品更快、更稳的每一个细节。",
  },
  cta_projects: { en: "View projects", zh: "查看项目" },
  cta_resume: { en: "Download résumé", zh: "下载简历" },
  cta_contact: { en: "Get in touch", zh: "联系我" },
  about_kicker: { en: "About", zh: "关于我" },
  about_title: { en: "Developer, student, builder.", zh: "开发者、学生、实践者。" },
  about_p1: {
    en: "I'm an international Computer Science student at Liaoning University of Technology in China, and I've been building and deploying production web applications alongside my studies.",
    zh: "我是辽宁工业大学计算机科学专业的国际学生，在学习之余持续构建并部署生产级 Web 应用。",
  },
  about_p2: {
    en: "My strengths are API design, query optimization and front-end performance — the parts of a product users never see but always feel. I work remotely, communicate clearly, and like shipping in small, tested increments.",
    zh: "我擅长 API 设计、查询优化与前端性能——这些是用户看不见、却时刻能感受到的部分。我习惯远程协作、沟通清晰，喜欢以小步迭代、充分测试的方式交付。",
  },
  languages: { en: "Languages", zh: "语言能力" },
  based_in: { en: "Based in", zh: "所在地" },
  education: { en: "Education", zh: "教育背景" },
  skills_kicker: { en: "Toolkit", zh: "技术栈" },
  skills_title: { en: "The stack I ship with.", zh: "我日常使用的技术栈。" },
  cat_frontend: { en: "Frontend", zh: "前端" },
  cat_backend: { en: "Backend", zh: "后端" },
  cat_data: { en: "Databases & ORMs", zh: "数据库与 ORM" },
  cat_devops: { en: "DevOps & Tools", zh: "DevOps 与工具" },
  cat_testing: { en: "Testing", zh: "测试" },
  methodologies: { en: "Ways of working", zh: "工作方式" },
  projects_kicker: { en: "Selected work", zh: "精选项目" },
  projects_title: { en: "Live products, real users.", zh: "真实上线，真实用户。" },
  read_case: { en: "Read case study", zh: "阅读案例" },
  visit_site: { en: "Visit live site", zh: "访问网站" },
  experience_kicker: { en: "Experience", zh: "工作经历" },
  experience_title: { en: "Where I've been building.", zh: "我的实践经历。" },
  blog_kicker: { en: "Writing", zh: "文章" },
  blog_title: { en: "Notes from the build.", zh: "开发笔记。" },
  all_posts: { en: "All posts", zh: "全部文章" },
  min_read: { en: "min read", zh: "分钟阅读" },
  contact_kicker: { en: "Contact", zh: "联系方式" },
  contact_title: { en: "Let's build something together.", zh: "一起做点有意思的东西吧。" },
  contact_body: {
    en: "Open to remote full-time roles, internships and freelance projects. I usually reply within a day.",
    zh: "欢迎远程全职、实习及自由职业项目合作，通常一天内回复。",
  },
  f_name: { en: "Name", zh: "姓名" },
  f_email: { en: "Email", zh: "邮箱" },
  f_subject: { en: "Subject", zh: "主题" },
  f_message: { en: "Message", zh: "留言" },
  f_send: { en: "Send message", zh: "发送留言" },
  f_sending: { en: "Sending…", zh: "发送中…" },
  f_sent: { en: "Thank you for reaching out. I'll review your message and get back to you as soon as possible.", zh: "感谢您与我联系。我会查看您的留言，并尽快回复。" },
  f_error: { en: "Something went wrong. Please email me directly.", zh: "发送失败，请直接发送邮件联系我。" },
  f_required: { en: "Required", zh: "必填" },
  f_invalid_email: { en: "Enter a valid email", zh: "请输入有效的邮箱" },
  back: { en: "Back", zh: "返回" },
  back_home: { en: "Back to home", zh: "返回首页" },
  cs_challenge: { en: "The challenge", zh: "挑战" },
  cs_approach: { en: "What I did", zh: "我的做法" },
  cs_results: { en: "Results", zh: "成果" },
  cs_role: { en: "Role", zh: "角色" },
  cs_year: { en: "Year", zh: "年份" },
  cs_stack: { en: "Stack", zh: "技术栈" },
  cs_next: { en: "Next project", zh: "下一个项目" },
  not_found: { en: "Page not found", zh: "页面不存在" },
  footer_built: { en: "Built with React, TypeScript, Tailwind CSS and Supabase.", zh: "使用 React、TypeScript、Tailwind CSS 与 Supabase 构建。" },
  theme: { en: "Toggle theme", zh: "切换主题" },
  menu: { en: "Menu", zh: "菜单" },
  copy_email: { en: "Copy email", zh: "复制邮箱" },
  copied: { en: "Copied", zh: "已复制" },
} satisfies Record<string, L>;

export type DictKey = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string; pick: (l: L) => string; loc: <T>(en: T, zh?: T | null) => T };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = safeStorage.get("lang");
    if (saved === "en" || saved === "zh") return saved;
    return navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en";
  });
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    safeStorage.set("lang", lang);
  }, [lang]);
  const value: Ctx = {
    lang,
    setLang,
    t: (k) => dict[k][lang],
    pick: (l) => l[lang],
    loc: (en, zh) => (lang === "zh" && zh ? zh : en),
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
