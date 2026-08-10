# Louisiana Candidate Export

Pulls every candidate's **name, email, phone, and what they're running for**, for
every parish, from the Louisiana Secretary of State's public Candidate Inquiry
portal — instead of clicking through parish by parish and typing them in.

Source: <https://voterportal.sos.la.gov/candidateinquiry>

A full statewide pull is **5,079 candidates in about 90 seconds**.

## How it works

The portal already has an "Export to CSV" button on its Parish tab — it's just
limited to one parish at a time. This script calls that same official export
endpoint once per parish and merges the results. It isn't screen-scraping or
working around anything; it's the site's own export feature, driven 64 times.

## Requirements

Python 3.9 or newer. **No packages to install** — standard library only.

## Usage

```bash
# All parishes, for the election the portal has selected by default
python3 la_candidates.py

# A specific election
python3 la_candidates.py --election 11/03/2026

# See which elections are available
python3 la_candidates.py --list-elections

# Just a few parishes
python3 la_candidates.py --parish "EAST BATON ROUGE" --parish LAFAYETTE

# Put the files somewhere specific
python3 la_candidates.py --outdir ~/Desktop/candidates
```

| Flag | What it does |
|---|---|
| `--election` | Election date (`MM/DD/YYYY`) or numeric id. Defaults to the next election. |
| `--parish` | Limit to one parish; repeat for several. Defaults to all. |
| `--outdir` | Where to write the files. Defaults to the current directory. |
| `--delay` | Seconds between parishes (default `0.5`) to stay polite to the server. |
| `--list-elections` | Print available elections and exit. |

## Output

Three CSVs, all openable directly in Excel:

**`la-candidates-<date>-full.csv`** — every field the state publishes: address,
city, zip, party, race, gender, filed date, number to be elected, and more.

**`la-candidates-<date>-contacts.csv`** — the mail-merge columns only, organized
by parish:

| Parish | Name | Email | Phone | Running For | Party | Filed Date |
|---|---|---|---|---|---|---|
| ACADIA | Julia Letlow | info@julialetlow.com | (318) 918-3682 | U. S. Senator | Republican | 02/13/2026 |

**`la-candidates-<date>-contacts-unique.csv`** — one row per person. **Use this
one for mailing.**

### Why the deduplicated file matters

Statewide and multi-parish races appear on *every* parish ballot they cover. In a
full statewide pull, a U.S. Senate candidate legitimately appears **64 times** —
once per parish. That's correct as a by-parish view, but mailing from it would
contact the same person 64 times.

The `-unique.csv` file collapses those into one row each, with `Parish Count` and
a `Parishes` column listing where they appear. For the 11/03/2026 election that's
5,079 ballot listings → 4,064 distinct candidates.

## Word document

To get the same data as a formatted `.docx` — organized by parish, then by race,
with a contact table for each — run the CSV through the Word generator:

```bash
npm install docx                                    # one time
node make_word.js la-candidates-11-03-2026-full.csv
```

The document contains a cover page, a parish summary table (races, candidates,
email coverage per parish), and then one section per parish starting on its own
page. A full statewide run is a large document — roughly 5,000 candidates across
2,750 races — so expect it to take a moment to open.

For something shorter, filter at the scrape step and feed that CSV in:

```bash
python3 la_candidates.py --parish "EAST BATON ROUGE"
node make_word.js la-candidates-11-03-2026-full.csv EBR.docx
```

## Notes

- **Coverage of emails is high but not total.** In the 11/03/2026 pull, 4,991 of
  5,079 listings had an email address. A few candidates simply didn't provide one.
- **Contact details are as-filed.** Some candidates enter placeholder data — a
  real filing in the current data lists a phone number of `(555) 555-5555`. Treat
  the fields as "what the candidate submitted," not as verified.
- **The parish list is per-election.** Off-cycle elections often have races in
  only a handful of parishes; the script reads the list for whichever election
  you pick rather than assuming all 64.
- **Election and Parish columns are echoed.** The portal reflects those two query
  parameters straight back into the CSV rather than looking them up, so the script
  passes accurate values to keep the merged file honest.
- **Qualifying has to have closed** for an election to return candidates. If you
  get zero rows for a future election, that's why.
- If a parish fails after retries, the script keeps going, reports which ones
  failed at the end, and exits non-zero so you know to re-run those with `--parish`.

## Data use

These are public candidate filing records, published by the Secretary of State
for public inspection. They're published so voters can see who's running and
reach them. If you're emailing candidates, ordinary bulk-email rules still apply
— honor opt-outs and identify yourself.
