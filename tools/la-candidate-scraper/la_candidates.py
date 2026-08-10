#!/usr/bin/env python3
"""
Pull Louisiana candidate filings (name, email, phone, office) for every parish.

Data source: the Louisiana Secretary of State's public Candidate Inquiry portal,
https://voterportal.sos.la.gov/candidateinquiry

The portal already exposes a per-parish CSV export (the "Export to CSV" button on
the Parish tab). This script just drives that same export for all 64 parishes and
merges the results into one file, so you don't have to click through parish by
parish.

No third-party packages required -- standard library only.

Examples
--------
  # List the elections the portal knows about
  python3 la_candidates.py --list-elections

  # All 64 parishes for the next election (the portal's default selection)
  python3 la_candidates.py

  # A specific election, by date
  python3 la_candidates.py --election 11/03/2026

  # Just a few parishes
  python3 la_candidates.py --parish "EAST BATON ROUGE" --parish LAFAYETTE

  # Choose where the files land
  python3 la_candidates.py --outdir ~/Desktop/la-candidates
"""

from __future__ import annotations

import argparse
import csv
import io
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

BASE = "https://voterportal.sos.la.gov"
INQUIRY_URL = f"{BASE}/candidateinquiry"
PARISH_LIST_URL = f"{BASE}/CandidateInquiry/ParishCandidate/Index"
PARISH_EXPORT_URL = f"{BASE}/CandidateInquiry/ParishCandidate/Export"

USER_AGENT = (
    "Mozilla/5.0 (compatible; la-candidate-export/1.0; "
    "+public records export of sos.la.gov candidate inquiry)"
)

# Columns kept in the slim "contacts" output, in order.
# Left side = column in the source CSV, right side = friendlier header.
CONTACT_COLUMNS = [
    ("Parish", "Parish"),
    ("Name", "Name"),
    ("Email Address", "Email"),
    ("Phone", "Phone"),
    ("Office", "Running For"),
    ("Party", "Party"),
    ("Filed Date", "Filed Date"),
]


# --------------------------------------------------------------------------
# HTTP
# --------------------------------------------------------------------------


def fetch(url: str, params: dict | None = None, retries: int = 4) -> str:
    """GET a URL and return the body as text, with backoff on transient errors."""
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "text/html,text/csv,*/*",
                },
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as error:
            last_error = error
            if attempt < retries - 1:
                delay = 2 ** (attempt + 1)
                print(f"    request failed ({error}); retrying in {delay}s", file=sys.stderr)
                time.sleep(delay)

    raise RuntimeError(f"gave up on {url}: {last_error}")


# --------------------------------------------------------------------------
# Scraping the two dropdowns
# --------------------------------------------------------------------------


class SelectParser(HTMLParser):
    """Pull the <option> values out of one named <select> in a page."""

    def __init__(self, select_id: str) -> None:
        super().__init__()
        self.select_id = select_id
        self.options: list[tuple[str, str]] = []
        self._in_select = False
        self._current_value: str | None = None
        self._text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "select" and attributes.get("id") == self.select_id:
            self._in_select = True
        elif tag == "option" and self._in_select:
            self._current_value = attributes.get("value") or ""
            self._text_parts = []

    def handle_data(self, data: str) -> None:
        if self._current_value is not None:
            self._text_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "option" and self._current_value is not None:
            label = "".join(self._text_parts).strip()
            if self._current_value and label:
                self.options.append((self._current_value, label))
            self._current_value = None
        elif tag == "select" and self._in_select:
            self._in_select = False


def get_elections() -> list[tuple[str, str]]:
    """Return [(election_id, 'MM/DD/YYYY'), ...], newest first as the site orders them."""
    parser = SelectParser("ElectionId")
    parser.feed(fetch(INQUIRY_URL))
    if not parser.options:
        raise RuntimeError("could not find the election dropdown; the site layout may have changed")
    return parser.options


def get_default_election() -> str:
    """The election the portal pre-selects (the next upcoming one)."""
    html = fetch(INQUIRY_URL)
    match = re.search(r'<option\s+selected="selected"\s+value="(\d+)"', html)
    if match:
        return match.group(1)
    return get_elections()[0][0]


