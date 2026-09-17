export type BlogPost = {
  category: string;
  readTime: string;
  title: string;
  date: string;
  url: string;
};

export const blogPosts: BlogPost[] = [
  {
    category: "LLM",
    readTime: "8 min",
    title: "What I learned training a language model from scratch",
    date: "[date]",
    url: "#", // TODO: add real URL
  },
  {
    category: "Agents",
    readTime: "6 min",
    title: "Designing LangGraph agents that don't go off the rails",
    date: "[date]",
    url: "#", // TODO: add real URL
  },
  {
    category: "Product",
    readTime: "5 min",
    title: "Why QA teams need generated test cases, not more checklists",
    date: "[date]",
    url: "#", // TODO: add real URL
  },
];
