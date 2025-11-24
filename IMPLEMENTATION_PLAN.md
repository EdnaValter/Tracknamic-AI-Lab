# Tracknamic AI Lab Implementation Plan

## 1. Summary & Validation
- **Purpose**: Tracknamic AI Lab is a social prompt engineering platform where creators share, improve, and discuss AI prompts with real-time collaboration signals (likes, comments, forks, bookmarks) and AI-assisted authoring (optimize/summarize/related suggestions). Target users include prompt engineers, AI enthusiasts, teams experimenting with models, and moderators/admins who oversee quality and safety.
- **Initial Modules**: Authentication & onboarding; user profiles; prompt CRUD (create/edit/view/fork); feed/explore/search; tags; interactions (likes, comments, bookmarks, forks); notifications; basic moderation/reports; AI assistance (optimize/summarize/related); settings/theme; admin/mod dashboards (basic in MVP scope).

## 2. Implementation Roadmap
### MVP
- Auth (Email + GitHub/Google), onboarding choices, profile setup.
- Prompt creation/editing with markdown, tags, visibility, model selector, image upload via presigned URLs.
- Feed (following/trending/new), prompt detail, explore by tags/search.
- Interactions: likes, bookmarks, forks, threaded comments with @mentions.
- Basic notifications (likes/comments/forks/mentions), dark mode, search with full-text.
- AI actions: improve/summarize prompt; related prompts stub via tags.
- Moderation: hide/unhide content, report queue basics; rate limiting.

### V1
- Teams/spaces with membership roles; team visibility for prompts.
- Collections and curated lists; drafts/versioning.
- Embeddings-based related/search; email/push notifications.
- Moderation dashboard, analytics; notification settings; PWA/accessibility improvements.
- Background jobs for AI tasks and notifications; richer explore/discovery.

### Future
- Collaborative editing, marketplace and experiment harness, co-writing AI, enterprise controls, model routing, DSL for prompts, verified creators, sharded workers and pub/sub scaling.

## 3. System Architecture (Concrete)
- **Next.js App Routes**:
  - `/` (feed with tabs following/trending/new)
  - `/explore` (tags/collections/search results)
  - `/prompt/[id]` (prompt detail), `/prompt/[id]/edit`, `/create`
  - `/u/[username]` (profile with tabs prompts/saved/activity/about)
  - `/notifications`
  - `/settings` (account/security/notifications/theme/connections)
  - `/teams` (list), `/teams/[slug]`, `/teams/[slug]/settings`
  - `/reports` (mod/admin), `/admin` (admin dashboard)
  - API routes or server actions under `/api/*` for prompts, comments, likes, bookmarks, forks, notifications, reports, teams, search, upload URLs, AI actions.

- **API Endpoints/Server Actions** (REST-oriented):
  - `POST /api/auth/[...nextauth]` (NextAuth).
  - `GET/POST /api/prompts`, `GET /api/prompts/[id]`, `PUT/PATCH /api/prompts/[id]`, `DELETE /api/prompts/[id]`, `POST /api/prompts/[id]/fork`, `POST /api/prompts/[id]/ai/optimize`, `POST /api/prompts/[id]/ai/summarize`, `GET /api/prompts/[id]/related`.
  - `GET/POST /api/comments`, `GET /api/comments/[id]`, `PATCH /api/comments/[id]`, `DELETE /api/comments/[id]`.
  - `POST /api/likes`, `DELETE /api/likes` (idempotent by prompt_id+user).
  - `POST /api/bookmarks`, `DELETE /api/bookmarks`.
  - `POST /api/notifications/mark-read`, `GET /api/notifications`.
  - `POST /api/reports`, `PATCH /api/reports/[id]` (moderator actions).
  - `GET/POST /api/teams`, `GET /api/teams/[id|slug]`, `POST /api/teams/[id]/members`, `PATCH /api/teams/[id]/members/[userId]`.
  - `GET /api/search` (keyword/tags/semantic), `GET /api/tags`.
  - `GET /api/upload-url` for presigned S3/Supabase Storage uploads.
  - `GET /api/socket` for Socket.IO server.

