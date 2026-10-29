# JobThreadRow

One job thread: a decorative marker (2px left border and an 8px dot), a mono "JOB 01 · Electrical" meta line, the job title, status in words, crew and activity, and tool pills. Wrap rows in `JobThreadList`, an `<ol>` with a `c-border` rule between rows and under the last. Hand-written from `components/job-threads.tsx`.

**You provide:** `index`, `trade`, `title`, `status`, `crew`, `activity` and `tools`. Pick a `tone` from blue, amber, emerald, violet or rose.

**Do**
- Put the status in words; the tone colour is decoration and never carries it (amber and emerald are about 2:1 on `c-bg`).
- Label it "Example" when the rows are sample data, as your UI/UX spec requires. The source shows five sample jobs under "Your shop · right now" without a label.

**Don't**
- Don't read the five hues as a legend. The design review recommends dropping them or tying them to real status.
