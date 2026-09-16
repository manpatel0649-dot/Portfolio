// Qeist.io and Aoneq Labs venture data

export type Venture = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  status: string;
  url?: string;
  highlight: string; // bold callout stat or phrase
};

export const ventures: Venture[] = [
  {
    id: "qeist",
    name: "Qeist.io",
    tagline: "AI-generated test cases for QA teams.",
    description:
      "Qeist.io uses LLMs and NLP to automatically generate comprehensive test cases from requirements, user stories, and code — eliminating manual QA bottlenecks.", // TODO: refine with real copy
    tags: ["LLM", "NLP", "SaaS", "QA Automation"],
    status: "Active", // TODO: update (e.g. "In Beta", "Launched")
    url: "https://qeist.io", // TODO: verify URL
    highlight: "AI that writes your test cases", // TODO: replace with real metric/tagline
  },
  {
    id: "aoneq",
    name: "Aoneq Labs",
    tagline: "AI agents & automation for businesses.",
    description:
      "Aoneq Labs designs and delivers custom AI agent systems and automation workflows. Two client projects delivered, helping businesses cut manual effort and make smarter decisions.", // TODO: refine with real copy
    tags: ["AI Agents", "Automation", "LangChain", "n8n"],
    status: "Active",
    url: undefined, // TODO: add URL if public
    highlight: "2 client projects delivered",
  },
];