def get_parishes(election_id: str) -> list[tuple[str, str]]:
    """Return [(parish_id, 'ACADIA'), ...] for an election, with the ' - 01' suffix stripped."""
    parser = SelectParser("parish")
    parser.feed(fetch(PARISH_LIST_URL, {"electionId": election_id}))

    parishes = []
    for parish_id, label in parser.options:
        # Labels arrive as "EAST BATON ROUGE - 17"; keep just the name.
        name = re.sub(r"\s*-\s*\d+\s*$", "", label).strip()
        parishes.append((parish_id, name))

    if not parishes:
        raise RuntimeError("could not find the parish dropdown; the site layout may have changed")
    return parishes


# --------------------------------------------------------------------------
# The export itself
# --------------------------------------------------------------------------


def export_parish(election_id: str, election_date: str, parish_id: str, parish_name: str) -> list[dict]:
    """Download one parish's CSV export and return it as a list of row dicts.

    Note: the portal echoes the electionDate and parishName query parameters
    straight back into the CSV's own Election/Parish columns rather than looking
    them up, so we pass accurate values here to keep the merged file honest.
    """
    body = fetch(
        PARISH_EXPORT_URL,
        {
            "electionId": election_id,
            "electionDate": election_date,
            "parishId": parish_id,
            "parishName": parish_name,
        },
    )
    return list(csv.DictReader(io.StringIO(body)))


def build_office(row: dict) -> str:
    """Join the office title and its description into one readable 'running for' string."""
    title = (row.get("OfficeTitle") or "").strip()
    description = (row.get("OfficeTitleDescription") or "").strip()
    if title and description:
        return f"{title} - {description}"
    return title or description


