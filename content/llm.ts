// LLM Lab section — model card, training chart, playground

export const llmLab = {
  headline: "LLM Lab",
  subheadline: "I don't just use LLMs. I build them.",
  description:
    "From tokenization to RLHF, I build language models from scratch — experimenting with architectures, custom datasets, and alignment techniques.", // TODO: refine

  // Model card — fill in with your actual trained/fine-tuned model
  modelCard: {
    name: "TODO: Model name (e.g. QeistLM-1B)", // TODO
    params: "TODO: e.g. 1.2B", // TODO
    architecture: "TODO: e.g. Decoder-only Transformer, 24 layers, 16 heads", // TODO
    dataset: "TODO: e.g. Custom QA corpus, 8B tokens", // TODO
    hardware: "TODO: e.g. 2× A100 80GB, 48 hours", // TODO
    baseModel: "TODO: e.g. Mistral-7B / trained from scratch", // TODO
  },

  // Recharts line chart data — training loss over steps
  trainingLoss: [
    { step: 0, loss: 3.8 },
    { step: 500, loss: 3.1 },
    { step: 1000, loss: 2.6 },
    { step: 2000, loss: 2.1 },
    { step: 4000, loss: 1.7 },
    { step: 8000, loss: 1.4 },
    { step: 16000, loss: 1.2 },
    { step: 32000, loss: 1.05 },
  ], // TODO: replace with real training run data

  // Hugging Face Space embed URL
  playgroundUrl: "TODO: https://huggingface.co/spaces/manpanchotiya/YOUR_SPACE", // TODO

  links: {
    github: "TODO: https://github.com/manpanchotiya/YOUR_REPO", // TODO
    notebook: "TODO: Colab or Kaggle notebook URL", // TODO
    blog: "TODO: Blog post URL", // TODO
  },
};
