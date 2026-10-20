import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang, L } from "@/data/site";
import { safeStorage } from "./storage";

const dict = {
  nav_about: { en: "About", fr: "À propos", zh: "关于", es: "Sobre mí", ar: "نبذة عني", pcm: "About me" },
  nav_skills: { en: "Skills", fr: "Compétences", zh: "技能", es: "Habilidades", ar: "المهارات", pcm: "Skills" },
  nav_projects: { en: "Projects", fr: "Projets", zh: "项目", es: "Proyectos", ar: "المشاريع", pcm: "Projects" },
  nav_services: { en: "Services", fr: "Services", zh: "服务", es: "Servicios", ar: "الخدمات", pcm: "Services" },
  nav_experience: { en: "Experience", fr: "Expérience", zh: "经历", es: "Experiencia", ar: "الخبرة", pcm: "Experience" },
  nav_blog: { en: "Blog", fr: "Blog", zh: "博客", es: "Blog", ar: "المدونة", pcm: "Blog" },
  nav_contact: { en: "Contact", fr: "Contact", zh: "联系", es: "Contacto", ar: "تواصل", pcm: "Contact" },
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
  experience_projects: { en: "Selected platforms", zh: "代表项目" },
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
  message_sent_title: { en: "Message sent successfully", zh: "消息已成功发送" },
  message_error_title: { en: "Message could not be sent", zh: "消息发送失败" },
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
  footer_built: { en: "Built with React, TypeScript, Tailwind CSS and a secure API.", zh: "使用 React、TypeScript、Tailwind CSS 与安全 API 构建。" },
  theme: { en: "Toggle theme", zh: "切换主题" },
  menu: { en: "Menu", zh: "菜单" },
  copy_email: { en: "Copy email", zh: "复制邮箱" },
  copied: { en: "Copied", zh: "已复制" },
} satisfies Record<string, L>;

export type DictKey = keyof typeof dict;

