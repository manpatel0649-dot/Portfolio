export type CapabilityCell = {
  idx: string;
  title: string;
  titleItalic: string; // the italic emerald word
  description: string;
  tools: string;
  tier: "core" | "supporting";
};

export const capabilities: CapabilityCell[] = [
  {
    idx: "01",
    title: "LLM ",
    titleItalic: "Development",
    description: "Building language models from scratch — tokenizers, pre-training, fine-tuning.",
    tools: "Transformers · Attention · BPE · LoRA/QLoRA · DPO · Quantization",
    tier: "core",
  },
  {
    idx: "02",
    title: "AI ",
    titleItalic: "Agents",
    description: "Multi-agent systems that research, decide and act on their own.",
    tools: "LangGraph · LangChain · Tool calling · n8n",
    tier: "core",
  },
  {
    idx: "03",
    title: "LLM ",
    titleItalic: "Applications",
    description: "RAG pipelines, evals and production LLM features.",
    tools: "RAG · Vector DBs · Embeddings · Hugging Face",
    tier: "core",
  },
  {
    idx: "04",
    title: "NLP & ",
    titleItalic: "Deep Learning",
    description: "Models that understand, classify and generate text.",
    tools: "PyTorch · TensorFlow · NER · Text classification",
    tier: "core",
  },
  {
    idx: "05",
    title: "Data Science ",
    titleItalic: "& ML",
    description: "EDA, statistics and predictive models tied to business outcomes.",
    tools: "Pandas · SQL · scikit-learn · Plotly · Power BI",
    tier: "core",
  },
  {
    idx: "06",
    title: "Software & Web",
    titleItalic: "",
    description: "Full-stack apps and APIs that put models in front of users.",
    tools: "Next.js · React · FastAPI · Docker · Vercel",
    tier: "supporting",
  },
];
