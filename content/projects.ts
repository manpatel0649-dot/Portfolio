export type WorkCard = {
  id: string;
  idx: string;
  type: string;
  title: string;
  titleItalic?: string;
  description: string;
  tags: { label: string; variant: "default" | "em" }[];
  flow?: string[];
  links?: { label: string; href: string }[];
  special?: "qeist" | "llm";
  gridClass: string;
};

export const workCards: WorkCard[] = [
  {
    id: "qeist",
    idx: "001",
    type: "Flagship · SaaS",
    title: "Qeist.io",
    description: "AI that turns product requirements into complete, ready-to-run test cases for QA teams.",
    tags: [
      { label: "LLM", variant: "em" },
      { label: "NLP", variant: "em" },
      { label: "SaaS", variant: "default" },
      { label: "QA", variant: "default" },
    ],
    special: "qeist",
    gridClass: "c-qeist", // span 7
  },
  {
    id: "llm",
    idx: "002",
    type: "LLM Lab",
    title: "My own ",
    titleItalic: "LLM",
    description: "A decoder-only transformer trained from scratch. Tokenizer, pre-training and evals — all mine.",
    tags: [],
    special: "llm",
    gridClass: "c-llm", // span 5
  },
  {
    id: "competitive-intel",
    idx: "003 · Agent",
    type: "",
    title: "Competitive Intel Agent",
    description: "Multi-step research agent that tracks competitors and writes the brief for you.",
    tags: [
      { label: "LangGraph", variant: "em" },
      { label: "Agents", variant: "default" },
    ],
    flow: ["Search", "Extract", "Compare", "Brief"],
    links: [
      { label: "Case study →", href: "#" },
      { label: "GitHub", href: "#" },
    ],
    gridClass: "c-sm", // span 4
  },
  {
    id: "qualitypilot",
    idx: "004 · LLM tool",
    type: "",
    title: "QualityPilot",
    description: "Reviews GitHub pull requests like a senior QA engineer and flags risky changes.",
    tags: [
      { label: "LLM", variant: "em" },
      { label: "GitHub", variant: "default" },
    ],
    flow: ["PR", "Diff analysis", "Review"],
    links: [
      { label: "Case study →", href: "#" },
      { label: "GitHub", href: "#" },
    ],
    gridClass: "c-sm",
  },
  {
    id: "hermes",
    idx: "005 · Agent",
    type: "",
    title: "Hermes Lead-gen Agent",
    description: "Telegram-connected research agent that finds and qualifies leads on command.",
    tags: [
      { label: "Agents", variant: "em" },
      { label: "Telegram", variant: "default" },
    ],
    flow: ["Telegram", "Research", "Leads"],
    links: [{ label: "Case study →", href: "#" }],
    gridClass: "c-sm",
  },
];

// LLM card spec data
export const llmSpec = [
  { label: "Params", value: "[ xxM ]" },
  { label: "Arch", value: "Decoder-only" },
  { label: "Dataset", value: "[ dataset ]" },
  { label: "Hardware", value: "[ GPU ]" },
];

// Qeist test case generator data
export const testCaseRequirement =
  "User can reset password via email link that expires in 15 min";

export const testCaseRows = [
  { id: "TC-001", description: "Reset link sent to registered email", status: "generated" },
  { id: "TC-002", description: "Link rejected after 15 minutes", status: "generated" },
  { id: "TC-003", description: "Unregistered email shows safe message", status: "generated" },
  { id: "TC-004", description: "Link cannot be reused twice", status: "generated" },
];