// The original dictionary only included Chinese for most labels. Keep these
// translations together so every supported language has localized UI copy.
const additionalTranslations: Record<Exclude<Lang, "en" | "zh">, Partial<Record<DictKey, string>>> = {
  fr: {
    nav_about: "À propos", nav_skills: "Compétences", nav_projects: "Projets", nav_services: "Services", nav_experience: "Expérience", nav_blog: "Blog", nav_contact: "Contact",
    available: "Disponible pour travailler à distance partout dans le monde", hero_title_1: "Je crée des produits web rapides et fiables", hero_title_2: "qui passent en production", hero_title_3: "et tiennent leurs promesses.",
    hero_body: "Développeur full-stack spécialisé en React, TypeScript, Node.js et PostgreSQL. J’ai livré trois plateformes en production et soigne chaque détail qui les rend rapides.",
    cta_projects: "Voir les projets", cta_resume: "Télécharger le CV", cta_contact: "Me contacter", about_kicker: "À propos", about_title: "Développeur, étudiant, créateur.",
    about_p1: "Je suis étudiant international en informatique à l’Université de technologie du Liaoning, en Chine. En parallèle de mes études, je crée et déploie des applications web en production.",
    about_p2: "Mes points forts sont la conception d’API, l’optimisation des requêtes et les performances front-end. Je travaille à distance, communique clairement et livre par étapes testées.",
    languages: "Langues", based_in: "Basé à", education: "Formation", skills_kicker: "Boîte à outils", skills_title: "Les technologies que j’utilise.",
    cat_frontend: "Front-end", cat_backend: "Back-end", cat_data: "Bases de données et ORM", cat_devops: "DevOps et outils", cat_testing: "Tests", methodologies: "Méthodes de travail",
    projects_kicker: "Projets sélectionnés", projects_title: "Des produits en ligne, de vrais utilisateurs.", read_case: "Lire l’étude de cas", visit_site: "Visiter le site",
    experience_kicker: "Expérience", experience_title: "Mon parcours de création.", experience_projects: "Projets sélectionnés", blog_kicker: "Écriture", blog_title: "Notes de développement.", all_posts: "Tous les articles", min_read: "min de lecture",
    contact_kicker: "Contact", contact_title: "Créons quelque chose ensemble.", contact_body: "Disponible pour des postes à distance, des stages et des missions freelance. Je réponds généralement sous un jour.",
    f_name: "Nom", f_email: "E-mail", f_subject: "Sujet", f_message: "Message", f_send: "Envoyer le message", f_sending: "Envoi…", f_sent: "Merci pour votre message. Je le consulterai et vous répondrai dès que possible.", f_error: "Une erreur est survenue. Veuillez m’écrire directement par e-mail.", message_sent_title: "Message envoyé", message_error_title: "Échec de l’envoi du message", f_required: "Obligatoire", f_invalid_email: "Saisissez une adresse e-mail valide",
    back: "Retour", back_home: "Retour à l’accueil", cs_challenge: "Le défi", cs_approach: "Mon approche", cs_results: "Résultats", cs_role: "Rôle", cs_year: "Année", cs_stack: "Technologies", cs_next: "Projet suivant", not_found: "Page introuvable", footer_built: "Créé avec React, TypeScript, Tailwind CSS et une API sécurisée.", theme: "Changer de thème", menu: "Menu", copy_email: "Copier l’e-mail", copied: "Copié",
  },
  es: {
    nav_about: "Acerca de mí", nav_skills: "Habilidades", nav_projects: "Proyectos", nav_services: "Servicios", nav_experience: "Experiencia", nav_blog: "Blog", nav_contact: "Contacto",
    available: "Disponible para trabajar a distancia en todo el mundo", hero_title_1: "Creo productos web rápidos y fiables", hero_title_2: "que llegan a producción", hero_title_3: "y cumplen su propósito.",
    hero_body: "Desarrollador full-stack con experiencia en React, TypeScript, Node.js y PostgreSQL. He lanzado tres plataformas y cuido los detalles que las hacen rápidas.",
    cta_projects: "Ver proyectos", cta_resume: "Descargar currículum", cta_contact: "Contáctame", about_kicker: "Acerca de mí", about_title: "Desarrollador, estudiante y creador.",
    about_p1: "Soy estudiante internacional de informática en la Universidad Tecnológica de Liaoning, China. Mientras estudio, desarrollo y publico aplicaciones web de producción.",
    about_p2: "Mis fortalezas son el diseño de API, la optimización de consultas y el rendimiento del front-end. Trabajo a distancia, me comunico con claridad y entrego en etapas pequeñas y probadas.",
    languages: "Idiomas", based_in: "Ubicación", education: "Formación", skills_kicker: "Herramientas", skills_title: "Tecnologías con las que trabajo.",
    cat_frontend: "Front-end", cat_backend: "Back-end", cat_data: "Bases de datos y ORM", cat_devops: "DevOps y herramientas", cat_testing: "Pruebas", methodologies: "Métodos de trabajo",
    projects_kicker: "Proyectos destacados", projects_title: "Productos en producción, usuarios reales.", read_case: "Leer el caso", visit_site: "Visitar sitio",
    experience_kicker: "Experiencia", experience_title: "Mi trayectoria creando productos.", experience_projects: "Proyectos destacados", blog_kicker: "Artículos", blog_title: "Notas del desarrollo.", all_posts: "Todos los artículos", min_read: "min de lectura",
    contact_kicker: "Contacto", contact_title: "Construyamos algo juntos.", contact_body: "Disponible para puestos remotos, prácticas y proyectos freelance. Normalmente respondo en un día.",
    f_name: "Nombre", f_email: "Correo", f_subject: "Asunto", f_message: "Mensaje", f_send: "Enviar mensaje", f_sending: "Enviando…", f_sent: "Gracias por tu mensaje. Lo revisaré y responderé lo antes posible.", f_error: "Algo salió mal. Envíame un correo directamente.", message_sent_title: "Mensaje enviado correctamente", message_error_title: "No se pudo enviar el mensaje", f_required: "Obligatorio", f_invalid_email: "Introduce un correo válido",
    back: "Volver", back_home: "Volver al inicio", cs_challenge: "El reto", cs_approach: "Qué hice", cs_results: "Resultados", cs_role: "Rol", cs_year: "Año", cs_stack: "Tecnologías", cs_next: "Siguiente proyecto", not_found: "Página no encontrada", footer_built: "Creado con React, TypeScript, Tailwind CSS y una API segura.", theme: "Cambiar tema", menu: "Menú", copy_email: "Copiar correo", copied: "Copiado",
  },
  ar: {
    nav_about: "نبذة عني", nav_skills: "المهارات", nav_projects: "المشاريع", nav_services: "الخدمات", nav_experience: "الخبرة", nav_blog: "المدونة", nav_contact: "تواصل",
    available: "متاح للعمل عن بُعد من أي مكان في العالم", hero_title_1: "أبني منتجات ويب سريعة وموثوقة", hero_title_2: "تصل إلى المستخدمين", hero_title_3: "وتؤدي عملها بكفاءة.",
    hero_body: "مطوّر متكامل أعمل باستخدام React وTypeScript وNode.js وPostgreSQL. أطلقت ثلاث منصات فعلية وأهتم بالتفاصيل التي تجعلها سريعة.",
    cta_projects: "استعرض المشاريع", cta_resume: "تنزيل السيرة الذاتية", cta_contact: "تواصل معي", about_kicker: "نبذة عني", about_title: "مطوّر وطالب وصانع منتجات.",
    about_p1: "أنا طالب دولي في علوم الحاسوب بجامعة لياونينغ للتكنولوجيا في الصين، وأبني تطبيقات ويب فعلية وأنشرها إلى جانب دراستي.",
    about_p2: "أتميز بتصميم واجهات API وتحسين الاستعلامات وأداء الواجهة الأمامية. أعمل عن بُعد، وأتواصل بوضوح، وأسلم العمل على مراحل صغيرة ومختبرة.",
    languages: "اللغات", based_in: "مقر الإقامة", education: "التعليم", skills_kicker: "الأدوات", skills_title: "التقنيات التي أستخدمها.",
    cat_frontend: "الواجهة الأمامية", cat_backend: "الواجهة الخلفية", cat_data: "قواعد البيانات وORM", cat_devops: "DevOps والأدوات", cat_testing: "الاختبار", methodologies: "أساليب العمل",
    projects_kicker: "أعمال مختارة", projects_title: "منتجات حية ومستخدمون حقيقيون.", read_case: "اقرأ دراسة الحالة", visit_site: "زيارة الموقع",
    experience_kicker: "الخبرة", experience_title: "رحلتي في بناء المنتجات.", experience_projects: "منصات مختارة", blog_kicker: "الكتابة", blog_title: "ملاحظات من رحلة التطوير.", all_posts: "كل المقالات", min_read: "دقائق للقراءة",
    contact_kicker: "تواصل", contact_title: "لنبنِ شيئًا معًا.", contact_body: "متاح للوظائف عن بُعد والتدريب والمشاريع المستقلة. أرد عادةً خلال يوم.",
    f_name: "الاسم", f_email: "البريد الإلكتروني", f_subject: "الموضوع", f_message: "الرسالة", f_send: "إرسال الرسالة", f_sending: "جارٍ الإرسال…", f_sent: "شكرًا لتواصلك. سأراجع رسالتك وأرد عليك في أقرب وقت.", f_error: "حدث خطأ. يُرجى مراسلتي مباشرةً عبر البريد الإلكتروني.", message_sent_title: "تم إرسال الرسالة بنجاح", message_error_title: "تعذر إرسال الرسالة", f_required: "مطلوب", f_invalid_email: "أدخل بريدًا إلكترونيًا صالحًا",
    back: "رجوع", back_home: "العودة إلى الصفحة الرئيسية", cs_challenge: "التحدي", cs_approach: "ما فعلته", cs_results: "النتائج", cs_role: "الدور", cs_year: "السنة", cs_stack: "التقنيات", cs_next: "المشروع التالي", not_found: "الصفحة غير موجودة", footer_built: "بُني باستخدام React وTypeScript وTailwind CSS وواجهة API آمنة.", theme: "تغيير المظهر", menu: "القائمة", copy_email: "نسخ البريد الإلكتروني", copied: "تم النسخ",
  },
  pcm: {
    nav_about: "About me", nav_skills: "Skills", nav_projects: "Projects", nav_services: "Services", nav_experience: "Experience", nav_blog: "Blog", nav_contact: "Contact",
    available: "I dey available for remote work anywhere for di world", hero_title_1: "I dey build fast, reliable", hero_title_2: "web products", hero_title_3: "wey dey work well.",
    hero_body: "I be full-stack developer wey dey work with React, TypeScript, Node.js and PostgreSQL. I don launch three platforms, and I care about di small details wey make dem fast.",
    cta_projects: "See projects", cta_resume: "Download CV", cta_contact: "Contact me", about_kicker: "About me", about_title: "Developer, student and builder.",
    about_p1: "I be international Computer Science student for Liaoning University of Technology, China. I dey build and launch real web apps alongside my studies.",
    about_p2: "My strong points na API design, query optimization and front-end performance. I fit work remotely, communicate clearly, and deliver work small small with testing.",
    languages: "Languages", based_in: "Location", education: "Education", skills_kicker: "My tools", skills_title: "The tech wey I dey use.",
    cat_frontend: "Frontend", cat_backend: "Backend", cat_data: "Databases and ORMs", cat_devops: "DevOps and Tools", cat_testing: "Testing", methodologies: "How I dey work",
    projects_kicker: "Selected work", projects_title: "Live products, real users.", read_case: "Read case study", visit_site: "Visit website",
    experience_kicker: "Experience", experience_title: "Where I don build things.", experience_projects: "Selected platforms", blog_kicker: "Writing", blog_title: "Notes from di work.", all_posts: "All posts", min_read: "min read",
    contact_kicker: "Contact", contact_title: "Make we build something together.", contact_body: "I dey open to remote jobs, internships and freelance work. I normally reply within one day.",
    f_name: "Name", f_email: "Email", f_subject: "Subject", f_message: "Message", f_send: "Send message", f_sending: "E dey send…", f_sent: "Thank you for your message. I go check am and reply as soon as I fit.", f_error: "Something no work. Abeg email me directly.", message_sent_title: "Message don send", message_error_title: "Message no fit send", f_required: "Required", f_invalid_email: "Enter correct email",
    back: "Back", back_home: "Back to home", cs_challenge: "Di challenge", cs_approach: "Wetin I do", cs_results: "Results", cs_role: "Role", cs_year: "Year", cs_stack: "Tech stack", cs_next: "Next project", not_found: "Page no dey", footer_built: "I build am with React, TypeScript, Tailwind CSS and secure API.", theme: "Change theme", menu: "Menu", copy_email: "Copy email", copied: "Copied",
  },
};

