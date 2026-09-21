import { prisma } from "@/lib/db/prisma";

export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

export type SiteSettings = {
  name: string;
  title: string;
  description: string;
  statusLabel: string;
  navItems: Array<{ label: string; href: string }>;
  socialLinks: SocialLink[];
};

export type SocialLink = {
  label: string;
  href: string;
  kind: "github" | "linkedin" | "email";
};

export type Project = {
  slug: string;
  title: string;
  year: string;
  excerpt: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
  visibility: Visibility;
  featured: boolean;
  privateLabel?: string;
};

export type ExperienceItem = {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string;
};

export type EducationItem = {
  school: string;
  degree: string;
  period: string;
  details?: string;
};

export type NoteEntry = {
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: string;
  category: string;
  href: string;
};

export const siteSettings: SiteSettings = {
  name: "amiracle",
  title: "I build things for the web.",
  description:
    "Developer, frontend-first, with a curiosity for product systems, interfaces, and things that actually work. I take the code seriously, but not the internet.",
  statusLabel: "currently building something quietly interesting",
  navItems: [
    { label: "Work", href: "#work" },
    { label: "Notes", href: "#notes" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  socialLinks: [
    { label: "GitHub", href: "https://github.com", kind: "github" },
    { label: "LinkedIn", href: "https://linkedin.com", kind: "linkedin" },
    { label: "Email", href: "mailto:hello@amiracle.dev", kind: "email" },
  ],
};

export const technologies = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "Tailwind CSS",
  "Video.js",
  "HLS",
  "Date-fns",
  "Design systems",
  "Product strategy",
];

export const projects: Project[] = [
  {
    slug: "video-platform",
    title: "Video Platform",
    year: "2024",
    excerpt:
      "A live-streaming system built for high concurrency, synchronized playback, and low-latency segment delivery.",
    description:
      "A live-streaming experience designed around reliability, playback timing, and operational clarity. The platform focused on solving hard frontend and infrastructure problems without adding unnecessary complexity.",
    responsibilities: [
      "Shaped the product direction around streaming reliability and UX clarity.",
      "Built the frontend experience for live playback, status states, and operator tooling.",
      "Worked across client, backend, and infrastructure boundaries to reduce delivery latency.",
    ],
    technologies: ["React", "Node.js", "Video.js", "HLS"],
    visibility: "PUBLIC",
    featured: true,
  },
  {
    slug: "persian-calendar",
    title: "Persian Calendar",
    year: "2023",
    excerpt:
      "A calendar system that handles Jalali, Gregorian, and Islamic dates with native conversion logic and localized interface rules.",
    description:
      "A date and calendar experience built around correctness across multiple calendars, not just layout. It was designed to be technically precise while staying approachable for end users.",
    responsibilities: [
      "Implemented reliable conversion logic between calendar systems.",
      "Built a clear interface around date selection, formatting, and range logic.",
      "Worked through localization edge cases that affect real users in production.",
    ],
    technologies: ["React", "TypeScript", "Date-fns"],
    visibility: "PUBLIC",
    featured: true,
  },
  {
    slug: "creator-platform",
    title: "Product / Platform",
    year: "Private",
    excerpt:
      "A private platform for creators. Built end-to-end. Details are intentionally restricted.",
    description:
      "A private product built across the full stack. The work included product thinking, interface design, backend systems, and deployment decisions for an internal or client-facing experience.",
    responsibilities: [
      "Took ownership from early product framing through implementation.",
      "Designed and shipped a cohesive platform experience end-to-end.",
      "Connected systems, data flow, and UI logic to handle business-critical workflows.",
    ],
    technologies: ["Full-stack", "Next.js", "PostgreSQL"],
    visibility: "PRIVATE",
    featured: false,
    privateLabel: "Private Project",
  },
];

export const notes: NoteEntry[] = [
  {
    title: "Why most marketplaces feel empty at launch",
    excerpt:
      "Why empty marketplaces feel like a product failure, and how to simulate liquidity before the first real user shows up.",
    publishedAt: "Jun 2026",
    readingTime: "8 min read",
    category: "product",
    href: "/notes",
  },
  {
    title: "What I learned building real-time interfaces",
    excerpt:
      "WebSockets, optimistic UI, packet drops, and the messy reality of keeping real-time interfaces from breaking.",
    publishedAt: "Apr 2026",
    readingTime: "6 min read",
    category: "engineering",
    href: "/notes",
  },
  {
    title: "The annoying engineering problem behind video playback",
    excerpt:
      "Why synchronized live streams are harder than they look, and how to fake it without a transcoder farm.",
    publishedAt: "Feb 2026",
    readingTime: "10 min read",
    category: "engineering",
    href: "/notes",
  },
  {
    title: "Why developers should care about product design",
    excerpt:
      "Code is execution. Product developers bridge engineering and human behavior. One without the other is just a feature.",
    publishedAt: "Jan 2026",
    readingTime: "5 min read",
    category: "opinion",
    href: "/notes",
  },
];

export const experiences: ExperienceItem[] = [
  {
    company: "Independent product work",
    role: "Frontend & full-stack developer",
    location: "Remote",
    startDate: "2023",
    isCurrent: true,
    description:
      "Designed and shipped product experiences from concept through deployment, with a focus on frontend quality, systems thinking, and reliable implementation.",
  },
  {
    company: "Product teams",
    role: "Engineer / builder",
    location: "Cross-functional",
    startDate: "2021",
    endDate: "2023",
    description:
      "Built interfaces, product systems, and infrastructure-aware frontend experiences for projects that needed to feel polished and perform reliably.",
  },
];

export const education: EducationItem[] = [
  {
    school: "Self-directed engineering + product learning",
    degree:
      "Hands-on experience across frontend, backend, systems, and product execution",
    period: "2018 — present",
    details:
      "Focused on building reliable interfaces, real-world systems, and practical product thinking.",
  },
];

export const socialLinks = siteSettings.socialLinks;
export const publicProjects = projects.filter(
  (project) => project.visibility === "PUBLIC",
);

function toProjectViewModel(project: {
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  responsibilities: string[];
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  featured: boolean;
  publishedAt: Date | null;
  Technology: Array<{ name: string }>;
  ProjectMedia?: Array<{ url: string; alt?: string | null }>;
}) {
  const year =
    project.publishedAt instanceof Date &&
    !Number.isNaN(project.publishedAt.getTime())
      ? String(project.publishedAt.getFullYear())
      : "2024";

  return {
    slug: project.slug,
    title: project.title,
    year,
    excerpt: project.excerpt ?? "",
    description: project.description ?? "",
    responsibilities: project.responsibilities ?? [],
    technologies: project.Technology.map((technology) => technology.name),
    visibility: project.visibility,
    featured: project.featured,
    privateLabel:
      project.visibility === "PRIVATE" ? "Private Project" : undefined,
  };
}

export async function getPublicProjects() {
  try {
    const rows = await prisma.project.findMany({
      where: {
        status: "published",
        visibility: "PUBLIC",
      },
      orderBy: [
        { featured: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        Technology: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (rows.length > 0) {
      return rows.map((project) => toProjectViewModel(project));
    }
  } catch {
    // Fall back to the existing static portfolio data when the database is not yet
    // populated or unavailable during local development.
  }

  return publicProjects;
}

export async function getProjectBySlug(slug: string) {
  try {
    const project = await prisma.project.findUnique({
      where: {
        slug,
      },
      include: {
        Technology: {
          orderBy: { name: "asc" },
        },
        ProjectMedia: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (project) {
      if (project.status !== "published" || project.visibility !== "PUBLIC") {
        return null;
      }

      return toProjectViewModel(project);
    }
  } catch {
    // Fall back to static content during local or CI environments without a DB.
  }

  return projects.find((project) => project.slug === slug) ?? null;
}
