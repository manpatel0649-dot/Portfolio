// Site-wide identity, navigation links, and social URLs

export const profile = {
  name: "Man Panchotiya",
  role: "AI/ML Engineer, Data Scientist & Founder",
  headline: "I build LLMs, AI Agents & data-driven intelligent software.",
  subline: "Founder · Qeist.io · Aoneq Labs",
  email: "manpatel0649@gmail.com", // TODO: confirm public contact email
  location: "India", // TODO: confirm city/region to display

  nav: [
    { label: "Ventures", href: "#ventures" },
    { label: "LLM Lab", href: "#llm-lab" },
    { label: "Projects", href: "#projects" },
    { label: "Skills", href: "#skills" },
    { label: "Contact", href: "#contact" },
  ],

  cta: {
    primary: { label: "Let's Talk", href: "#contact" },
    secondary: { label: "View My Work", href: "#projects" },
  },

  socials: {
    github: "https://github.com/manpatel0649", // TODO: verify handle
    linkedin: "https://linkedin.com/in/manpanchotiya", // TODO: verify handle
    huggingface: "https://huggingface.co/manpanchotiya", // TODO: verify handle
    kaggle: "https://kaggle.com/manpanchotiya", // TODO: verify handle
  },

  heroTags: [
    "LLM",
    "Agents",
    "NLP",
    "Deep Learning",
    "ML",
    "Data Science",
    "Full-Stack",
  ],
} as const;
