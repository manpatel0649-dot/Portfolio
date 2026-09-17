export const about = {
  photo: "/images/profile.jpg", // TODO: add photo to /public/images/
  quote: {
    before: "I learned ML by building it from the math up — now I build ",
    italic: "companies",
    after: " on top of it.",
  },
  bio: "[ 3–4 lines in your own words: how you started, what you build today, what you're looking for next. ]",

  timeline: [
    { label: "Start", text: "Python, data science & ML from scratch",     now: false },
    { label: "Build", text: "Classical ML & NLP projects, custom regression from math", now: false },
    { label: "Found", text: "Aoneq Labs — AI agents for businesses",       now: false },
    { label: "Found", text: "Qeist.io — AI test-case generation",          now: false },
    { label: "Now",   text: "LLM Lab — training my own language models",   now: true  },
  ],
};