- **Prisma Mapping**: Prisma models mirror logical schema with relations: User↔Profile (1:1), User→Prompt (1:N), Prompt→Tags (M:N via PromptTag), Prompt→Comment (1:M threaded), interactions tables for likes/bookmarks, Fork linking parent/child prompts, Notification referencing actor/prompt/comment/team, Report with moderator linkage, Teams with TeamMember join.

## 4. Database Schema (Prisma Models)
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  authProvider String
  githubId     String?  @unique
  googleId     String?  @unique
  createdAt    DateTime @default(now())
  lastLogin    DateTime?
  profile      Profile?
  prompts      Prompt[]
  comments     Comment[]
  likes        Like[]
  bookmarks    Bookmark[]
  forks        Fork[]    @relation("ForkAuthor")
  notifications Notification[] @relation("UserNotifications")
  reportsFiled Report[]  @relation("ReportsFiled")
  reportsModerated Report[] @relation("ReportsModerated")
  teamsOwned   Team[]    @relation("TeamOwner")
  teamMemberships TeamMember[]
}

model Profile {
  id                 String   @id
  user               User     @relation(fields: [id], references: [id])
  username           String   @unique
  displayName        String?
  bio                String?
  avatarUrl          String?
  skills             String[]
  links              Json?
  preferredLanguages String[]
  preferredModels    String[]
  role               Role     @default(USER)
  locale             String?
  timezone           String?
}

enum Role {
  USER
  MOD
  ADMIN
}

enum Visibility {
  PUBLIC
  TEAM
  PRIVATE
}

model Prompt {
  id             String     @id @default(cuid())
  author         User       @relation(fields: [authorId], references: [id])
  authorId       String
  title          String
  bodyMd         String
  bodyHtmlCached String?
  tagsCache      String[]
  visibility     Visibility @default(PUBLIC)
  modelUsed      String?
  parent         Prompt?    @relation("PromptFork", fields: [parentId], references: [id])
  parentId       String?
  team           Team?      @relation(fields: [teamId], references: [id])
  teamId         String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  likesCount     Int        @default(0)
  commentsCount  Int        @default(0)
  forksCount     Int        @default(0)
  bookmarksCount Int        @default(0)
  embedVector    Bytes?
  isHidden       Boolean    @default(false)
  tags           PromptTag[]
  comments       Comment[]
  likes          Like[]
  bookmarks      Bookmark[]
  forksAsParent  Fork[]     @relation("ForkParent")
  forksAsChild   Fork[]     @relation("ForkChild")
}

model Tag {
  id          String      @id @default(cuid())
  name        String      @unique
  description String?
  usageCount  Int         @default(0)
  prompts     PromptTag[]
}

model PromptTag {
  prompt   Prompt @relation(fields: [promptId], references: [id])
  promptId String
  tag      Tag    @relation(fields: [tagId], references: [id])
  tagId    String
  @@id([promptId, tagId])
}

model Comment {
  id        String    @id @default(cuid())
  prompt    Prompt    @relation(fields: [promptId], references: [id])
  promptId  String
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  bodyMd    String
  parent    Comment?  @relation("CommentThread", fields: [parentId], references: [id])
  parentId  String?
  children  Comment[] @relation("CommentThread")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  isHidden  Boolean   @default(false)
}

model Like {
  id        String   @id @default(cuid())
  prompt    Prompt   @relation(fields: [promptId], references: [id])
  promptId  String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())
  @@unique([promptId, userId])
}

model Bookmark {
  id        String   @id @default(cuid())
  prompt    Prompt   @relation(fields: [promptId], references: [id])
  promptId  String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())
  @@unique([promptId, userId])
}

model Fork {
  id              String   @id @default(cuid())
  parentPrompt    Prompt   @relation("ForkParent", fields: [parentPromptId], references: [id])
  parentPromptId  String
  childPrompt     Prompt   @relation("ForkChild", fields: [childPromptId], references: [id])
  childPromptId   String
  user            User     @relation("ForkAuthor", fields: [userId], references: [id])
  userId          String
  createdAt       DateTime @default(now())
  @@unique([parentPromptId, childPromptId])
}

