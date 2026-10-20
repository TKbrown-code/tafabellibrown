// Static profile content. Edit here — this rarely changes, so it lives in code.
// Projects, blog posts, skills and messages are loaded through the portfolio API.

export const site = {
  name: "Tafa Belli Brown",
  initials: "TB",
  email: "tafabilly73@gmail.com",

  github: "https://github.com/TKbrown-code",
  linkedin: "https://www.linkedin.com/in/tafabilly",
  resumeUrl: import.meta.env.BASE_URL + "Tafa_Belli_Brown_Resume.pdf",
  location: { en: "Jinzhou, Liaoning, China", zh: "中国辽宁锦州" },
  role: { en: "Full-Stack Web Developer", zh: "全栈 Web 开发工程师" },
  available: true,
  languages: [
    { en: "English", zh: "英语", level: { en: "Native", zh: "母语" } },
    { en: "French", zh: "法语", level: { en: "Conversational", zh: "日常交流" } },
    { en: "Mandarin", zh: "普通话", level: { en: "Basic", zh: "基础" } },
  ],
  stats: [
    { value: "3", label: { en: "Live platforms shipped", zh: "已上线平台" } },
    { value: "40%+", label: { en: "Faster API responses", zh: "API 响应提速" } },
    { value: "35%", label: { en: "Mobile performance gain", zh: "移动端性能提升" } },
  ],
  experience: [
    {
      title: { en: "Full-Stack Web Developer", zh: "全栈 Web 开发工程师" },
      org: { en: "Independent Projects & Software Delivery", zh: "独立项目与软件交付" },
      period: { en: "2025 – Present", zh: "2025 年至今" },
      place: { en: "Remote", zh: "远程" },
      points: [
        {
          en: "Architected and shipped three production platforms end to end — scholarships, e-commerce and a vehicle marketplace.",
          zh: "从零到上线，独立架构并交付三个生产级平台：奖学金匹配、电商与商用车交易市场。",
        },
        {
          en: "Cut API response times by more than 40% at peak traffic with PostgreSQL indexing and Redis caching.",
          zh: "通过 PostgreSQL 索引与 Redis 缓存，高峰期 API 响应时间缩短 40% 以上。",
        },
        {
          en: "Raised mobile performance scores by 35% by moving critical pages to SSR and automating image optimization.",
          zh: "将关键页面迁移至服务端渲染并自动化图片优化，移动端性能评分提升 35%。",
        },
        {
          en: "Worked in Agile sprints with designers; wrote unit and integration tests to keep releases reliable.",
          zh: "与设计师协作，参与敏捷迭代；编写单元与集成测试，保障每次发布的稳定性。",
        },
      ],
    },
  ],
  education: {
    degree: { en: "B.Sc. Computer Science", zh: "计算机科学 理学学士" },
    school: { en: "Liaoning University of Technology", zh: "辽宁工业大学" },
    place: { en: "Jinzhou, Liaoning Province, China", zh: "中国辽宁省锦州市" },
    period: { en: "Expected June 2028", zh: "预计 2028 年 6 月毕业" },
  },
  methodologies: ["Agile", "Scrum", "Kanban"],
  tools: ["Git", "GitHub", "Docker", "Vercel", "Cloudflare", "Postman", "Figma", "VS Code"],
};

export type Lang = "en" | "fr" | "zh" | "es" | "ar" | "pcm";
export type L = { en: string; zh: string; fr?: string; es?: string; ar?: string; pcm?: string };
