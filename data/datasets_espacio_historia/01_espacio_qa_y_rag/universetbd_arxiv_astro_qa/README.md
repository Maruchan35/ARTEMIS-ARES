---
dataset_info:
  features:
  - name: index
    dtype: int64
  - name: question
    dtype: string
  - name: answer
    dtype: string
  splits:
  - name: train
    num_bytes: 4108026
    num_examples: 10356
  download_size: 2402562
  dataset_size: 4108026
configs:
- config_name: default
  data_files:
  - split: train
    path: data/train-*
---
# Dataset Card for "arxiv-qa-astro-ph"

[More Information needed](https://github.com/huggingface/datasets/blob/main/CONTRIBUTING.md#how-to-contribute-to-the-dataset-cards)