def build_name(row: dict) -> str:
    parts = [
        (row.get("BallotFirstName") or "").strip(),
        (row.get("BallotLastName") or "").strip(),
        (row.get("BallotSuffix") or "").strip(),
    ]
    return " ".join(part for part in parts if part)


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export Louisiana candidate filings (name, email, office) for every parish.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--election",
        help="Election date (MM/DD/YYYY) or numeric election id. Defaults to the "
             "election the portal pre-selects.",
    )
    parser.add_argument(
        "--parish",
        action="append",
        default=[],
        metavar="NAME",
        help="Limit to one parish; repeat the flag for several. Default is all 64.",
    )
    parser.add_argument(
        "--outdir",
        default=".",
        help="Directory to write the output files into (default: current directory).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Seconds to pause between parishes, to stay polite to the server (default: 0.5).",
    )
    parser.add_argument(
        "--list-elections",
        action="store_true",
        help="Print the available elections and exit.",
    )
    args = parser.parse_args()

    if args.list_elections:
        for election_id, date in get_elections():
            print(f"{election_id:>5}  {date}")
        return 0

    # --- Resolve which election we're pulling -----------------------------
    elections = get_elections()
    by_id = dict(elections)

    if not args.election:
        election_id = get_default_election()
    elif args.election.isdigit() and args.election in by_id:
        election_id = args.election
    else:
        matches = [eid for eid, date in elections if date == args.election]
        if not matches:
            print(
                f"No election matching {args.election!r}. "
                f"Run with --list-elections to see the valid values.",
                file=sys.stderr,
            )
            return 1
        election_id = matches[0]

    election_date = by_id[election_id]
    print(f"Election {election_date} (id {election_id})")

    # --- Resolve which parishes -------------------------------------------
    parishes = get_parishes(election_id)

    if args.parish:
        wanted = {name.strip().upper() for name in args.parish}
        selected = [(pid, name) for pid, name in parishes if name.upper() in wanted]
        missing = wanted - {name.upper() for _, name in selected}
        if missing:
            print(f"Unknown parish name(s): {', '.join(sorted(missing))}", file=sys.stderr)
            print(f"Valid names: {', '.join(name for _, name in parishes)}", file=sys.stderr)
            return 1
    else:
        selected = parishes

    print(f"Pulling {len(selected)} parish(es)...\n")

    # --- Pull ---------------------------------------------------------------
    all_rows: list[dict] = []
    failures: list[str] = []

    for index, (parish_id, parish_name) in enumerate(selected, start=1):
        try:
            rows = export_parish(election_id, election_date, parish_id, parish_name)
        except RuntimeError as error:
            print(f"  [{index:>2}/{len(selected)}] {parish_name:<22} FAILED: {error}", file=sys.stderr)
            failures.append(parish_name)
            continue

        with_email = sum(1 for row in rows if (row.get("Email Address") or "").strip())
        print(f"  [{index:>2}/{len(selected)}] {parish_name:<22} {len(rows):>4} candidates, {with_email:>4} with email")

        for row in rows:
            row["Name"] = build_name(row)
            row["Office"] = build_office(row)
            all_rows.append(row)

        if index < len(selected):
            time.sleep(args.delay)

    if not all_rows:
        print("\nNo candidate rows returned. Qualifying may not have closed for this election yet.")
        return 0

    # --- Write ------------------------------------------------------------
    outdir = Path(args.outdir).expanduser()
    outdir.mkdir(parents=True, exist_ok=True)
    slug = election_date.replace("/", "-")

    full_path = outdir / f"la-candidates-{slug}-full.csv"
    contacts_path = outdir / f"la-candidates-{slug}-contacts.csv"

    # Full export: every column the state gives us, plus our two derived ones.
    source_fields = [field for field in all_rows[0] if field not in ("Name", "Office")]
    with full_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=source_fields + ["Name", "Office"])
        writer.writeheader()
        writer.writerows(all_rows)

    # Slim export: the mail-merge columns, one row per parish ballot appearance.
    with contacts_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.writer(handle)
        writer.writerow([header for _, header in CONTACT_COLUMNS])
        for row in all_rows:
            writer.writerow([(row.get(source) or "").strip() for source, _ in CONTACT_COLUMNS])

    # Deduplicated export: one row per person.
    #
    # Statewide and multi-parish races appear on every parish ballot they cover,
    # so a US Senate candidate shows up 64 times in the file above. That is
    # correct as a by-parish view, but mailing from it would contact the same
    # person 64 times -- so collapse to one row each, listing every parish.
    unique_path = outdir / f"la-candidates-{slug}-contacts-unique.csv"
    collapsed: dict[tuple[str, str, str], dict] = {}
    for row in all_rows:
        key = (
            (row.get("Name") or "").strip().upper(),
            (row.get("Email Address") or "").strip().lower(),
            (row.get("Office") or "").strip().upper(),
        )
        entry = collapsed.get(key)
        if entry is None:
            collapsed[key] = {"row": row, "parishes": [(row.get("Parish") or "").strip()]}
        else:
            parish = (row.get("Parish") or "").strip()
            if parish not in entry["parishes"]:
                entry["parishes"].append(parish)

    with unique_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Name", "Email", "Phone", "Running For", "Party", "Filed Date",
                         "Parish Count", "Parishes"])
        for entry in collapsed.values():
            row = entry["row"]
            parishes_listed = entry["parishes"]
            writer.writerow([
                (row.get("Name") or "").strip(),
                (row.get("Email Address") or "").strip(),
                (row.get("Phone") or "").strip(),
                (row.get("Office") or "").strip(),
                (row.get("Party") or "").strip(),
                (row.get("Filed Date") or "").strip(),
                len(parishes_listed),
                "; ".join(sorted(parishes_listed)),
            ])

    emailed = sum(1 for row in all_rows if (row.get("Email Address") or "").strip())
    unique_emails = len({
        (row.get("Email Address") or "").strip().lower()
        for row in all_rows
        if (row.get("Email Address") or "").strip()
    })

    print(f"\n{len(all_rows)} ballot listings across {len(selected) - len(failures)} parishes")
    print(f"{len(collapsed)} distinct candidates; {emailed} listings have an email ({unique_emails} unique addresses)")
    print(f"\n  full data          -> {full_path}")
    print(f"  contacts by parish -> {contacts_path}")
    print(f"  contacts deduped   -> {unique_path}   <- use this one for mail merge")

    if failures:
        print(f"\nFailed parishes (re-run with --parish to retry): {', '.join(failures)}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        sys.exit(130)
