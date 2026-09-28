export const dsSection = {
  label: "03",
  labelText: "Data science & ML",
  headline: { before: "Data → insight → ", italic: "decision" },
  description: "Classical ML and analysis projects, shown the way I'd present them to a stakeholder.",

  kpis: [
    {
      title: "Churn prediction",
      value: "[AUC]",
      unit: "ROC",
      description: "Flags at-risk customers early",
      sparkColor: "#34d399",
      sparkPoints: "0,40 25,36 50,38 75,28 100,30 125,20 150,18 175,10 200,8",
    },
    {
      title: "Spam detector · NLP",
      value: "[F1]",
      unit: "score",
      description: "SMS & email classification",
      sparkColor: "#34d399",
      sparkPoints: "0,30 25,26 50,32 75,20 100,22 125,14 150,16 175,12 200,9",
    },
    {
      title: "Movie recommender",
      value: "5k",
      unit: "titles",
      description: "Content-based similarity",
      sparkColor: "rgba(255,230,203,.5)",
      sparkPoints: "0,22 25,18 50,26 75,16 100,24 125,12 150,20 175,14 200,18",
    },
    {
      title: "IPL analysis · EDA",
      value: "[insight]",
      unit: "",
      description: "What actually wins matches",
      sparkColor: "#ffbd38",
      sparkPoints: "0,36 25,30 50,34 75,24 100,26 125,22 150,14 175,18 200,10",
    },
  ],

  featureImportance: [
    { label: "tenure",          value: "0.31", width: 92 },
    { label: "monthly_charges", value: "0.24", width: 74, delay: ".1s" },
    { label: "contract_type",   value: "0.18", width: 58, delay: ".2s" },
    { label: "support_calls",   value: "0.12", width: 40, delay: ".3s" },
    { label: "payment_method",  value: "0.08", width: 26, delay: ".4s" },
  ],

  pipeline: [
    { idx: "01", title: "Collect & clean", description: "APIs, SQL, messy CSVs → tidy data" },
    { idx: "02", title: "Explore",         description: "EDA, statistics, hypothesis tests" },
    { idx: "03", title: "Model",           description: "Features, training, honest evaluation" },
    { idx: "04", title: "Deploy",          description: "APIs, dashboards, Streamlit apps" },
  ],
};

export const confusionMatrix = {
  title: "Churn model · confusion matrix",
  cols: ["Pred. Churn", "Pred. Stay"],
  rows: ["Actual Churn", "Actual Stay"],
  cells: [
    { label: "TP", value: "[TP]", intensity: 0.90, good: true  },
    { label: "FP", value: "[FP]", intensity: 0.35, good: false },
    { label: "FN", value: "[FN]", intensity: 0.25, good: false },
    { label: "TN", value: "[TN]", intensity: 0.85, good: true  },
  ],
};