model Notification {
  id        String   @id @default(cuid())
  user      User     @relation("UserNotifications", fields: [userId], references: [id])
  userId    String
  type      String
  actor     User?    @relation("NotificationActor", fields: [actorId], references: [id])
  actorId   String?
  prompt    Prompt?  @relation(fields: [promptId], references: [id])
  promptId  String?
  comment   Comment? @relation(fields: [commentId], references: [id])
  commentId String?
  team      Team?    @relation(fields: [teamId], references: [id])
  teamId    String?
  payload   Json?
  readAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, type])
}

model Report {
  id              String   @id @default(cuid())
  reporter        User     @relation("ReportsFiled", fields: [reporterId], references: [id])
  reporterId      String
  targetType      String
  targetId        String
  reason          String
  status          ReportStatus @default(OPEN)
  moderator       User?    @relation("ReportsModerated", fields: [moderatorId], references: [id])
  moderatorId     String?
  resolutionNotes String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([status])
}

enum ReportStatus {
  OPEN
  REVIEWED
  RESOLVED
}

model Team {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  description String?
  owner       User         @relation("TeamOwner", fields: [ownerId], references: [id])
  ownerId     String
  createdAt   DateTime     @default(now())
  members     TeamMember[]
  prompts     Prompt[]
}

model TeamMember {
  team     Team   @relation(fields: [teamId], references: [id])
  teamId   String
  user     User   @relation(fields: [userId], references: [id])
  userId   String
  role     TeamRole @default(MEMBER)
  invitedBy String?
  joinedAt DateTime @default(now())
  @@id([teamId, userId])
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
}

