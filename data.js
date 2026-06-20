const statisticsSessions = [
  { day: "Day 01", date: "2026-06-07", reminderDate: "2026-06-07", week: "Week 1", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Descriptive Statistics and EDA", topics: ["Descriptive Statistics"], resources: "PSDS Ch. 1; OpenIntro review sections", importantConcepts: "Data types, mean, median, mode, variance, standard deviation, IQR, percentiles, outliers, robust summaries.", practiceQuestions: "Summarize one business dataset; compare mean vs median; identify outliers and explain business impact.", tasks: "Read PSDS EDA sections, work 5 summary-stat examples, write interview notes on robust statistics.", hours: 1.5, notes: "Upload handwritten/formula notes here after completion.", notesUpload: "", visible: true },
  { day: "Day 02", date: "2026-06-08", reminderDate: "2026-06-08", week: "Week 1", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Probability Basics and Counting", topics: ["Probability"], resources: "BH Ch. 1; selected counting examples", importantConcepts: "Sample spaces, events, complements, union/intersection, multiplication rule, permutations, combinations.", practiceQuestions: "Solve 10 counting and probability drills; explain why each denominator is correct.", tasks: "Read BH counting basics, solve interview-style card/dice/arrangement problems.", hours: 1.5, notes: "Upload probability drill notes here.", notesUpload: "", visible: true },
  { day: "Day 03", date: "2026-06-09", reminderDate: "2026-06-09", week: "Week 1", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Conditional Probability and Independence", topics: ["Probability"], resources: "BH Ch. 2", importantConcepts: "Conditional probability, multiplication rule, independence, conditional independence, law of total probability.", practiceQuestions: "Solve 8 conditional probability questions; include one product funnel and one credit approval example.", tasks: "Read BH conditional probability, write definitions in your own words, solve drills.", hours: 1.5, notes: "Add examples that confused you.", notesUpload: "", visible: true },
  { day: "Day 04", date: "2026-06-10", reminderDate: "2026-06-10", week: "Week 1", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Bayes Theorem for Fraud and Risk", topics: ["Probability", "Business Analytics"], resources: "BH Ch. 2; PSDS business examples", importantConcepts: "Bayes theorem, base rates, false positives, false negatives, posterior probability, screening tests.", practiceQuestions: "Solve 8 BFSI-style Bayes cases for fraud alerts, default flags, and risk screening.", tasks: "Read Bayes examples, create one confusion-matrix-to-posterior explanation.", hours: 1.5, notes: "Write a clean Bayes interview template.", notesUpload: "", visible: true },
  { day: "Day 05", date: "2026-06-11", reminderDate: "2026-06-11", week: "Week 1", sessionType: "Core", status: "Complete", progress: 100, focusArea: "Random Variables, PMF/CDF, Expectation", topics: ["Probability", "Distributions"], resources: "BH Ch. 3", importantConcepts: "Discrete and continuous random variables, PMF, PDF, CDF, expectation, linearity of expectation, LOTUS, indicator variables, empirical risk, Monte Carlo estimates.", practiceQuestions: "Compute expected value for transaction loss, customer value, model loss, and product reward scenarios.", tasks: "Read BH random variables, solve EV problems, write expected loss formula notes.", hours: 1.5, notes: "Detailed Word notes completed for Day 5 with research engineer, data scientist, and BFSI applications.", notesUpload: "Statistics_Day_5_Random_Variables_PMF_CDF_Expectation_Notes.docx", visible: true },
  { day: "Day 06", date: "2026-06-12", reminderDate: "2026-06-12", week: "Week 1", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Variance, Covariance, Correlation", topics: ["Descriptive Statistics", "Probability"], resources: "BH Ch. 4; PSDS correlation sections", importantConcepts: "Variance, standard deviation, covariance, correlation, covariance matrix, correlation vs causation.", practiceQuestions: "Interpret correlation in credit score, income, default risk, and product usage examples.", tasks: "Read variance/covariance sections, solve 6 calculation and interpretation questions.", hours: 1.5, notes: "Add correlation-vs-causation examples.", notesUpload: "", visible: true },
  { day: "Day 07", date: "2026-06-13", reminderDate: "2026-06-13", week: "Week 1", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Bernoulli, Binomial, Geometric Distributions", topics: ["Distributions"], resources: "BH distribution chapters", importantConcepts: "Bernoulli trials, binomial count, geometric waiting time, assumptions, mean/variance.", practiceQuestions: "Model clicks, loan approvals, defaults, and first fraud occurrence using correct distributions.", tasks: "Read distribution examples, solve 8 distribution identification problems.", hours: 1.5, notes: "Create a distribution selection cheat sheet.", notesUpload: "", visible: true },
  { day: "Revision 01", date: "2026-06-14", reminderDate: "2026-06-14", week: "Week 1", sessionType: "Revision", status: "Pending", progress: 0, focusArea: "Week 1 Review: Probability and Distributions", topics: ["Probability", "Distributions"], resources: "BH Ch. 1-4 review; personal notes", importantConcepts: "Counting, conditional probability, Bayes, random variables, expectation, variance, key distributions.", practiceQuestions: "Redo 12 mixed problems; explain 3 solutions aloud as if in an interview.", tasks: "Review notes, create one-page formula sheet, mark weak concepts for retry.", hours: 1.5, notes: "Upload Week 1 revision sheet.", notesUpload: "", visible: true },
  { day: "Day 08", date: "2026-06-15", reminderDate: "2026-06-15", week: "Week 2", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Poisson, Exponential, Normal Distributions", topics: ["Distributions"], resources: "BH distributions; PSDS distribution review", importantConcepts: "Poisson events, exponential waiting time, normal distribution, z-scores, empirical rule.", practiceQuestions: "Model transactions per hour, time to default event, and standardized business metrics.", tasks: "Read distribution intuition, solve 8 applied distribution questions.", hours: 1.5, notes: "Upload distribution comparison notes.", notesUpload: "", visible: true },
  { day: "Day 09", date: "2026-06-16", reminderDate: "2026-06-16", week: "Week 2", sessionType: "Core", status: "Pending", progress: 0, focusArea: "LLN, CLT, Sampling Distributions", topics: ["Sampling"], resources: "BH LLN/CLT; PSDS sampling distributions", importantConcepts: "Law of large numbers, central limit theorem, sampling distribution, standard error.", practiceQuestions: "Explain CLT for conversion rate, loss rate, and average transaction value metrics.", tasks: "Read CLT sections, solve 6 standard error problems, write interview explanation.", hours: 1.5, notes: "Add CLT explanation in simple language.", notesUpload: "", visible: true },
  { day: "Day 10", date: "2026-06-17", reminderDate: "2026-06-17", week: "Week 2", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Sampling Bias, Leakage, Missingness", topics: ["Sampling", "Business Analytics"], resources: "PSDS sampling and data quality sections", importantConcepts: "Selection bias, survivorship bias, data leakage, missing completely/random/not random, train-test contamination.", practiceQuestions: "Diagnose 5 flawed MAANG/BFSI datasets and propose fixes.", tasks: "Read data quality sections, create checklist for interview case studies.", hours: 1.5, notes: "Upload bad-data checklist.", notesUpload: "", visible: true },
  { day: "Day 11", date: "2026-06-18", reminderDate: "2026-06-18", week: "Week 2", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Confidence Intervals and Standard Error", topics: ["Hypothesis Testing"], resources: "PSDS confidence interval sections", importantConcepts: "Confidence interval meaning, standard error, margin of error, confidence vs probability, practical interpretation.", practiceQuestions: "Compute and interpret CI for conversion rate, approval rate, and default rate.", tasks: "Read CI examples, solve 8 interval interpretation problems.", hours: 1.5, notes: "Write common CI mistakes.", notesUpload: "", visible: true },
  { day: "Day 12", date: "2026-06-19", reminderDate: "2026-06-19", week: "Week 2", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Hypothesis Testing and p-values", topics: ["Hypothesis Testing"], resources: "PSDS hypothesis testing sections", importantConcepts: "Null/alternative hypotheses, test statistic, p-value, significance level, practical vs statistical significance.", practiceQuestions: "Interpret 10 p-values and decide business action for each.", tasks: "Read hypothesis test flow, solve interpretation questions, write decision template.", hours: 1.5, notes: "Upload hypothesis testing decision flow.", notesUpload: "", visible: true },
  { day: "Day 13", date: "2026-06-20", reminderDate: "2026-06-20", week: "Week 2", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Type I/II Errors, Power, Sample Size", topics: ["Hypothesis Testing", "Experiment Design"], resources: "PSDS power/sample size sections", importantConcepts: "False positives, false negatives, power, minimum detectable effect, sample size tradeoffs.", practiceQuestions: "Design sample size for product A/B test and fraud model monitoring case.", tasks: "Read power examples, solve 5 MDE/sample-size reasoning cases.", hours: 1.5, notes: "Summarize power tradeoffs.", notesUpload: "", visible: true },
  { day: "Day 14", date: "2026-06-21", reminderDate: "2026-06-21", week: "Week 2", sessionType: "Core", status: "Pending", progress: 0, focusArea: "A/B Testing and Experiment Design", topics: ["Experiment Design"], resources: "PSDS experiments; MAANG product analytics notes", importantConcepts: "Randomization, control/treatment, primary metric, guardrails, novelty effects, ramp-up, experiment validity.", practiceQuestions: "Write one full product experiment design for checkout conversion or feed ranking.", tasks: "Read A/B sections, draft experiment memo with metric and decision rule.", hours: 1.5, notes: "Upload A/B test memo.", notesUpload: "", visible: true },
  { day: "Revision 02", date: "2026-06-22", reminderDate: "2026-06-22", week: "Week 2", sessionType: "Revision", status: "Pending", progress: 0, focusArea: "Week 2 Review: Inference and Experimentation", topics: ["Hypothesis Testing", "Experiment Design"], resources: "PSDS review; personal notes", importantConcepts: "CLT, standard error, CI, p-value, power, MDE, A/B design, guardrails.", practiceQuestions: "Redo one CI case, one p-value case, one sample-size case, and one A/B design case.", tasks: "Review notes, correct mistakes, create interview-ready inference checklist.", hours: 1.5, notes: "Upload Week 2 revision checklist.", notesUpload: "", visible: true },
  { day: "Day 15", date: "2026-06-23", reminderDate: "2026-06-23", week: "Week 3", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Multiple Testing and Guardrail Metrics", topics: ["Hypothesis Testing", "Experiment Design"], resources: "PSDS multiple testing; ESL model assessment ideas", importantConcepts: "Multiple comparisons, false discovery, family-wise error, guardrail metrics, peeking risk.", practiceQuestions: "Evaluate an experiment with 10 metrics and decide which results are trustworthy.", tasks: "Read multiple-testing section, solve 5 false-positive scenarios.", hours: 1.5, notes: "Add notes on false positives in dashboards.", notesUpload: "", visible: true },
  { day: "Day 16", date: "2026-06-24", reminderDate: "2026-06-24", week: "Week 3", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Bootstrap and Permutation Tests", topics: ["Hypothesis Testing"], resources: "PSDS resampling; ESL Ch. 8 ideas", importantConcepts: "Bootstrap sampling, bootstrap CI, permutation test, non-parametric inference, uncertainty estimation.", practiceQuestions: "Run/outline bootstrap CI and permutation test for conversion or loss-rate difference.", tasks: "Read resampling sections, solve 6 resampling interpretation questions.", hours: 1.5, notes: "Upload bootstrap/permutation notes.", notesUpload: "", visible: true },
  { day: "Day 17", date: "2026-06-25", reminderDate: "2026-06-25", week: "Week 3", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Chi-square Tests and Categorical Variables", topics: ["Hypothesis Testing", "Business Analytics"], resources: "PSDS chi-square sections", importantConcepts: "Contingency tables, chi-square goodness-of-fit, independence test, expected counts, categorical association.", practiceQuestions: "Test association between fraud flag and merchant category; interpret business meaning.", tasks: "Read chi-square examples, solve 6 contingency table questions.", hours: 1.5, notes: "Upload categorical testing notes.", notesUpload: "", visible: true },
  { day: "Day 18", date: "2026-06-26", reminderDate: "2026-06-26", week: "Week 3", sessionType: "Core", status: "Pending", progress: 0, focusArea: "ANOVA and Multiple Group Comparison", topics: ["Hypothesis Testing"], resources: "PSDS ANOVA sections", importantConcepts: "Between/within group variance, F-test, post-hoc intuition, comparing more than two variants.", practiceQuestions: "Compare three product variants and interpret whether follow-up tests are needed.", tasks: "Read ANOVA examples, solve 5 multi-group comparison cases.", hours: 1.5, notes: "Upload ANOVA summary.", notesUpload: "", visible: true },
  { day: "Day 19", date: "2026-06-27", reminderDate: "2026-06-27", week: "Week 3", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Linear Regression Fundamentals", topics: ["Regression"], resources: "ISLR Ch. 3; PSDS regression review", importantConcepts: "Slope, intercept, residuals, least squares, R-squared, residual standard error, coefficient interpretation.", practiceQuestions: "Interpret coefficients for spend vs revenue and income vs credit limit examples.", tasks: "Read ISLR linear regression, solve coefficient interpretation drills.", hours: 1.5, notes: "Upload regression formula notes.", notesUpload: "", visible: true },
  { day: "Day 20", date: "2026-06-28", reminderDate: "2026-06-28", week: "Week 3", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Multiple Regression, Interactions, Confounding", topics: ["Regression", "Business Analytics"], resources: "ISLR Ch. 3", importantConcepts: "Multiple regression, dummy variables, interaction terms, omitted variable bias, confounding, multicollinearity.", practiceQuestions: "Explain credit-risk feature effects with controls and interaction terms.", tasks: "Read multiple regression sections, solve 6 interpretation cases.", hours: 1.5, notes: "Add confounding examples.", notesUpload: "", visible: true },
  { day: "Day 21", date: "2026-06-29", reminderDate: "2026-06-29", week: "Week 3", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Regression Diagnostics and Assumptions", topics: ["Regression"], resources: "ISLR Ch. 3; PSDS regression diagnostics", importantConcepts: "Linearity, residual plots, heteroskedasticity, leverage, influential points, nonlinearity, transformation.", practiceQuestions: "Diagnose 5 regression output/residual plot scenarios.", tasks: "Read diagnostics, create regression assumption checklist.", hours: 1.5, notes: "Upload diagnostics checklist.", notesUpload: "", visible: true },
  { day: "Revision 03", date: "2026-06-30", reminderDate: "2026-06-30", week: "Week 3", sessionType: "Revision", status: "Pending", progress: 0, focusArea: "Week 3 Review: Regression and Classification Prep", topics: ["Regression", "Hypothesis Testing"], resources: "ISLR Ch. 3 review; PSDS review", importantConcepts: "Testing, resampling, chi-square, ANOVA, regression interpretation, confounding, diagnostics.", practiceQuestions: "Redo one test, one ANOVA case, and two regression interpretation cases.", tasks: "Review Week 3 notes, build regression interview cheat sheet.", hours: 1.5, notes: "Upload Week 3 revision sheet.", notesUpload: "", visible: true },
  { day: "Day 22", date: "2026-07-01", reminderDate: "2026-07-01", week: "Week 4", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Logistic Regression, Odds, Log-loss", topics: ["Regression"], resources: "ISLR Ch. 4; ESL Ch. 4 selected", importantConcepts: "Logit, odds, odds ratio, probability output, log-loss, decision boundary, coefficient interpretation.", practiceQuestions: "Interpret fraud/default logistic regression coefficients and odds ratios.", tasks: "Read logistic regression, solve 6 odds/probability interpretation questions.", hours: 1.5, notes: "Upload logistic regression notes.", notesUpload: "", visible: true },
  { day: "Day 23", date: "2026-07-02", reminderDate: "2026-07-02", week: "Week 4", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Classification Metrics and Imbalanced Data", topics: ["Business Analytics"], resources: "ISLR Ch. 4; PSDS classification metrics", importantConcepts: "Confusion matrix, precision, recall, specificity, F1, ROC-AUC, PR-AUC, class imbalance.", practiceQuestions: "Choose metrics for fraud detection, churn, loan default, and search ranking cases.", tasks: "Read metrics sections, solve 8 metric-selection scenarios.", hours: 1.5, notes: "Upload metric comparison table.", notesUpload: "", visible: true },
  { day: "Day 24", date: "2026-07-03", reminderDate: "2026-07-03", week: "Week 4", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Thresholding and Calibration", topics: ["Business Analytics", "Regression"], resources: "ISLR Ch. 4; ESL model assessment; calibration notes", importantConcepts: "Decision thresholds, cost matrix, calibration curve, Brier score, expected loss, precision-recall tradeoff.", practiceQuestions: "Set fraud/default threshold using business costs and customer friction.", tasks: "Read threshold/calibration notes, solve 5 threshold decision cases.", hours: 1.5, notes: "Upload threshold decision template.", notesUpload: "", visible: true },
  { day: "Day 25", date: "2026-07-04", reminderDate: "2026-07-04", week: "Week 4", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Bias-Variance Tradeoff and Overfitting", topics: ["Business Analytics"], resources: "ISLR Ch. 2; ESL Ch. 2 and Ch. 7 selected", importantConcepts: "Bias, variance, irreducible error, flexibility, model complexity, overfitting, underfitting.", practiceQuestions: "Explain overfitting for fraud model and product personalization model.", tasks: "Read bias-variance sections, draw tradeoff diagram from memory.", hours: 1.5, notes: "Upload bias-variance diagram.", notesUpload: "", visible: true },
  { day: "Day 26", date: "2026-07-05", reminderDate: "2026-07-05", week: "Week 4", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Cross-validation and Model Selection", topics: ["Business Analytics"], resources: "ISLR Ch. 5; ESL Ch. 7", importantConcepts: "Train/validation/test split, k-fold CV, LOOCV, test error estimation, model selection leakage.", practiceQuestions: "Compare three candidate models using CV and explain final selection.", tasks: "Read CV sections, solve model-selection scenarios.", hours: 1.5, notes: "Upload CV checklist.", notesUpload: "", visible: true },
  { day: "Day 27", date: "2026-07-06", reminderDate: "2026-07-06", week: "Week 4", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Regularization: Ridge, Lasso, Elastic Net", topics: ["Regression"], resources: "ISLR Ch. 6; ESL Ch. 3 selected", importantConcepts: "Shrinkage, L1/L2 penalty, lambda, feature selection, multicollinearity, elastic net tradeoff.", practiceQuestions: "Choose regularization for credit-risk model with many correlated features.", tasks: "Read regularization sections, solve 6 method-choice cases.", hours: 1.5, notes: "Upload regularization summary.", notesUpload: "", visible: true },
  { day: "Day 28", date: "2026-07-07", reminderDate: "2026-07-07", week: "Week 4", sessionType: "Core", status: "Pending", progress: 0, focusArea: "Trees, Random Forests, Boosting", topics: ["Business Analytics"], resources: "ISLR Ch. 8; ESL Ch. 9, 10, 15 selected", importantConcepts: "Decision trees, bagging, random forest, boosting, variance reduction, feature importance, interpretability.", practiceQuestions: "Explain ensemble tradeoffs for fraud, credit, and churn modeling.", tasks: "Read tree/ensemble sections, compare tree vs regression in 4 cases.", hours: 1.5, notes: "Upload ensemble tradeoff table.", notesUpload: "", visible: true },
  { day: "Revision 04", date: "2026-07-08", reminderDate: "2026-07-08", week: "Week 4", sessionType: "Revision", status: "Pending", progress: 0, focusArea: "Week 4 Review: Model Selection and Ensembles", topics: ["Regression", "Business Analytics"], resources: "ISLR Ch. 4-8 review; ESL selected review", importantConcepts: "Logistic regression, metrics, calibration, bias-variance, CV, regularization, trees, ensembles.", practiceQuestions: "Redo one classification metric case, one calibration case, and one model selection case.", tasks: "Review Week 4 notes, create model-selection decision tree.", hours: 1.5, notes: "Upload Week 4 revision notes.", notesUpload: "", visible: true },
  { day: "Day 29", date: "2026-07-09", reminderDate: "2026-07-09", week: "Week 5", sessionType: "Core", status: "Pending", progress: 0, focusArea: "MAANG Capstone: Product Metrics and Experiment Design", topics: ["Experiment Design", "Business Analytics"], resources: "PSDS experiments; ISLR model assessment; personal case notes", importantConcepts: "North-star metric, guardrails, randomization, power, launch decision, metric tradeoffs, causal claims.", practiceQuestions: "Solve one full product analytics case from problem framing to decision recommendation.", tasks: "Write a complete experiment memo with assumptions, metrics, risks, and decision rule.", hours: 1.5, notes: "Upload MAANG capstone memo.", notesUpload: "", visible: true },
  { day: "Day 30", date: "2026-07-10", reminderDate: "2026-07-10", week: "Week 5", sessionType: "Core", status: "Pending", progress: 0, focusArea: "BFSI Capstone: Credit, Fraud, Default Risk", topics: ["Probability", "Regression", "Business Analytics"], resources: "BH Bayes; PSDS metrics; ISLR logistic regression", importantConcepts: "Expected loss, default probability, fraud precision/recall, thresholding, calibration, explainability, compliance.", practiceQuestions: "Solve one full BFSI case: build a fraud/default model and recommend deployment threshold.", tasks: "Write a risk analytics memo with model, metric, threshold, and monitoring plan.", hours: 1.5, notes: "Upload BFSI capstone memo.", notesUpload: "", visible: true },
  { day: "Day 31", date: "2026-07-11", reminderDate: "2026-07-11", week: "Week 5", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Survival Analysis I: Censoring, Survival, Hazard", topics: ["Business Analytics"], resources: "Survival analysis supplement; applied churn/default notes", importantConcepts: "Time-to-event data, censoring, survival function, hazard function, event definition, observation window.", practiceQuestions: "Frame churn, loan default, and customer attrition as survival problems.", tasks: "Read survival intro, identify censoring in 4 BFSI/product examples.", hours: 1.5, notes: "Upload survival basics notes.", notesUpload: "", visible: true },
  { day: "Day 32", date: "2026-07-12", reminderDate: "2026-07-12", week: "Week 5", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Survival Analysis II: Kaplan-Meier and Cox Model", topics: ["Business Analytics"], resources: "Survival supplement; Cox proportional hazards notes", importantConcepts: "Kaplan-Meier curve, median survival, log-rank test intuition, Cox proportional hazards, hazard ratio.", practiceQuestions: "Interpret a survival curve and Cox output for customer churn or loan default timing.", tasks: "Read KM/Cox notes, solve 5 interpretation cases.", hours: 1.5, notes: "Upload KM/Cox interpretation notes.", notesUpload: "", visible: true },
  { day: "Day 33", date: "2026-07-13", reminderDate: "2026-07-13", week: "Week 5", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Causal Inference I: DAGs and Confounding", topics: ["Experiment Design", "Business Analytics"], resources: "Causal Inference: The Mixtape selected; DAG notes", importantConcepts: "DAGs, confounders, mediators, colliders, selection bias, backdoor paths, adjustment sets.", practiceQuestions: "Draw DAGs for pricing, credit limit increase, and product notification impact.", tasks: "Read DAG intro, create 3 causal diagrams and list adjustment variables.", hours: 1.5, notes: "Upload DAG sketches.", notesUpload: "", visible: true },
  { day: "Day 34", date: "2026-07-14", reminderDate: "2026-07-14", week: "Week 5", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Causal Inference II: ATE, Matching, Propensity Scores", topics: ["Experiment Design"], resources: "Causal inference supplement; matching/propensity notes", importantConcepts: "Potential outcomes, ATE, ATT, selection on observables, matching, propensity score, balance checks.", practiceQuestions: "Estimate treatment impact when A/B testing is not possible; explain assumptions.", tasks: "Read ATE/matching notes, solve 4 observational-study cases.", hours: 1.5, notes: "Upload treatment-effect notes.", notesUpload: "", visible: true },
  { day: "Day 35", date: "2026-07-15", reminderDate: "2026-07-15", week: "Week 5", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Causal Inference III: Difference-in-Differences and IV Intuition", topics: ["Experiment Design", "Business Analytics"], resources: "Causal supplement; DiD and IV notes", importantConcepts: "Parallel trends, treatment/control groups over time, DiD estimator, instrumental variables intuition, policy impact.", practiceQuestions: "Analyze policy/product change using pre/post and treatment/control groups.", tasks: "Read DiD notes, solve 3 policy/product impact cases.", hours: 1.5, notes: "Upload DiD assumptions checklist.", notesUpload: "", visible: true },
  { day: "Revision 05", date: "2026-07-16", reminderDate: "2026-07-16", week: "Week 5", sessionType: "Revision", status: "Pending", progress: 0, focusArea: "Week 5 Review: Advanced Survival and Causal Topics", topics: ["Experiment Design", "Business Analytics"], resources: "Survival + causal supplements; personal notes", importantConcepts: "Censoring, hazard, KM, Cox, DAGs, confounding, ATE, matching, propensity, DiD.", practiceQuestions: "Explain one survival case and one causal inference case end to end.", tasks: "Review advanced notes, create survival/causal interview cheat sheet.", hours: 1.5, notes: "Upload Week 5 advanced revision sheet.", notesUpload: "", visible: true },
  { day: "Day 36", date: "2026-07-17", reminderDate: "2026-07-17", week: "Week 6", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Time Series I: Trend, Seasonality, Stationarity", topics: ["Business Analytics"], resources: "Time series supplement; forecasting notes", importantConcepts: "Trend, seasonality, stationarity, autocorrelation, lag features, rolling statistics, leakage in time splits.", practiceQuestions: "Diagnose transaction volume, delinquency rate, and demand time series behavior.", tasks: "Read time-series basics, identify components in 4 business examples.", hours: 1.5, notes: "Upload time-series basics notes.", notesUpload: "", visible: true },
  { day: "Day 37", date: "2026-07-18", reminderDate: "2026-07-18", week: "Week 6", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Time Series II: Forecasting Validation and ARIMA Intuition", topics: ["Business Analytics"], resources: "Time series supplement; ARIMA intuition notes", importantConcepts: "Train/test by time, walk-forward validation, AR, MA, ARIMA intuition, forecast error metrics, backtesting.", practiceQuestions: "Design validation for transaction forecasting or risk signal monitoring.", tasks: "Read forecasting validation notes, solve 4 forecasting interview cases.", hours: 1.5, notes: "Upload forecasting validation checklist.", notesUpload: "", visible: true },
  { day: "Day 38", date: "2026-07-19", reminderDate: "2026-07-19", week: "Week 6", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "GAMs, Splines, and Nonlinear Models", topics: ["Regression"], resources: "ESL Ch. 5 and Ch. 9 selected; ISLR nonlinear notes", importantConcepts: "Splines, basis functions, GAMs, nonlinear relationships, smoothness, interpretability vs flexibility.", practiceQuestions: "Choose between linear regression, splines, GAM, and tree model for risk/product data.", tasks: "Read ESL selected sections, solve nonlinear modeling choice cases.", hours: 1.5, notes: "Upload nonlinear model notes.", notesUpload: "", visible: true },
  { day: "Day 39", date: "2026-07-20", reminderDate: "2026-07-20", week: "Week 6", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "SVMs, Kernels, and Margin Intuition", topics: ["Business Analytics"], resources: "ESL Ch. 12 selected; ISLR SVM notes", importantConcepts: "Maximum margin, support vectors, soft margin, kernel trick, radial kernel, high-dimensional boundaries.", practiceQuestions: "Explain when kernel methods may help and why they are harder to interpret in BFSI.", tasks: "Read SVM intuition, answer 5 conceptual interview questions.", hours: 1.5, notes: "Upload SVM intuition notes.", notesUpload: "", visible: true },
  { day: "Day 40", date: "2026-07-21", reminderDate: "2026-07-21", week: "Week 6", sessionType: "Advanced", status: "Pending", progress: 0, focusArea: "Model Risk, Drift, Monitoring, Explainability", topics: ["Business Analytics"], resources: "ESL model assessment; BFSI model validation notes; PSDS practical modeling notes", importantConcepts: "Calibration drift, data drift, concept drift, stability, monitoring, explainability, model governance, challenger models.", practiceQuestions: "Design a monitoring and validation plan for a fraud/default risk model.", tasks: "Write final model-risk memo with metrics, drift checks, retraining triggers, and explainability plan.", hours: 1.5, notes: "Upload model governance memo.", notesUpload: "", visible: true }
];

export const initialData = {
  profile: {
    name: "Your Name",
    title: "Data Scientist and Machine Learning Engineer",
    location: "India",
    mission:
      "I build practical AI and data products that turn ambiguous business problems into measurable systems, while learning advanced AI in public every day.",
    summary:
      "Data Scientist and ML Engineer with 1 year of professional experience, a degree from a top institute, and hands-on exposure to stakeholder discovery, analytics, model development, experimentation, and business solution delivery.",
    email: "you@example.com",
    resumeUrl: "assets/resume.pdf",
    socials: {
      github: "https://github.com/yourusername",
      linkedin: "https://www.linkedin.com/in/yourusername",
      x: "https://x.com/yourusername",
      kaggle: "https://www.kaggle.com/yourusername"
    },
    githubUsername: "yourusername",
    leetcodeUsername: "yourusername"
  },
  stats: [
    { label: "Professional experience", value: 1, suffix: " yr" },
    { label: "Projects shipped", value: 12, suffix: "+" },
    { label: "Study streak", value: 46, suffix: " days" },
    { label: "Learning hours", value: 420, suffix: "+" }
  ],
  pageVisibility: {
    home: true,
    now: true,
    about: true,
    experience: true,
    skills: true,
    projects: true,
    learning: true,
    dashboard: true,
    roadmap: true,
    research: true,
    blogs: true,
    resume: true,
    contact: true
  },
  now: {
    learning: "LLM engineering, retrieval systems, evaluation, and AI agents",
    building: "A business intelligence copilot that converts operational questions into governed analytics workflows",
    reading: "Designing Machine Learning Systems by Chip Huyen",
    research: "Evaluation frameworks for production RAG and agentic workflows",
    focus: "Production-ready AI systems that create business leverage",
    goals: ["Publish 3 technical breakdowns", "Ship one polished GenAI case study", "Complete MLOps deployment module"]
  },
  learningPlaylists: [
    {
      id: "statistics-advanced-45-sessions",
      title: "40-Day Statistics + Advanced Analytics Roadmap",
      category: "Statistics, MAANG and BFSI",
      notionDatabaseUrl: "https://app.notion.com/p/051bf939e4494495814432db72ff5b26",
      notionDataSourceId: "615b10c7-4074-403f-a837-7844e940ebb9",
      status: "Connected to Notion",
      description:
        "A 45-session tracker covering 40 MAANG/BFSI statistics sessions plus 5 weekly revision sessions, with references, concepts, practice tasks, reminders, and note upload support in Notion.",
      days: statisticsSessions
    }
  ],
  education: [
    {
      institute: "Top Institute Name",
      degree: "Degree in Data Science / Computer Science",
      period: "Graduated",
      details: "Strong foundation in statistics, programming, machine learning, research methods, and applied problem solving."
    }
  ],
  experience: [
    {
      company: "Current Company",
      designation: "Data Scientist / ML Engineer",
      period: "2025 - Present",
      location: "India",
      employmentType: "Full-time",
      isCurrent: true,
      businessFocus:
        "Work closely with business teams to understand operational problems, translate them into analytics and ML opportunities, and build practical solutions.",
      highlights: [
        "Partner with business teams to define problems, translate requirements, and build data-driven solutions.",
        "Develop analytics workflows, ML experiments, dashboards, and automation that improve decision quality.",
        "Communicate tradeoffs, insights, and model behavior to technical and non-technical stakeholders."
      ]
    }
  ],
  skills: [
    { name: "Python", level: 92, group: "Core" },
    { name: "SQL", level: 86, group: "Data" },
    { name: "Statistics", level: 82, group: "Foundations" },
    { name: "Machine Learning", level: 84, group: "AI" },
    { name: "Deep Learning", level: 68, group: "AI" },
    { name: "NLP", level: 74, group: "AI" },
    { name: "LLM Apps", level: 66, group: "GenAI" },
    { name: "MLOps", level: 54, group: "Systems" },
    { name: "Business Analysis", level: 88, group: "Business" },
    { name: "Stakeholder Communication", level: 85, group: "Business" }
  ],
  projects: [
    {
      title: "Stock Market Volatility and Risk Dashboard",
      roadmapStage: "Statistics",
      category: "Risk Analytics",
      status: "Current Project",
      overview: "A statistical risk dashboard that helps investors understand volatility, downside risk, market sensitivity, and diversification before taking a position.",
      problem: "Investors often look at returns without understanding volatility, drawdowns, correlation risk, and downside exposure.",
      dataset: "OHLCV stock data, adjusted close prices, benchmark index returns, sector metadata, and optional portfolio weights.",
      architecture: "Business Understanding -> Data -> Analytics -> Information -> Decision Making -> Intervention.",
      stack: ["Python", "Pandas", "NumPy", "SciPy", "Statsmodels", "Plotly", "Streamlit"],
      metrics: "Volatility, rolling standard deviation, beta, correlation, max drawdown, VaR, confidence intervals, and risk score.",
      demo: "projects/nse-stock-risk-dashboard/site/index.html",
      github: "https://github.com/yourusername/stock-volatility-risk-dashboard",
      notion: "https://app.notion.com/p/7c2d9bb6b1284817a46d2a28c5de79d2",
      lessons: "This project demonstrates statistical risk thinking, business decision thresholds, and intervention design rather than naive stock price prediction.",
      product: {
        name: "NSE Stock Risk Intelligence Dashboard",
        projectPath: "projects/nse-stock-risk-dashboard",
        siteUrl: "projects/nse-stock-risk-dashboard/site/index.html",
        dashboardGoal: "Stakeholders select an NSE stock, review risk, enter capital and trade plan, then receive a transparent decision label.",
        dataCard: {
          status: "Complete",
          rows: 3621,
          symbols: 6,
          latestDate: "2026-06-10",
          qualityIssues: 0,
          source: "Yahoo Finance chart API automated real-data fallback; NSE/NIFTY official pages documented as source-of-truth references.",
          cleanData: "data/stock_market/clean/stock_prices.csv",
          manifest: "data/stock_market/metadata/ingestion_manifest.json"
        },
        stocks: [
          { symbol: "RELIANCE", name: "Reliance Industries", rows: 604, latestDate: "2026-06-10", status: "Chart Ready", nextView: "OHLC + MA detail" },
          { symbol: "TCS", name: "Tata Consultancy Services", rows: 604, latestDate: "2026-06-10", status: "Chart Ready", nextView: "OHLC + MA detail" },
          { symbol: "HDFCBANK", name: "HDFC Bank", rows: 604, latestDate: "2026-06-10", status: "Chart Ready", nextView: "OHLC + MA detail" },
          { symbol: "INFY", name: "Infosys", rows: 604, latestDate: "2026-06-10", status: "Chart Ready", nextView: "OHLC + MA detail" },
          { symbol: "ICICIBANK", name: "ICICI Bank", rows: 604, latestDate: "2026-06-10", status: "Chart Ready", nextView: "OHLC + MA detail" },
          { symbol: "NIFTY50", name: "NIFTY 50 Benchmark", rows: 601, latestDate: "2026-06-10", status: "Benchmark Ready", nextView: "Benchmark OHLC detail" }
        ],
        featureRoadmap: [
          { name: "Data Card", status: "Complete", description: "Real-data source policy, schema, quality checks, and append strategy documented." },
          { name: "Continuous Data Pipeline", status: "Complete", description: "Incremental ingestion appends only missing rows and avoids duplicates." },
          { name: "Stock List", status: "Complete", description: "Pilot universe appears on the project card with latest date and row coverage." },
          { name: "Candlestick Detail", status: "Complete", description: "Click a stock to show OHLC candlestick patterns, volume bars, MA20, MA50, and recent price movement." },
          { name: "Risk Metrics", status: "Next", description: "Rolling volatility, drawdown, beta, correlation, and liquidity scores." },
          { name: "Position Sizing", status: "Pending", description: "User enters capital, risk percent, entry, stop-loss, and target." },
          { name: "Decision Engine", status: "Pending", description: "Suggest Avoid, Watchlist, Small Position, Normal Position, or Reduce Risk with reasons." }
        ]
      },
      phases: [
        { name: "Business Understanding", status: "Complete", summary: "Defined investor risk problem, success criteria, risk KPIs, and target decision.", link: "https://app.notion.com/p/4b91558654a44529a605471420a44b24", linkLabel: "Open sprint" },
        { name: "Data", status: "In Progress", summary: "Collect real OHLCV data, benchmark returns, manifest metadata, and incremental validation checks.", link: "https://app.notion.com/p/5609fc1688d540e4b33bee44aec7b708", linkLabel: "Open data sprint" },
        { name: "Analytics", status: "Pending", summary: "Calculate returns, volatility, rolling risk, correlation, beta, max drawdown, VaR, and confidence intervals." },
        { name: "Information", status: "Pending", summary: "Convert statistical outputs into insight cards, risk levels, charts, and investor-friendly explanations." },
        { name: "Decision Making", status: "Pending", summary: "Define buy, hold, avoid, rebalance, or watchlist rules based on transparent risk thresholds." },
        { name: "Intervention", status: "Pending", summary: "Create alerts, stop-loss guidance, diversification suggestions, and a recruiter-ready dashboard case study." }
      ]
    },
    {
      title: "Supply Chain Delay Analysis",
      roadmapStage: "Statistics",
      category: "Operations Analytics",
      status: "Upcoming",
      overview: "A statistical operations analytics project to identify delay drivers across warehouses, vendors, routes, and time periods.",
      problem: "Delivery delays reduce reliability, increase cost, and damage customer trust, but teams need statistical evidence before changing operations.",
      dataset: "Orders, shipment dates, promised delivery dates, actual delivery dates, warehouse, vendor, carrier, route, region, distance, and delay flags.",
      architecture: "Business Understanding -> Data -> Analytics -> Information -> Decision Making -> Intervention.",
      stack: ["Python", "Pandas", "SciPy", "Statsmodels", "Plotly", "Streamlit"],
      metrics: "Delay rate, average delay duration, SLA miss rate, confidence intervals, ANOVA, chi-square tests, and segment ranking.",
      demo: "https://example.com/supply-chain-delay",
      github: "https://github.com/yourusername/supply-chain-delay-analysis",
      notion: "https://app.notion.com/p/7c2d9bb6b1284817a46d2a28c5de79d2",
      lessons: "This project shows how statistics can move operations from blame-based decisions to evidence-based interventions.",
      phases: [
        { name: "Business Understanding", status: "Pending", summary: "Define delay reduction goal, SLA metric, stakeholders, and operational decision scope." },
        { name: "Data", status: "Pending", summary: "Prepare order, route, warehouse, vendor, and delivery timestamp data with delay labels." },
        { name: "Analytics", status: "Pending", summary: "Analyze delay rates, confidence intervals, ANOVA, chi-square tests, seasonality, and bottlenecks." },
        { name: "Information", status: "Pending", summary: "Show which warehouses, vendors, routes, or periods are statistically associated with delay." },
        { name: "Decision Making", status: "Pending", summary: "Prioritize route changes, vendor escalation, buffer inventory, or warehouse process fixes." },
        { name: "Intervention", status: "Pending", summary: "Measure pre/post impact and produce a monitoring dashboard for delay improvement." }
      ]
    },
    {
      title: "Customer Churn Statistical Analysis",
      roadmapStage: "Statistics",
      category: "Customer Analytics",
      status: "Queued",
      overview: "A statistical churn project that explains why customers leave and converts churn signals into retention decisions.",
      problem: "Retention teams need to know which customer segments are at risk, why they are at risk, and which interventions are worth the cost.",
      dataset: "Telecom or SaaS churn dataset with tenure, usage, billing, plan, complaints, support tickets, and churn flag.",
      architecture: "Business Understanding -> Data -> Analytics -> Information -> Decision Making -> Intervention.",
      stack: ["Python", "Pandas", "SciPy", "Statsmodels", "Lifelines", "Plotly", "Streamlit"],
      metrics: "Churn rate, cohort retention, chi-square tests, t-tests, odds ratios, logistic regression, survival curves, and intervention ROI.",
      demo: "https://example.com/churn-statistics",
      github: "https://github.com/yourusername/customer-churn-statistical-analysis",
      notion: "https://app.notion.com/p/7c2d9bb6b1284817a46d2a28c5de79d2",
      lessons: "This project shows how statistics turns customer behavior into explainable retention action, not just prediction.",
      phases: [
        { name: "Business Understanding", status: "Pending", summary: "Define churn, retention goal, customer segments, and intervention constraints." },
        { name: "Data", status: "Pending", summary: "Prepare customer tenure, usage, billing, complaint, support, and churn outcome data." },
        { name: "Analytics", status: "Pending", summary: "Analyze churn rate, cohorts, statistical tests, odds ratios, logistic regression, and survival timing." },
        { name: "Information", status: "Pending", summary: "Convert churn drivers into explainable retention insights and risk segments." },
        { name: "Decision Making", status: "Pending", summary: "Choose which customers receive outreach, discounts, education, or no action based on risk and value." },
        { name: "Intervention", status: "Pending", summary: "Measure campaign impact with A/B testing or quasi-experiment and create a retention playbook." }
      ]
    }
  ],
  blogs: [
    {
      title: "How I Think About Business-First Machine Learning",
      type: "Career lesson",
      date: "2026-05-18",
      summary: "A practical framework for moving from vague stakeholder asks to measurable ML opportunities.",
      readTime: "6 min"
    },
    {
      title: "Building a RAG Evaluation Loop from Scratch",
      type: "Technical article",
      date: "2026-05-27",
      summary: "Notes on retrieval metrics, answer quality checks, and failure analysis for LLM applications.",
      readTime: "9 min"
    }
  ],
  roadmap: [
    { stage: "Statistics", status: "In Progress" },
    { stage: "Machine Learning Foundations", status: "Next" },
    { stage: "Deep Learning", status: "Pending" },
    { stage: "NLP", status: "Pending" },
    { stage: "LLM Engineering", status: "Pending" },
    { stage: "AI Agents", status: "Pending" },
    { stage: "MLOps", status: "Pending" },
    { stage: "Production AI Systems", status: "Pending" }
  ],
  progress: [
    { date: "2026-05-20", tasks: 4, hours: 2.5, topics: ["RAG evals"], project: 35, notes: "Created first retrieval benchmark.", weeklyGoal: "Ship eval dashboard", monthlyGoal: "Complete LLM app case study" },
    { date: "2026-05-21", tasks: 3, hours: 2, topics: ["SQL guardrails"], project: 40, notes: "Added schema-aware prompt constraints.", weeklyGoal: "Ship eval dashboard", monthlyGoal: "Complete LLM app case study" },
    { date: "2026-05-22", tasks: 5, hours: 3.5, topics: ["Stakeholder discovery"], project: 46, notes: "Mapped business questions to metrics.", weeklyGoal: "Ship eval dashboard", monthlyGoal: "Complete LLM app case study" },
    { date: "2026-05-25", tasks: 2, hours: 1.5, topics: ["PyTorch"], project: 47, notes: "Reviewed training loop patterns.", weeklyGoal: "Clean model notebook", monthlyGoal: "Deep learning foundations" },
    { date: "2026-05-26", tasks: 4, hours: 2.25, topics: ["Embeddings"], project: 51, notes: "Compared chunking strategies.", weeklyGoal: "Clean model notebook", monthlyGoal: "Deep learning foundations" },
    { date: "2026-05-28", tasks: 6, hours: 4, topics: ["MLOps"], project: 58, notes: "Drafted deployment checklist.", weeklyGoal: "Write project article", monthlyGoal: "MLOps deployment module" },
    { date: "2026-05-30", tasks: 3, hours: 2, topics: ["SHAP"], project: 62, notes: "Added explanation cards to churn app.", weeklyGoal: "Write project article", monthlyGoal: "MLOps deployment module" },
    { date: "2026-06-01", tasks: 5, hours: 3, topics: ["LLM agents"], project: 65, notes: "Built tool-calling prototype.", weeklyGoal: "Publish Now update", monthlyGoal: "Production AI portfolio" },
    { date: "2026-06-03", tasks: 4, hours: 2.5, topics: ["Evaluation"], project: 70, notes: "Added human review rubric.", weeklyGoal: "Publish Now update", monthlyGoal: "Production AI portfolio" },
    { date: "2026-06-05", tasks: 5, hours: 3.25, topics: ["Dashboard UX"], project: 76, notes: "Improved progress visualization.", weeklyGoal: "Publish Now update", monthlyGoal: "Production AI portfolio" }
  ],
  reading: [
    { title: "Designing Machine Learning Systems", type: "Book", author: "Chip Huyen", progress: 62, status: "Reading" },
    { title: "Attention Is All You Need", type: "Paper", author: "Vaswani et al.", progress: 100, status: "Completed" },
    { title: "Hugging Face NLP Course", type: "Course", author: "Hugging Face", progress: 74, status: "In progress" },
    { title: "MLflow Tracking Fundamentals", type: "Course", author: "MLflow", progress: 36, status: "Queued" },
    { title: "RAG Survey Notes", type: "Article", author: "Personal research", progress: 48, status: "Synthesizing" }
  ],
  achievements: [
    "Delivered business-facing analytics and ML solutions in a professional environment.",
    "Built public case studies across ML, NLP, Generative AI, and data analytics.",
    "Maintained a consistent learning log across AI, statistics, and production systems."
  ]
};
