// "From Scratch Lab" section — algorithms implemented without libraries

export type ScratchAlgorithm = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  codeSnippet: string; // Python snippet to display
  animationType: "line-fit" | "sigmoid" | "custom";
};

export const scratchAlgorithms: ScratchAlgorithm[] = [
  {
    id: "linear-regression",
    title: "Linear Regression",
    subtitle: "Gradient Descent from scratch",
    description:
      "Implemented ordinary least squares with gradient descent — no scikit-learn, just NumPy and math.", // TODO: refine
    animationType: "line-fit",
    codeSnippet: `# Linear Regression — pure NumPy
import numpy as np

class LinearRegression:
    def __init__(self, lr=0.01, epochs=1000):
        self.lr = lr
        self.epochs = epochs
        self.w = self.b = 0

    def fit(self, X, y):
        n = len(y)
        for _ in range(self.epochs):
            y_hat = self.w * X + self.b
            self.w -= self.lr * (2/n) * np.dot(X, y_hat - y)
            self.b -= self.lr * (2/n) * np.sum(y_hat - y)

    def predict(self, X):
        return self.w * X + self.b`,
  },
  {
    id: "logistic-regression",
    title: "Logistic Regression",
    subtitle: "Binary classification, no libraries",
    description:
      "Sigmoid activation + binary cross-entropy loss, trained with gradient descent from scratch.", // TODO: refine
    animationType: "sigmoid",
    codeSnippet: `# Logistic Regression — pure NumPy
import numpy as np

class LogisticRegression:
    def __init__(self, lr=0.01, epochs=1000):
        self.lr = lr
        self.epochs = epochs
        self.w = self.b = 0

    def _sigmoid(self, z):
        return 1 / (1 + np.exp(-z))

    def fit(self, X, y):
        n = len(y)
        for _ in range(self.epochs):
            p = self._sigmoid(np.dot(X, self.w) + self.b)
            self.w -= self.lr * np.dot(X.T, p - y) / n
            self.b -= self.lr * np.sum(p - y) / n

    def predict(self, X):
        return (self._sigmoid(np.dot(X, self.w) + self.b) >= 0.5).astype(int)`,
  },
];
