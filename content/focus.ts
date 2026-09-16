// "What I Do" section — 6 focus area cards

export type FocusCard = {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide-react icon name
  gradient: string; // tailwind gradient classes for card accent
};

export const focusCards: FocusCard[] = [
  {
    id: "llm-dev",
    title: "LLM Development",
    description:
      "Pre-training, fine-tuning with LoRA/QLoRA, RLHF/DPO alignment, and quantization. I build language models from the ground up, not just prompt them.", // TODO: refine
    icon: "BrainCircuit",
    gradient: "from-violet-600 to-purple-800",
  },
  {
    id: "llm-apps",
    title: "LLM Applications",
    description:
      "RAG pipelines, prompt engineering, vector databases, and embedding search. Production-grade LLM-powered apps using OpenAI, Claude, and Hugging Face.", // TODO: refine
    icon: "Layers",
    gradient: "from-purple-600 to-indigo-700",
  },
  {
    id: "ai-agents",
    title: "AI Agents",
    description:
      "Multi-agent systems with tool calling, LangChain, LangGraph, and n8n. Autonomous workflows that research, decide, and act.", // TODO: refine
    icon: "Bot",
    gradient: "from-cyan-600 to-blue-700",
  },
  {
    id: "nlp-dl",
    title: "NLP & Deep Learning",
    description:
      "Text classification, NER, embeddings, CNNs, RNNs and LSTMs. PyTorch and TensorFlow for production deep learning workloads.", // TODO: refine
    icon: "Network",
    gradient: "from-blue-600 to-cyan-700",
  },
  {
    id: "data-science",
    title: "Data Science & ML",
    description:
      "End-to-end: EDA, feature engineering, model selection, evaluation, and deployment. scikit-learn, Pandas, and full BI stack.", // TODO: refine
    icon: "BarChart2",
    gradient: "from-teal-600 to-emerald-700",
  },
  {
    id: "software-web",
    title: "Software & Web",
    description:
      "Full-stack engineering with React, Next.js, FastAPI, and Node.js. Clean APIs, scalable architecture, and polished interfaces.", // TODO: refine
    icon: "Code2",
    gradient: "from-emerald-600 to-green-700",
  },
];
