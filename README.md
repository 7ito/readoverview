# ReadAssist/ReadOverview

### CC-CEDICT edge cases
- 你 ni3 returns variations e.g. 妳, 伱, 伲, 儞, 袮
  - Just taking index 0 of entries for now
- When Jieba and CEDICT disagree on segments can lead to null object being returned
  - When ciyu that Jieba segments is not a entry
    - e.g. names, edge cases
  - Need to figure out way to deal with those
- Some CEDICT entries have a key of null, e.g. 譲: "Japanese variant of 讓|让"