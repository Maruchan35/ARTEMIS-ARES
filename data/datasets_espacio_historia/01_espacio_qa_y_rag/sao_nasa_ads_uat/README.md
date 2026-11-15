---
license: mit
task_categories:
- text-classification
language:
- en
size_categories:
- 10K<n<100K
---

Titles and Abstracts for papers from ADS/SciX that have been tagged with some Unified Astronomy Thesaurus (https://astrothesaurus.org/) keywords.  
Bibcode provided for identification.  
```python
DatasetDict({
    train: Dataset({
        features: ['bibcode', 'title', 'abstract', 'verified_uat_ids', 'verified_uat_labels'],
        num_rows: 18677
    })
    val: Dataset({
        features: ['bibcode', 'title', 'abstract', 'verified_uat_ids', 'verified_uat_labels'],
        num_rows: 3025
    })
})
```



For each sample:
- `'verified_uat_labels'` is a list of UAT concept keywords tagged to this paper (by the authors or publisher).
- `'verified_uat_ids'` is a list of integers corresponding to the UAT id for each concept above.
  
It is recommended to use the UAT repository (https://github.com/astrothesaurus/UAT) to match IDs to concepts (these potentially having synonyms) and work on the IDs, not the labels.

Sample:
```python
{
  bibcode : '2020ApJ...891..100S',
  title : 'Dynamic Potential Sputtering of Lunar Analog Material by Solar Wind Ions',
  abstract : 'Pyroxenes ((Ca, Mg, Fe, Mn)<SUB>2</SUB>Si<SUB>2</SUB>O<SUB>6</SUB>) belong to the most abundant rock forming minerals that make up the surface of rocky planets and moons. Therefore, sputtering of pyroxenes by solar wind ions has to be considered as a very important process for modifying the surface of planetary bodies. This is increased due to potential sputtering by multiply charged ions; to quantify this effect, sputtering of wollastonite (CaSiO<SUB>3</SUB>) by He<SUP>2+</SUP> ions was investigated. Thin films of CaSiO<SUB>3</SUB> deposited on a quartz crystal microbalance were irradiated, allowing precise, in situ, real time sputtering yield measurements. Experimental results were compared with SDTrimSP simulations, which were improved by adapting the used input parameters. On freshly prepared surfaces, He<SUP>2+</SUP> ions show a significant increase in sputtering, as compared to equally fast He<SUP>+</SUP> ions. However, the yield decreases exponentially with fluence, reaching a lower steady state after sputtering of the first few monolayers. Experiments using Ar<SUP>8+</SUP> ions show a similar behavior, which is qualitatively explained by a preferential depletion of surface oxygen due to potential sputtering. A corresponding quantitative model is applied, and the observed potential sputtering behaviors of both He and Ar are reproduced very well. The results of these calculations support the assumption that mainly O atoms are affected by potential sputtering. Based on our findings, we discuss the importance of potential sputtering for the solar wind eroding the lunar surface. Estimated concentration changes and sputtering yields are both in line with previous modeling for other materials, allowing a consistent perspective on the effects of solar wind potential sputtering.',
  verified_uat_ids : [1534, 499, 1692, 948, 1024, 2004],
  verified_uat_labels : ['solar wind', 'exosphere', 'the moon', 'lunar composition', 'mercury (planet)', 'laboratory astrophysics'],
}
```