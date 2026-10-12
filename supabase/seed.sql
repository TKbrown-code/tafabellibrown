-- Seed content (generated). Run after schema.sql.

insert into public.projects (slug, title, title_zh, tagline, tagline_zh, summary, summary_zh, role, role_zh, year, problem, problem_zh, approach, approach_zh, results, results_zh, metrics, tech, live_url, repo_url, cover_url, featured, published, sort_order) values
('dream-scholarships', 'Dream Scholarships', 'Dream Scholarships 奖学金平台', 'Scholarship matching platform', '奖学金智能匹配平台', 'A scholarship matching app that helps students find and apply to programs in China — supporting thousands of active users.', '帮助学生发现并申请中国奖学金项目的匹配平台，服务数千名活跃用户。', 'Full-stack developer · Architecture, API, front end', '全栈开发 · 架构、API 与前端', '2025', 'Students were searching across scattered sources to find scholarships they actually qualify for, then tracking applications by hand. As the user base grew, search and dashboard endpoints slowed down noticeably during peak periods such as application deadlines.', '学生需要在分散的信息来源中查找自己符合条件的奖学金，并手动跟踪申请进度。随着用户增长，在申请截止日等高峰期，搜索与仪表盘接口明显变慢。', '- Designed the data model and **RESTful APIs** for scholarship search, user authentication and application management.
- Built the front end in **React + TypeScript** with Tailwind CSS, fully responsive across devices.
- Profiled slow queries and added targeted **PostgreSQL indexes** on the hottest search filters.
- Introduced **Redis caching** for frequently requested, rarely changing results.
- Deployed on **Vercel**, with Supabase for managed Postgres and auth.', '- 为奖学金搜索、用户认证与申请管理设计数据模型与 **RESTful API**。
- 使用 **React + TypeScript** 与 Tailwind CSS 构建前端，全面适配各类设备。
- 分析慢查询，为最常用的搜索条件添加针对性的 **PostgreSQL 索引**。
- 为高频访问、低频变化的结果引入 **Redis 缓存**。
- 部署于 **Vercel**，使用 Supabase 托管 Postgres 与认证。', 'API response times dropped by **more than 40%** during peak traffic, and the platform now serves **thousands of active users** with a consistent experience on mobile and desktop.', '高峰期 API 响应时间缩短 **40% 以上**，平台目前稳定服务 **数千名活跃用户**，移动端与桌面端体验一致。', array['{"value":"40%+","label":"Faster API at peak","label_zh":"高峰期 API 提速"}'::jsonb, '{"value":"1000s","label":"Active users","label_zh":"活跃用户"}'::jsonb, '{"value":"100%","label":"Responsive UI","label_zh":"响应式界面"}'::jsonb]::text[], array['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Supabase', 'Redis', 'Tailwind CSS', 'Vercel']::text[], 'https://www.dream-scholarships.com', null, '/projects/dream-scholarships.jpg', true, true, 1),
('tsogobis', 'Tsogobis', 'Tsogobis 电商平台', 'E-commerce platform', '电子商务平台', 'Production e-commerce features for an everyday-needs marketplace, with a focus on Core Web Vitals and mobile speed.', '面向日用品市场的生产级电商功能开发，重点优化核心网页指标与移动端速度。', 'Full-stack developer · Features, performance, testing', '全栈开发 · 功能、性能与测试', '2025', 'Most shoppers arrive on mobile, but key pages were rendered entirely on the client and served unoptimized product images — hurting load times, Core Web Vitals and conversion.', '大多数用户通过手机访问，但关键页面完全在客户端渲染，商品图片也未经优化，拖慢加载速度、影响核心网页指标与转化率。', '- Built production-ready e-commerce features in **React and Node.js**, with RESTful APIs connecting front end and back end.
- Migrated critical pages to **Server-Side Rendering** for faster first paint.
- Added an **automated image optimization** pipeline for product media.
- Wrote **unit and integration tests** so features could ship without regressions.
- Collaborated with designers in **Agile sprints**, including planning and daily stand-ups.', '- 使用 **React 与 Node.js** 构建生产级电商功能，并通过 RESTful API 连接前后端。
- 将关键页面迁移至 **服务端渲染（SSR）**，加快首屏呈现。
- 为商品图片引入 **自动化图片优化** 流程。
- 编写 **单元测试与集成测试**，确保新功能上线不引入回归问题。
- 在 **敏捷迭代** 中与设计师紧密协作，参与迭代规划与每日站会。', 'Mobile performance scores rose by **35%**, with measurably better Core Web Vitals on the pages that matter most.', '移动端性能评分提升 **35%**，最关键页面的核心网页指标显著改善。', array['{"value":"+35%","label":"Mobile performance","label_zh":"移动端性能"}'::jsonb, '{"value":"SSR","label":"Critical pages","label_zh":"关键页面"}'::jsonb, '{"value":"CI","label":"Tested releases","label_zh":"测试保障发布"}'::jsonb]::text[], array['React', 'Node.js', 'Express', 'PostgreSQL', 'REST API', 'SSR']::text[], 'https://tsogobis.com', null, '/projects/tsogobis.jpg', true, true, 2),
('trucksszone', 'TrucksZone', 'TrucksZone 商用车市场', 'Commercial vehicle marketplace', '商用车交易市场', 'A marketplace for new and used trucks with advanced filtering, fast search across large listings and heavy media management.', '新车与二手卡车交易平台，支持高级筛选、大数据量快速搜索以及大量媒体资源管理。', 'Full-stack developer · Search, data, UI', '全栈开发 · 搜索、数据与界面', '2025', 'Buyers filter by many attributes at once — make, model, year, price, condition — across a large and growing inventory with lots of photos. Naive queries and keystroke-by-keystroke requests made search feel sluggish.', '买家常同时按品牌、型号、年份、价格、车况等多个条件筛选，库存量大且图片众多。简单的查询方式以及每次按键都发请求，使搜索体验迟缓。', '- Built the marketplace with **advanced filtering**, optimized search and high-volume media management.
- Rewrote and tuned **complex SQL queries** behind the filters.
- Added **debounced search** to cut redundant requests while typing.
- Designed responsive interfaces for **desktop and mobile**.
- Improved scalability by tuning backend search and database interactions.', '- 构建具备 **高级筛选**、优化搜索与大规模媒体管理能力的交易平台。
- 重写并调优筛选背后的 **复杂 SQL 查询**。
- 引入 **防抖搜索**，减少输入过程中的冗余请求。
- 设计适配 **桌面端与移动端** 的响应式界面。
- 调优后端搜索与数据库交互，提升系统可扩展性。', 'Search became noticeably more responsive on large datasets, and the backend scales more comfortably as listings grow.', '在大数据量下搜索响应明显更快，随着车源增长，后端也能更从容地扩展。', array['{"value":"SQL","label":"Optimized queries","label_zh":"查询优化"}'::jsonb, '{"value":"Debounced","label":"Live search","label_zh":"实时搜索"}'::jsonb, '{"value":"Media","label":"High-volume","label_zh":"大规模媒体"}'::jsonb]::text[], array['React', 'Node.js', 'Express', 'PostgreSQL']::text[], 'https://trucksszone.com', null, '/projects/trucksszone.jpg', true, true, 3)
on conflict (slug) do nothing;

insert into public.posts (slug, title, title_zh, excerpt, excerpt_zh, content, content_zh, tags, cover_url, reading_minutes, published, published_at) values
('cutting-api-latency-postgres-redis', 'Cutting API latency by 40% with Postgres indexes and Redis', '用 Postgres 索引与 Redis 将 API 延迟降低 40%', 'What I measured, what I changed, and what I would do first next time when a scholarship search API slowed down at peak traffic.', '奖学金搜索接口在高峰期变慢时，我测量了什么、改了什么，以及下次会优先做什么。', 'When traffic spikes around application deadlines, the slowest endpoints are rarely the ones you expect.

## Measure first

Start with `EXPLAIN ANALYZE` on the queries behind your busiest endpoints. Look for sequential scans on large tables and filters that run on every request.

## Index what you filter on

A composite index that matches the shape of the `WHERE` clause usually beats several single-column indexes:

```sql
create index on scholarships (country, degree_level, deadline);
```

## Cache what rarely changes

Search results for popular filter combinations change slowly. Caching them in Redis with a short TTL removes most of the repeated work:

```ts
const key = `search:${hash(filters)}`;
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
const rows = await db.search(filters);
await redis.set(key, JSON.stringify(rows), { EX: 300 });
return rows;
```

## Takeaway

Indexing fixed the worst queries; caching flattened the peaks. Together they cut response times by more than 40%.', '在申请截止日附近流量激增时，最慢的接口往往不是你预想的那个。

## 先测量

对最繁忙接口背后的查询执行 `EXPLAIN ANALYZE`，重点关注大表上的顺序扫描，以及每次请求都会执行的过滤条件。

## 为过滤条件建索引

与 `WHERE` 子句结构相匹配的复合索引，通常优于多个单列索引：

```sql
create index on scholarships (country, degree_level, deadline);
```

## 缓存变化少的数据

热门筛选组合的搜索结果变化很慢。用 Redis 加上较短的过期时间进行缓存，可以省去大部分重复计算：

```ts
const key = `search:${hash(filters)}`;
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
const rows = await db.search(filters);
await redis.set(key, JSON.stringify(rows), { EX: 300 });
return rows;
```

## 总结

索引解决了最慢的查询，缓存削平了流量高峰，两者结合使响应时间缩短了 40% 以上。', array['PostgreSQL', 'Redis', 'Performance']::text[], null, 4, true, '2026-09-18T00:00:00Z'),
('ssr-and-image-optimization-for-mobile', 'How SSR and image optimization lifted mobile scores by 35%', 'SSR 与图片优化如何让移动端评分提升 35%', 'Notes from moving an e-commerce site''s critical pages to server-side rendering and automating product image optimization.', '将电商网站关键页面迁移至服务端渲染、并自动化商品图片优化的实践笔记。', 'Most e-commerce shoppers are on phones, often on slow networks. Two changes made the biggest difference.

## Render critical pages on the server

The home, category and product pages were moved to SSR so users see real content on first paint instead of a spinner.

## Optimize every image automatically

Product photos are resized, compressed and served in modern formats at upload time, with explicit width and height to avoid layout shift.

## Measure on real devices

Lighthouse on a desktop machine hides problems. Test on a mid-range phone with network throttling.

## Result

Mobile performance scores rose by 35%, with better LCP and CLS on the pages that drive revenue.', '大多数电商用户使用手机访问，而且网络常常不佳。以下两项改动效果最明显。

## 关键页面服务端渲染

首页、分类页和商品详情页迁移至 SSR，用户首屏即可看到真实内容，而不是加载动画。

## 自动优化每一张图片

商品图片在上传时自动缩放、压缩并转换为现代格式，同时明确宽高，避免布局偏移。

## 在真实设备上测量

在桌面电脑上跑 Lighthouse 会掩盖问题，应在中端手机上并开启网络限速进行测试。

## 结果

移动端性能评分提升 35%，带来营收的关键页面 LCP 与 CLS 均明显改善。', array['React', 'SSR', 'Web Vitals']::text[], null, 3, true, '2026-08-27T00:00:00Z')
on conflict (slug) do nothing;

insert into public.skills (category, name, sort_order) values
('frontend', 'React', 0),
('frontend', 'TypeScript', 1),
('frontend', 'JavaScript (ES6+)', 2),
('frontend', 'HTML5', 3),
('frontend', 'CSS3', 4),
('frontend', 'Tailwind CSS', 5),
('frontend', 'Bootstrap', 6),
('backend', 'Node.js', 0),
('backend', 'Express.js', 1),
('backend', 'REST APIs', 2),
('backend', 'JWT Auth', 3),
('backend', 'Server-Side Rendering', 4),
('data', 'PostgreSQL', 0),
('data', 'MongoDB', 1),
('data', 'Supabase', 2),
('data', 'Prisma', 3),
('data', 'Drizzle ORM', 4),
('data', 'Redis', 5),
('devops', 'Git', 0),
('devops', 'GitHub', 1),
('devops', 'Docker', 2),
('devops', 'Vercel', 3),
('devops', 'Cloudflare', 4),
('devops', 'Postman', 5),
('devops', 'Figma', 6),
('testing', 'Jest', 0),
('testing', 'Mocha', 1),
('testing', 'Cypress', 2);
