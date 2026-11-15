---
license: cc-by-4.0
task_categories:
- text-retrieval
- question-answering
language:
- en
tags:
- information-retrieval
- nasa
- science
- benchmark
- qa
- search
size_categories:
- 10K<n<100K
---

# NASA SDE IR Benchmark v5

A comprehensive Information Retrieval benchmark dataset for the NASA Science Discovery Engine (SDE), containing synthetically generated query-document pairs for scientific content retrieval evaluation.

> **Paper:** [INDUS-SDE: A Language Model for Scientific Content Curation and Discovery](https://doi.org/10.1145/3770855.3818847) — **KDD 2026, AI for Sciences Track**. This is the in-domain NASA SDE IR benchmark used to evaluate [INDUS-SDE-ST](https://huggingface.co/nasa-impact/indus-sde-st-v0.2).
> **Code:** [NASA-IMPACT/st-training-workflow](https://github.com/NASA-IMPACT/st-training-workflow)

## Dataset Description

This dataset is an updated version of the [NASA SDE IR Benchmark v3](https://huggingface.co/datasets/nasa-impact/nasa-sde-IR-benchmark-sample-v3), generated from new SDE content that wasn't included in previous training data or benchmarks. Only datapoints that are deemeed high scientific quality text are used for QA and search term pairs.
### Key Features

- **56,310** initial data points from new SDE content
- **9,977** datapoints sampled for pair generation
- **9,241** high-quality data points selected
- **Two types of query-document pairs:**
  - **QA Pairs**: Question-answer pairs with extracted context
  - **Search Pairs**: Search term-document pairs
- Generated using **GPT-4o mini** with 5-15 pairs per document

## Dataset Structure

The dataset follows standard IR evaluation format:

```
benchmark_data/
├── corpus.jsonl (82608 documents)
├── queries.jsonl (176901 queries)
└── qrels/
    ├── qa_pairs.tsv (86775 pairs)
    └── search_pairs.tsv (99913 pairs)
```

### File Formats

**corpus.jsonl**: Document collection
```json
{"_id": "0", "text": "document content"}
```

**queries.jsonl**: Query collection
```json
{"_id": "0", "text": "query text"}
```

**qrels/*.tsv**: Relevance judgments (TSV format)
```
query-id    corpus-id    score
0           42        1
```

## Data Generation Process

1. **Source Data**: New SDE content not in previous benchmarks
2. **Filtering**: Top 10% selected using content relevancy confidence scores
3. **Generation**: GPT-4o mini generated 5-15 query-document pairs per source document
4. **Quality Control**: Comprehensive prompting for scientific accuracy and relevance
5. **Format**: Converted to standard IR evaluation format

### Generation Statistics

- **Model**: GPT-4o mini
- **Pairs per Document**: 5-15 (adaptive based on content richness)

## Usage

This benchmark is designed for evaluating Information Retrieval systems, particularly those focused on scientific content. It can be used with standard IR evaluation frameworks like BEIR.

### Loading the Dataset

```python
from datasets import load_dataset

# Load the complete benchmark
dataset = load_dataset("nasa-impact/nasa-sde-IR-benchmark-v4")

# Access different components
corpus = dataset["corpus"]
queries = dataset["queries"] 
qa_qrels = dataset["qa_pairs_qrels"]
search_qrels = dataset["search_pairs_qrels"]
```

## Evaluation Metrics

Standard IR metrics can be applied:
- **Retrieval**: Recall@k, Precision@k, MAP, MRR, nDCG@k
- **Question Answering**: Exact Match, F1 Score
- **Search**: Hit Rate, Success Rate

## Differences from v3

- **New Content**: Entirely new SDE documents not in previous versions

## Citation

If you use this benchmark, please cite the INDUS-SDE paper:

```bibtex
@inproceedings{pantha2026indussde,
  author    = {Pantha, Nishan and Awale, Sajil and Kuruvanthodi, Vishnudev and KC, Simran and Ramasubramanian, Muthukumaran and Davis, Carson and Praveen, Bishwas and Foshee, Emily and Bhattacharjee, Bishwaranjan and Bugbee, Kaylin and Ramachandran, Rahul},
  title     = {{INDUS-SDE}: A Language Model for Scientific Content Curation and Discovery},
  year      = {2026},
  isbn      = {979-8-4007-2259-2},
  publisher = {Association for Computing Machinery},
  address   = {New York, NY, USA},
  doi       = {10.1145/3770855.3818847},
  booktitle = {Proceedings of the 32nd ACM SIGKDD Conference on Knowledge Discovery and Data Mining V.2 (KDD '26)},
  location  = {Jeju Island, Republic of Korea},
  series    = {KDD '26}
}
```