@@fulltext([Prompt.title, Prompt.bodyMd])
```
Design decisions: embedded vector stored as `Bytes` for pgvector; `tagsCache` cached array; unique combos on interactions; enums for role/visibility/report/team roles. Add full-text index on prompt title/body.

## 5. Design System (Tailwind)
- **Colors (semantic tokens)**: `bg-surface` (#0f172a slate-900), `bg-elevated` (#111827), `text-primary` (#e5e7eb), `text-muted` (#9ca3af), `border-subtle` (#1f2937), `primary` (#22d3ee), `primary-foreground` (#0b1526), `danger` (#f43f5e), `success` (#22c55e), `warning` (#f59e0b), `accent` (#a855f7).
- **Typography**: Inter for UI, JetBrains Mono for code. Scale: xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24, 3xl 30. Font weights 500/600 for headings.
- **Components**:
  - Buttons: variants `primary` (bg primary, text dark), `secondary` (bg-subtle border), `ghost` (transparent hover bg), `danger` (danger bg), sizes sm/md/lg with rounded-lg.
  - Cards: `rounded-xl border border-subtle bg-elevated shadow-sm`.
  - Inputs/Textareas: `bg-surface border-subtle focus:ring-primary focus:border-primary text-primary rounded-lg`.
  - Badges/Chips: pill with `bg-primary/10 text-primary` or `bg-border-subtle` for neutral.
  - Tags: clickable chips with hash prefix.
  - Avatars: circle 32–48px with fallback initials.
  - Toasts: bottom-right stack, colors by intent.

## 6. Core UI Components & Pages
- **PromptCard**: props `{prompt}`; shows author avatar/name, createdAt/model, tags, title, html excerpt, counts; actions like/ comment/bookmark/fork buttons.
- **PromptDetail**: props `{prompt, related, comments}`; renders markdown HTML with syntax highlighting and copy buttons; AI actions (Improve/Summarize); fork lineage, share; interaction bar.
- **PromptEditor**: props `{initialPrompt, onSave}`; two-pane editor + preview; title input, tags selector, visibility/model selector, AI optimize/summarize buttons, image attachments.
- **CommentThread**: props `{comments, onReply}`; threaded list with markdown, reply box, hide indicators.
- **Sidebar**: props `{sections, teams, saved}`; navigation links for feed tabs, explore, teams/spaces, saved.
- **TopNav**: logo, search with autocomplete, create button, notifications bell, profile menu, theme toggle.
- **BottomNav (mobile)**: tabs Feed/Explore/Create/Notifications/Profile.
- **NotificationsList**: props `{items, onMarkRead}`; grouped by type, filters for tabs, mark-as-read actions.
- **ProfileHeader**: props `{profile}`; avatar, display name, bio, skills chips, preferred models/languages, follow button.

- **Page Layouts**:
  - Feed `/`: main column of `PromptCard`, filter tabs; right rail trending tags/users; left nav sections.
  - Prompt Detail `/prompt/[id]`: content column with markdown, AI actions, related prompts carousel, comments thread; right rail with author card and fork tree.
  - Create/Edit `/create` `/prompt/[id]/edit`: editor + preview, metadata sidebar.
  - Profile `/u/[username]`: header + tabs (Prompts grid/list, Saved, Activity, About).
  - Notifications `/notifications`: tabs All/Mentions/Follow/Team/System, mark read.
  - Settings `/settings`: sub-tabs account/security/notifications/theme/connections.
  - Teams `/teams/[slug]`: team info, member list, prompts with team visibility, invite controls.

## 7. Auth & Roles
- Use NextAuth with Email (magic link or password), GitHub, Google providers.
- Session includes `user.id`, `email`, `profile.username`, `role` (USER/MOD/ADMIN).
- Callbacks: `jwt` adds role/username; `session` exposes them to client; `signIn` enforces verified email if required.
- Middleware protects routes: admin pages require ADMIN; moderator tools require MOD+; create/edit requires authenticated; private/team prompts authorize by author/team membership.
- Role enforcement in API handlers with zod validation and helper `requireRole(role)`.

## 8. Interactions & Real-time
- **Likes/Bookmarks**: POST toggles create row and increments counters transactionally; DELETE removes. Optimistic UI via React Query. Broadcast via Socket.IO channel `prompt:{id}` to update counts.
- **Comments**: POST creates comment; updates prompt commentsCount; push to `comments:{promptId}` channel for real-time thread updates.
- **Forks**: POST creates new prompt child linked via `Fork`; increments parent forksCount; notify author; broadcast to parent channel.
- **Notifications**: On interactions, enqueue job to create notification rows; Socket.IO `notifications:{userId}` pushes new items; mark-read updates `readAt`.
- **Cache**: React Query caching per list/detail; Redis optional for feed/search caching and rate limits.
- **Examples**: `POST /api/likes` validates promptId, upserts Like, updates counts in transaction, emits socket event, returns new count. `POST /api/comments` inserts comment, updates counts, triggers notification to author/replied user.

## 9. AI Features
- Service layer `aiService` with functions:
  - `optimizePrompt({promptId, bodyMd, model})` → call OpenAI/Anthropic, return improved text, cache by prompt version + user.
  - `summarizePrompt({promptId, bodyMd})` → concise summary used in previews; store in Redis and optionally DB cache.
  - `getRelatedPrompts({promptId})` → fetch embeddings (pgvector) and top-k similar prompts; fallback to tag-based if missing.
- Background jobs (BullMQ) handle heavy AI tasks and store outputs with provenance; rate limit per user; expose endpoints `/api/prompts/[id]/ai/*`.

## 10. Testing & CI
- **Unit**: utils (formatters, auth helpers), role guards, aiService mocks.
- **Integration**: API routes for prompt CRUD, interactions, notifications creation, reports, teams membership; Prisma test DB.
- **E2E (Playwright)**: flows for sign-up/onboarding, create prompt, like/comment/bookmark, fork, hide/report, notifications tab behavior, search/filter.
- CI: GitHub Actions running lint, typecheck, unit/integration, Playwright on deployed preview if possible; Prisma migrate check; Husky pre-commit for lint-staged.

## 11. Developer Onboarding
- **Run locally**: `npm install`, set env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, OAuth keys, `S3_*`, `REDIS_URL`), then `npm run dev`.
- **Migrations**: `npx prisma migrate dev` (or `prisma db push` for prototyping). Seed script optional.
- **Tests**: `npm run lint`, `npm run test`, `npm run test:e2e` (Playwright) after starting dev server/test DB.
- **Code structure**: `app/` for routes (feed, prompt, profile, settings, teams, api); `components/` for UI (cards, nav, editor, comments); `lib/` for services (auth, aiService, db, validation); `prisma/schema.prisma` for models; `styles/` for Tailwind config/theme.
