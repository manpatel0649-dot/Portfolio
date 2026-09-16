// Skills section — categories, tools, chip sizes

export type SkillCategory = {
  id: string;
  label: string;
  tier: "primary" | "secondary"; // primary = big chips, secondary = small chips
  tools: string[];
};

export const skillCategories: SkillCategory[] = [
  {
    id: "llm-dev",
    label: "LLM Development",
    tier: "primary",
    tools: [
      "Transformers",
      "Attention Mechanisms",
      "Tokenizers",
      "Pre-training",
      "LoRA / QLoRA",
      "RLHF / DPO",
      "Quantization",
    ],
  },
  {
    id: "llm-apps",
    label: "LLM Applications",
    tier: "primary",
    tools: [
      "RAG",
      "Prompt Engineering",
      "Vector DBs",
      "Embeddings",
      "Hugging Face",
      "OpenAI API",
      "Claude API",
    ],
  },
  {
    id: "ai-agents",
    label: "AI Agents",
    tier: "primary",
    tools: ["LangChain", "LangGraph", "Multi-agent Systems", "Tool Calling", "n8n"],
  },
  {
    id: "nlp",
    label: "NLP",
    tier: "primary",
    tools: [
      "Text Classification",
      "NER",
      "Embeddings",
      "spaCy",
      "NLTK",
      "Sentiment Analysis",
    ],
  },
  {
    id: "deep-learning",
    label: "Deep Learning",
    tier: "primary",
    tools: ["PyTorch", "TensorFlow", "CNN", "RNN / LSTM", "Transformers"],
  },
  {
    id: "machine-learning",
    label: "Machine Learning",
    tier: "primary",
    tools: [
      "scikit-learn",
      "Regression",
      "Classification",
      "Clustering",
      "Recommenders",
      "Model Evaluation",
      "XGBoost",
    ],
  },
  {
    id: "data-science",
    label: "Data Science",
    tier: "primary",
    tools: [
      "Pandas",
      "NumPy",
      "SQL",
      "EDA",
      "Statistics",
      "Feature Engineering",
      "Matplotlib",
      "Seaborn",
      "Plotly",
      "Power BI",
      "Tableau",
    ],
  },
  {
    id: "software-dev",
    label: "Software Development",
    tier: "secondary",
    tools: ["Python", "JavaScript / TypeScript", "OOP", "Git", "REST APIs"],
  },
  {
    id: "web-dev",
    label: "Web Development",
    tier: "secondary",
    tools: ["React", "Next.js", "Tailwind CSS", "FastAPI", "Flask", "Node.js"],
  },
  {
    id: "deploy-tools",
    label: "Deploy & Tools",
    tier: "secondary",
    tools: ["Docker", "Vercel", "Streamlit", "Jupyter", "Colab"],
  },
];
