export const profile = {
  name: "Man Panchotiya",
  role: "AI/ML Engineer · Data Scientist · Founder",
  headline: "I build LLMs, AI agents & intelligent software.",
  lead: "Founder of Qeist.io and Aoneq Labs. I train language models, design agents that do real work, and turn data into decisions.",
  location: "Gujarat, IN",
  email: "manpatel0649@gmail.com", // TODO: confirm public email

  socials: {
    github: "https://github.com/manpanchotiya",    // TODO: verify handle
    linkedin: "https://linkedin.com/in/manpanchotiya", // TODO: verify handle
    huggingface: "https://huggingface.co/manpanchotiya", // TODO: verify handle
    kaggle: "https://kaggle.com/manpanchotiya",    // TODO: verify handle
  },

  proof: [
    { label: "Founder", value: "Qeist", suffix: ".io" },
    { label: "Founder", value: "Aoneq ", suffix: "Labs" },
    { label: "Shipped",  value: "2 client ", suffix: "deployments" },
    { label: "Built",    value: "LLM from ", suffix: "scratch" },
  ],
} as const;
