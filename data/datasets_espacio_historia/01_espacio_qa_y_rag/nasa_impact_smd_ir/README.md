---
license: cc
task_categories:
- feature-extraction
pretty_name: NASA-IR
---
# NASA-IR benchmark
NASA SMD and IBM Research developed a domain-specific information retrieval benchmark, **`NASA-IR`**, spanning almost 500 question-answer pairs related to the Earth science, planetary science, heliophysics, astrophysics, and biological physical sciences domains. Specifically, we sampled a set of 166 paragraphs from AGU, AMS, ADS, PMC, and PubMed and manually annotated with 3 questions that are answerable from each of these paragraphs, resulting in 498 questions. We used 398 of these questions as the training set and the remaining 100 as the validation set.

To comprehensively evaluate the information retrieval systems and mimic the real-world data, we combined 26,839 random ADS abstracts with these annotated paragraphs. On average, each query is 12 words long, and each paragraph is 120 words long. We used Recall@10 as the evaluation metric since each question has only one relevant document.

**Evaluation results**

![image/png](https://cdn-uploads.huggingface.co/production/uploads/61099e5d86580d4580767226/HfxWBYsay4dX06mI79GnI.png)

**Note**
This dataset is released in support of the training and evaluation of the encoder language model ["Indus"](https://huggingface.co/nasa-impact/nasa-smd-ibm-v0.1).

Accompanying paper can be found here: https://arxiv.org/abs/2405.10725