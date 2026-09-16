// All project data: featured case-study cards and small DS/ML/NLP cards

export type FeaturedProject = {
  id: string;
  title: string;
  problem: string;
  whatIBuilt: string;
  result: string; // key metric / outcome
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  thumbnail?: string; // path relative to /public
};

export type SmallProject = {
  id: string;
  title: string;
  description: string;
  metric: string; // one big number / stat
  tags: string[];
  chartData?: { label: string; value: number }[]; // optional mini recharts bar
  githubUrl?: string;
};

// Section 7 — order matters
export const featuredProjects: FeaturedProject[] = [
  {
    id: "competitive-intel-agent",
    title: "Competitive Intel Agent",
    problem: "TODO: Describe the business problem this solved.", // TODO
    whatIBuilt:
      "TODO: Describe what you built — agent architecture, tools used, stack.", // TODO
    result: "TODO: e.g. Reduced research time by 80%", // TODO
    tags: ["AI Agents", "LangGraph", "RAG", "Python"],
    demoUrl: undefined, // TODO
    githubUrl: "TODO", // TODO
    thumbnail: undefined,
  },
  {
    id: "qualitypilot",
    title: "QualityPilot",
    problem: "TODO: Describe the business problem.", // TODO
    whatIBuilt: "TODO: Describe what you built.", // TODO
    result: "TODO: Key result metric.", // TODO
    tags: ["LLM", "NLP", "SaaS", "FastAPI"],
    demoUrl: undefined, // TODO
    githubUrl: "TODO", // TODO
    thumbnail: undefined,
  },
  {
    id: "ai-sir",
    title: "AI Sir",
    problem: "TODO: Describe the business problem.", // TODO
    whatIBuilt: "TODO: Describe what you built.", // TODO
    result: "TODO: Key result metric.", // TODO
    tags: ["LLM", "Education", "RAG", "Next.js"],
    demoUrl: undefined, // TODO
    githubUrl: "TODO", // TODO
    thumbnail: undefined,
  },
  {
    id: "hermes-leadgen",
    title: "Hermes Lead-gen Agent",
    problem: "TODO: Describe the business problem.", // TODO
    whatIBuilt: "TODO: Describe what you built.", // TODO
    result: "TODO: Key result metric.", // TODO
    tags: ["AI Agents", "Automation", "n8n", "LangChain"],
    demoUrl: undefined, // TODO
    githubUrl: "TODO", // TODO
    thumbnail: undefined,
  },
];

// Section 8 — DS/ML/NLP small cards (rows of 3)
export const smallProjects: SmallProject[] = [
  {
    id: "churn-prediction",
    title: "Churn Prediction",
    description: "Predicts customer churn using ensemble ML on banking data.", // TODO: refine
    metric: "TODO: e.g. 94% accuracy", // TODO
    tags: ["scikit-learn", "XGBoost", "Pandas"],
    chartData: [
      { label: "Precision", value: 92 },
      { label: "Recall", value: 89 },
      { label: "F1", value: 90 },
    ], // TODO: replace with real values
    githubUrl: "TODO", // TODO
  },
  {
    id: "spam-detector",
    title: "Spam Detector",
    description: "NLP model to classify SMS/email as spam or ham.", // TODO: refine
    metric: "TODO: e.g. 98.5% accuracy", // TODO
    tags: ["NLP", "NLTK", "Naive Bayes"],
    chartData: [
      { label: "Precision", value: 98 },
      { label: "Recall", value: 97 },
      { label: "F1", value: 97 },
    ], // TODO
    githubUrl: "TODO", // TODO
  },
  {
    id: "movie-recommender",
    title: "Movie Recommender",
    description: "Content + collaborative filtering hybrid recommendation engine.", // TODO: refine
    metric: "TODO: e.g. Top-10 hit rate 76%", // TODO
    tags: ["Recommendation", "scikit-learn", "Pandas"],
    chartData: undefined, // TODO
    githubUrl: "TODO", // TODO
  },
  {
    id: "ipl-analysis",
    title: "IPL Data Analysis",
    description: "Exploratory data analysis and visualizations on 10 years of IPL data.", // TODO: refine
    metric: "TODO: e.g. 15 insights published", // TODO
    tags: ["EDA", "Pandas", "Matplotlib", "Seaborn"],
    chartData: undefined, // TODO
    githubUrl: "TODO", // TODO
  },
];