const profileTranslations: Record<Exclude<Lang, "en" | "zh">, Record<string, string>> = {
  fr: {
    "Jinzhou, Liaoning, China": "Jinzhou, Liaoning, Chine", "Full-Stack Web Developer": "Développeur web full-stack", "Live platforms shipped": "Plateformes mises en production", "Faster API responses": "Réponses API plus rapides", "Mobile performance gain": "Gain de performances mobiles", "Native": "Langue maternelle", "Conversational": "Conversationnel", "Basic": "Notions", "Remote": "À distance", "Independent Projects & Software Delivery": "Projets indépendants et développement logiciel", "2025 – Present": "2025 – Aujourd’hui", "Architected and shipped three production platforms end to end — scholarships, e-commerce and a vehicle marketplace.": "Conçu et lancé trois plateformes de bout en bout : bourses, commerce en ligne et marché de véhicules.", "Cut API response times by more than 40% at peak traffic with PostgreSQL indexing and Redis caching.": "Réduit de plus de 40 % les temps de réponse des API en période de pointe grâce aux index PostgreSQL et au cache Redis.", "Raised mobile performance scores by 35% by moving critical pages to SSR and automating image optimization.": "Amélioré de 35 % les scores mobiles en passant des pages clés au rendu côté serveur et en automatisant l’optimisation des images.", "Worked in Agile sprints with designers; wrote unit and integration tests to keep releases reliable.": "Collaboré avec des designers en sprints agiles et écrit des tests unitaires et d’intégration pour fiabiliser les versions.", "B.Sc. Computer Science": "Licence en informatique", "Liaoning University of Technology": "Université de technologie du Liaoning", "Jinzhou, Liaoning Province, China": "Jinzhou, province du Liaoning, Chine", "Expected June 2028": "Diplôme prévu en juin 2028",
  },
  es: {
    "Jinzhou, Liaoning, China": "Jinzhou, Liaoning, China", "Full-Stack Web Developer": "Desarrollador web full-stack", "Live platforms shipped": "Plataformas lanzadas", "Faster API responses": "Respuestas API más rápidas", "Mobile performance gain": "Mejora del rendimiento móvil", "Native": "Nativo", "Conversational": "Conversacional", "Basic": "Básico", "Remote": "Remoto", "Independent Projects & Software Delivery": "Proyectos independientes y desarrollo de software", "2025 – Present": "2025 – Actualidad", "Architected and shipped three production platforms end to end — scholarships, e-commerce and a vehicle marketplace.": "Diseñé y publiqué tres plataformas completas: becas, comercio electrónico y un mercado de vehículos.", "Cut API response times by more than 40% at peak traffic with PostgreSQL indexing and Redis caching.": "Reduje más del 40 % los tiempos de respuesta de las API en horas punta con índices de PostgreSQL y caché de Redis.", "Raised mobile performance scores by 35% by moving critical pages to SSR and automating image optimization.": "Mejoré un 35 % el rendimiento móvil al migrar páginas clave a SSR y automatizar la optimización de imágenes.", "Worked in Agile sprints with designers; wrote unit and integration tests to keep releases reliable.": "Colaboré con diseñadores en sprints ágiles y escribí pruebas unitarias y de integración para mantener versiones fiables.", "B.Sc. Computer Science": "Grado en Informática", "Liaoning University of Technology": "Universidad Tecnológica de Liaoning", "Jinzhou, Liaoning Province, China": "Jinzhou, provincia de Liaoning, China", "Expected June 2028": "Graduación prevista para junio de 2028",
  },
  ar: {
    "Jinzhou, Liaoning, China": "جينتشو، لياونينغ، الصين", "Full-Stack Web Developer": "مطوّر ويب متكامل", "Live platforms shipped": "منصات أُطلقت فعليًا", "Faster API responses": "استجابات API أسرع", "Mobile performance gain": "تحسن أداء الهاتف", "Native": "اللغة الأم", "Conversational": "محادثة", "Basic": "أساسي", "Remote": "عن بُعد", "Independent Projects & Software Delivery": "مشاريع مستقلة وتطوير برمجيات", "2025 – Present": "2025 – الآن", "Architected and shipped three production platforms end to end — scholarships, e-commerce and a vehicle marketplace.": "صممت وأطلقت ثلاث منصات متكاملة: للمنح الدراسية والتجارة الإلكترونية وسوق المركبات.", "Cut API response times by more than 40% at peak traffic with PostgreSQL indexing and Redis caching.": "خفضت زمن استجابة API بأكثر من 40٪ وقت الذروة باستخدام فهارس PostgreSQL وذاكرة Redis المؤقتة.", "Raised mobile performance scores by 35% by moving critical pages to SSR and automating image optimization.": "رفعت تقييم أداء الهاتف بنسبة 35٪ عبر نقل الصفحات المهمة إلى SSR وأتمتة تحسين الصور.", "Worked in Agile sprints with designers; wrote unit and integration tests to keep releases reliable.": "عملت مع المصممين ضمن دورات Agile وكتبت اختبارات وحدات وتكامل لضمان موثوقية الإصدارات.", "B.Sc. Computer Science": "بكالوريوس علوم الحاسوب", "Liaoning University of Technology": "جامعة لياونينغ للتكنولوجيا", "Jinzhou, Liaoning Province, China": "جينتشو، مقاطعة لياونينغ، الصين", "Expected June 2028": "التخرج المتوقع في يونيو 2028",
  },
  pcm: {
    "Jinzhou, Liaoning, China": "Jinzhou, Liaoning, China", "Full-Stack Web Developer": "Full-Stack Web Developer", "Live platforms shipped": "Platforms wey don go live", "Faster API responses": "API response wey don faster", "Mobile performance gain": "Mobile performance improvement", "Native": "Native speaker", "Conversational": "I fit yarn am small", "Basic": "Basic", "Remote": "Remote", "Independent Projects & Software Delivery": "Personal projects and software delivery", "2025 – Present": "2025 go reach now", "Architected and shipped three production platforms end to end — scholarships, e-commerce and a vehicle marketplace.": "I design and launch three full platforms: scholarship, online shop, and vehicle marketplace.", "Cut API response times by more than 40% at peak traffic with PostgreSQL indexing and Redis caching.": "I make API response more than 40% faster during busy time with PostgreSQL index and Redis cache.", "Raised mobile performance scores by 35% by moving critical pages to SSR and automating image optimization.": "I improve mobile performance by 35% with SSR for key pages and automatic image optimization.", "Worked in Agile sprints with designers; wrote unit and integration tests to keep releases reliable.": "I work with designers for Agile sprints and write unit and integration tests so releases go well.", "B.Sc. Computer Science": "B.Sc. Computer Science", "Liaoning University of Technology": "Liaoning University of Technology", "Jinzhou, Liaoning Province, China": "Jinzhou, Liaoning, China", "Expected June 2028": "Expected June 2028",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string; pick: (l: L) => string; loc: <T>(en: T, zh?: T | null, fr?: T | null, es?: T | null, ar?: T | null, pcm?: T | null) => T };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = safeStorage.get("lang");
    if (["en", "fr", "zh", "es", "ar", "pcm"].includes(saved ?? "")) return saved as Lang;
    const browserLang = navigator.language?.toLowerCase() ?? "";
    if (browserLang.startsWith("zh")) return "zh";
    if (browserLang.startsWith("fr")) return "fr";
    if (browserLang.startsWith("es")) return "es";
    if (browserLang.startsWith("ar")) return "ar";
    return "en";
  });
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang === "pcm" ? "pcm-NG" : lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    safeStorage.set("lang", lang);
  }, [lang]);
  const value: Ctx = {
    lang,
    setLang,
    t: (k) => (dict[k] as L)[lang] ?? (lang !== "en" && lang !== "zh" ? additionalTranslations[lang][k] : undefined) ?? dict[k].en,
    pick: (l) => l[lang] ?? (lang !== "en" && lang !== "zh" ? profileTranslations[lang][l.en] : undefined) ?? l.en,
    loc: (en, zh, fr, es, ar, pcm) => ({ en, zh, fr, es, ar, pcm }[lang] ?? en) as typeof en,
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
