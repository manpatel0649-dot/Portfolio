export type StackRow = {
  category: string;
  tier: "core" | "supporting";
  tools: string;
};

export const stackRows: StackRow[] = [
  { category: "LLM Development",  tier: "core", tools: "Transformers, Attention, Tokenizers, Pre-training, LoRA/QLoRA, RLHF/DPO, Quantization" },
  { category: "LLM Applications", tier: "core", tools: "RAG, Prompt engineering, Vector DBs, Embeddings, Hugging Face, OpenAI/Claude APIs" },
  { category: "AI Agents",        tier: "core", tools: "LangGraph, LangChain, Multi-agent, Tool calling, n8n" },
  { category: "NLP",              tier: "core", tools: "Text classification, NER, Embeddings, spaCy, NLTK" },
  { category: "Deep Learning",    tier: "core", tools: "PyTorch, TensorFlow, CNN, RNN/LSTM" },
  { category: "Machine Learning", tier: "core", tools: "scikit-learn, Regression, Classification, Recommenders" },
  { category: "Data Science",     tier: "core", tools: "Pandas, NumPy, SQL, EDA, Statistics, Plotly, Power BI" },
  { category: "Software & Web",   tier: "supporting", tools: "Python, TypeScript, React, Next.js, FastAPI, Docker, Vercel" },
];
