/**
 * lib/skills/curriculum/subjects/scikit_learn.ts
 * 
 * Scikit-Learn Classical Machine Learning & Pipelines Curriculum:
 * Estimators, Transformers, Pipelines, Feature Unions, Cross-Validation,
 * Hyperparameter Optimization, and Model Diagnostics.
 */

import { CanonicalSubject } from "../types";

export const SCIKIT_LEARN_SUBJECT: CanonicalSubject = {
  slug: "scikit_learn",
  name: "Scikit-Learn & ML Pipelines",
  icon: "⚙️",
  category: "Programming & Data Stack",
  tagline: "Composable Estimators, Leakage-Free Pipelines & Cross-Validation",
  description: "Master modular machine learning engineering: scikit-learn's fit/transform interface, ColumnTransformers, leakage-free Pipelines, StratifiedKFold validation, and hyperparameter tuning.",
  estimatedHours: 25,
  prerequisites: ["python", "numpy", "pandas", "machine_learning"],
  chapters: [
    {
      slug: "pipelines-and-leakage",
      chapterNumber: 1,
      title: "Chapter 1: Scikit-Learn Pipelines & Preventing Data Leakage",
      description: "Prevent subtle target and test-set data leakage by chaining preprocessors and estimators in atomic Pipeline objects.",
      topics: [
        {
          slug: "pipeline-architecture",
          title: "The Estimator/Transformer Contract & Pipelines",
          summary: "Encapsulate feature scaling, imputation, and model fitting so test sets remain strictly unseen during cross-validation.",
          subtopics: [
            {
              id: "skl-101",
              slug: "leakage-free-ml-pipelines",
              title: "Pipeline Architecture: Encapsulating fit_transform to Eliminate Data Leakage",
              subjectSlug: "scikit_learn",
              chapterSlug: "pipelines-and-leakage",
              topicSlug: "pipeline-architecture",
              estimatedMinutes: 30,
              difficulty: "intermediate",
              canonicalSkill: "classical_ml_modeling",
              prerequisites: [],
              learningGoal: "Construct a scikit-learn Pipeline combining SimpleImputer, StandardScaler, and LogisticRegression to guarantee 0% data leakage during cross-validation.",
              intuitiveStory: "Imagine an exam where a student sneaks a peek at the answer key while studying. They get 100% on the practice test, but fail the real final exam. Fitting your scaler on the entire dataset before train/test splitting is that peek at the answer key.",
              analogy: "A Pipeline is a hermetically sealed test envelope: preprocessors can only look at the training partition inside the envelope.",
              formalConcept: "When feature scaling or imputation uses statistics (mean, std) calculated over the entire dataset prior to splitting, information from the test fold leaks into the training fold. Pipeline.fit() fits transformers strictly on the train folds during each K-Fold cross-validation step.",
              mathFormula: "\\mu_{\\text{train}} = \\frac{1}{N_{\\text{train}}} \\sum_{i \\in \\text{train}} x_i, \\quad X_{\\text{test, scaled}} = \\frac{X_{\\text{test}} - \\mu_{\\text{train}}}{\\sigma_{\\text{train}}}",
              productionSignificance: "Data leakage produces artificially optimistic offline cross-validation scores (e.g. 96% ROC-AUC) that collapse to 60% when deployed to live customer traffic.",
              visualType: "training_curve",
              mermaidDiagram: `graph LR
    Raw["Raw Training Data"] --> Pipeline["Scikit-Learn Pipeline Object"]
    subgraph Pipe["Inside Pipeline"]
        Imp["Step 1: SimpleImputer (median)"] --> Scale["Step 2: StandardScaler"]
        Scale --> Model["Step 3: Classifier Estimator"]
    end
    Pipeline --> Fitted["Fitted Pipeline: Transforms and Predicts Unseen Data Atomically"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Constructing an Atomic Pipeline",
                  explanation: "Chains imputation, scaling, and model into a single callable object.",
                  codeOrQuery: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression

pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(penalty="l2"))
])

print("Pipeline steps:", [name for name, _ in pipe.steps])`,
                  outputSummary: "['imputer', 'scaler', 'classifier']"
                }
              ],
              audioNarrationScript: "Never scale your data before performing train-test split or cross-validation. If you compute the mean across all rows, your training model receives information about the distribution of the test set. By wrapping your preprocessors and models inside a scikit-learn Pipeline, scikit-learn guarantees that transformations are fit strictly on the training partition.",
              coBuildSlot: {
                slotId: "skl-slot-101",
                instruction: "Complete the Pipeline instantiation with 'scaler' using StandardScaler() and 'model' using LogisticRegression().",
                starterSnippet: `from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\n\ndef make_pipeline():\n    return Pipeline([\n        ("scaler", StandardScaler()),\n        ("model", LogisticRegression())\n    ])`,
                expectedPattern: "Pipeline\\(\\s*\\[\\s*\\([\"']scaler[\"'],\\s*StandardScaler\\(\\)\\)",
                hint1: "Pass a list of (name, step_object) tuples to Pipeline().",
                hint2: "Write: Pipeline([('scaler', StandardScaler()), ('model', LogisticRegression())])",
                validationExplanation: "Correctly constructs sequential scikit-learn Pipeline."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
import numpy as np

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LogisticRegression())
])

X_train = np.array([[1.0, 20.0], [2.0, 30.0], [3.0, 15.0], [4.0, 45.0]])
y_train = np.array([0, 0, 1, 1])

pipe.fit(X_train, y_train)
print("Pipeline score on train:", pipe.score(X_train, y_train))
`,
              debugFault: {
                faultId: "skl-fault-101",
                title: "Data Leakage: Calling fit_transform on Entire Dataset Prior to Cross-Validation",
                buggyCodeOrConfig: `from sklearn.preprocessing import StandardScaler
def evaluate(X, y, model):
    # Bug: Scaling before split leaks test fold mean/variance into training
    X_scaled = StandardScaler().fit_transform(X)
    return cross_val_score(model, X_scaled, y, cv=5)`,
                correctCodeOrConfig: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
def evaluate(X, y, model):
    # Pipeline fits scaler strictly on train folds inside cross_val_score
    pipe = make_pipeline(StandardScaler(), model)
    return cross_val_score(pipe, X, y, cv=5)`,
                diagnosticHint: "Pass a Pipeline to cross_val_score so the scaler is fit only on the 4 train folds during each iteration.",
                explanation: "Wrapping the scaler in a Pipeline ensures cross_val_score re-fits the scaler independently for each split."
              },
              comprehensionChecks: [
                {
                  id: "skl-cc-101a",
                  question: "What specific phenomenon occurs when a data scientist fits a MinMaxScaler on the whole dataset before train/test splitting?",
                  options: [
                    "Overfitting is cured.",
                    "Data Leakage (information from the test distribution subtly contaminates the training phase).",
                    "A runtime SyntaxError.",
                    "The number of rows doubles."
                  ],
                  correctIndex: 1,
                  explanation: "The global min and max used for scaling incorporate test fold extremes, leaking distribution boundaries into training."
                }
              ],
              independentChallenge: {
                challengeId: "skl-chal-101",
                title: "ColumnTransformer Feature Pipeline",
                description: "Write a function get_feature_pipeline() that applies StandardScaler to numerical columns and OneHotEncoder to categorical columns.",
                starterCode: `from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def get_feature_pipeline(num_cols: list[str], cat_cols: list[str]):
    return ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)
    ])
`,
                solutionCode: `from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

def get_feature_pipeline(num_cols: list[str], cat_cols: list[str]):
    return ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)
    ])
`,
                testCases: [
                  {
                    input: "num_cols=['age', 'income'], cat_cols=['city']",
                    expectedOutput: "Valid ColumnTransformer with 2 transformers",
                    description: "Correctly routes heterogeneous column types to their appropriate preprocessors."
                  }
                ],
                rubric: {
                  correctness: 40,
                  codeQuality: 30,
                  efficiency: 30
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

