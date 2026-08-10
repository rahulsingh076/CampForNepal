# Media QA Matrix

| Check | Status |
| --- | --- |
| Package gallery accepts legacy URL strings | Automated pass |
| Destination/activity/package gallery accepts structured media objects | Automated pass |
| Local image/video references validate as shipped asset paths | Automated pass |
| Unsafe `javascript:`, `data:`, `file:`, and `blob:` media rejected | Automated pass |
| Draft media excluded from gallery library picker | Automated pass by source review |
| Used media deletion is blocked | Manual browser/API check needed |
| Real production alt/caption/source/licence present | Owner action needed |
| External video/reel thumbnails render and open safely | Manual browser check needed |
| No autoplay with sound | Manual browser check needed |
