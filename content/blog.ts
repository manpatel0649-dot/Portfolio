// Blog section — article cards (3 shown on portfolio)

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  date: string; // ISO date string
  readTime: string; // e.g. "6 min read"
  tags: string[];
  url: string;
  cover?: string; // path relative to /public, optional
};

export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    title: "TODO: Blog post title", // TODO
    excerpt: "TODO: 1–2 sentence preview of the post.", // TODO
    date: "2026-01-01", // TODO
    readTime: "TODO: e.g. 7 min read", // TODO
    tags: ["LLM", "Fine-tuning"], // TODO
    url: "TODO: https://...", // TODO
    cover: undefined,
  },
  {
    id: "blog-2",
    title: "TODO: Blog post title", // TODO
    excerpt: "TODO: 1–2 sentence preview of the post.", // TODO
    date: "2026-01-01", // TODO
    readTime: "TODO: e.g. 5 min read", // TODO
    tags: ["AI Agents", "LangGraph"], // TODO
    url: "TODO: https://...", // TODO
    cover: undefined,
  },
  {
    id: "blog-3",
    title: "TODO: Blog post title", // TODO
    excerpt: "TODO: 1–2 sentence preview of the post.", // TODO
    date: "2026-01-01", // TODO
    readTime: "TODO: e.g. 8 min read", // TODO
    tags: ["Data Science", "ML"], // TODO
    url: "TODO: https://...", // TODO
    cover: undefined,
  },
];
