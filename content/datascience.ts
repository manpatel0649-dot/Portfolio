// Data Science Showcase section — stats, pipeline steps, and chart data

export const dsShowcase = {
  headline: "Data → Insights → Decisions",
  subline: "Turning raw numbers into business value, end to end.", // TODO: refine

  steps: [
    {
      step: 1,
      title: "Collect & Clean",
      description: "Ingest, validate, and wrangle messy real-world data.",
      icon: "Database",
    },
    {
      step: 2,
      title: "Analyze & Visualize",
      description: "Surface patterns, correlations, and outliers with clear charts.",
      icon: "BarChart2",
    },
    {
      step: 3,
      title: "Predict & Deploy",
      description: "Train, evaluate, and ship models that drive decisions.",
      icon: "Rocket",
    },
  ],

  stats: [
    { label: "Projects Completed", value: "15+", icon: "FolderCheck" }, // TODO: update
    { label: "Model Accuracy (avg)", value: "92%", icon: "Target" }, // TODO: update
    { label: "Data Points Processed", value: "10M+", icon: "Database" }, // TODO: update
  ],

  // Recharts-compatible data arrays
  charts: {
    // Simple line chart — e.g. model accuracy over training epochs
    trainingCurve: [
      { epoch: 1, accuracy: 0.61, loss: 0.72 },
      { epoch: 2, accuracy: 0.71, loss: 0.58 },
      { epoch: 3, accuracy: 0.79, loss: 0.47 },
      { epoch: 4, accuracy: 0.85, loss: 0.38 },
      { epoch: 5, accuracy: 0.89, loss: 0.31 },
      { epoch: 6, accuracy: 0.91, loss: 0.26 },
      { epoch: 7, accuracy: 0.92, loss: 0.22 },
    ], // TODO: replace with real training data

    // Bar chart — feature importance or category breakdown
    featureImportance: [
      { feature: "Age", importance: 0.22 },
      { feature: "Balance", importance: 0.18 },
      { feature: "Tenure", importance: 0.15 },
      { feature: "Products", importance: 0.13 },
      { feature: "Activity", importance: 0.11 },
    ], // TODO: replace with real project data
  },
};
