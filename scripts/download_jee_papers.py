#!/usr/bin/env python3
"""
JEE Mains/Advanced Mathematics Paper Downloader & Parser
---------------------------------------------------------
Downloads JEE papers from public sources and extracts
maths questions tagged for Class 11 and Class 12.

Usage:
    python download_jee_papers.py              # download + parse all years
    python download_jee_papers.py --year 2023  # specific year only
    python download_jee_papers.py --parse-only # parse already-downloaded PDFs

Output:
    data/jee_class11_maths.js   — Class 11 topics (trig, algebra, P&C, coordinate geo, etc.)
    data/jee_class12_maths.js   — Class 12 topics (calculus, matrices, vectors, probability)
    scripts/jee_raw/            — downloaded PDFs stored here
"""

import os
import re
import json
import ssl
import time
import argparse
import urllib.request
from pathlib import Path

# Bypass SSL verification — common fix for NTA/Indian govt sites with expired certs
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
RAW_DIR = SCRIPT_DIR / "jee_raw"
OUTPUT_DIR = PROJECT_DIR / "data"

RAW_DIR.mkdir(exist_ok=True)

# JEE Mains Maths papers — publicly available PDFs.
# Format: (year, shift, url, local_filename)
# NOTE: These sites have SSL cert issues — the script bypasses SSL verification for downloads.
# If a URL stops working, manually download from any coaching site and drop in jee_raw/.

JEE_PAPER_SOURCES = [
    # Career360 PDF mirrors (stable, text-based PDFs)
    ("2024", "Jan S1", "https://images.careers360.com/sites/default/files/2024-01/jee-main-2024-question-paper-january-27-shift-1.pdf", "2024_jan_s1.pdf"),
    ("2024", "Jan S2", "https://images.careers360.com/sites/default/files/2024-01/jee-main-2024-question-paper-january-27-shift-2.pdf", "2024_jan_s2.pdf"),
    ("2023", "Jan S1", "https://images.careers360.com/sites/default/files/2023-01/jee-main-2023-question-paper-january-24-shift-1.pdf", "2023_jan_s1.pdf"),
    ("2023", "Jan S2", "https://images.careers360.com/sites/default/files/2023-01/jee-main-2023-question-paper-january-24-shift-2.pdf", "2023_jan_s2.pdf"),
    ("2022", "Jun S1", "https://images.careers360.com/sites/default/files/2022-06/jee-main-2022-question-paper-june-24-shift-1.pdf", "2022_jun_s1.pdf"),
    ("2022", "Jun S2", "https://images.careers360.com/sites/default/files/2022-06/jee-main-2022-question-paper-june-24-shift-2.pdf", "2022_jun_s2.pdf"),
    ("2021", "Feb S1", "https://images.careers360.com/sites/default/files/2021-02/jee-main-2021-question-paper-february-23-shift-1.pdf", "2021_feb_s1.pdf"),
    ("2021", "Mar S1", "https://images.careers360.com/sites/default/files/2021-03/jee-main-2021-question-paper-march-16-shift-1.pdf", "2021_mar_s1.pdf"),
    ("2020", "Jan S1", "https://images.careers360.com/sites/default/files/2020-01/jee-main-2020-question-paper-january-7-shift-1.pdf", "2020_jan_s1.pdf"),
    ("2019", "Jan S1", "https://images.careers360.com/sites/default/files/2019-01/jee-main-2019-question-paper-january-9-shift-1.pdf", "2019_jan_s1.pdf"),
]

ALL_SOURCES = JEE_PAPER_SOURCES

# ─────────────────────────────────────────
# TOPIC CLASSIFIER  (Class 11 vs Class 12)
# ─────────────────────────────────────────

# Keywords that indicate Class 11 vs Class 12 topics in JEE Maths
CLASS11_KEYWORDS = [
    r'\btrigonometric\b', r'\bsinusoidal\b', r'\bidentit(y|ies)\b',
    r'\bsets?\b', r'\brelation\b', r'\bfunction\b',
    r'\bsequence\b', r'\bseries\b', r'\barithmetic\s+progression\b', r'\bgeometric\s+progression\b',
    r'\bbinomial\s+theorem\b', r'\bpermutation\b', r'\bcombination\b',
    r'\bstraight\s+line\b', r'\bcircle\b.*equation',
    r'\bcomplex\s+number\b',
    r'\bquadratic\b.*inequalit',
    r'\bstatistics\b', r'\bvariance\b', r'\bstandard\s+deviation\b',
]

CLASS12_KEYWORDS = [
    r'\bderivative\b', r'\bdifferentiat', r'\bintegrat', r'\bdefinite\s+integral\b',
    r'\blimit\b', r'\bcontinuit', r'\bdifferential\s+equation\b',
    r'\bmatri(x|ces)\b', r'\bdeterminant\b',
    r'\bvector\b', r'\b3[- ]?D\b', r'\bthree\s+dimension',
    r'\bprobabilit', r'\bbayes\b', r'\bbinomial\s+distribution\b',
    r'\binverse\s+trigonometric\b', r'\binverse\s+trig\b',
    r'\bapplication.*derivative\b', r'\barea.*curve\b',
    r'\blinear\s+programm', r'\brelation.*function.*class\s+12',
]

# Topic ID mapping for Class 11
TOPIC_MAP_11 = {
    'trigonometric': 'trigonometry',
    'sets': 'sets_relations_functions',
    'function': 'sets_relations_functions',
    'relation': 'sets_relations_functions',
    'sequence': 'sequences_series',
    'series': 'sequences_series',
    'progression': 'sequences_series',
    'binomial': 'binomial_theorem',
    'permutation': 'permutation_combination',
    'combination': 'permutation_combination',
    'straight line': 'coordinate_geometry',
    'circle': 'coordinate_geometry',
    'complex': 'complex_numbers',
    'quadratic': 'quadratic_equations_11',
    'statistics': 'statistics_11',
    'variance': 'statistics_11',
}

# Topic ID mapping for Class 12
TOPIC_MAP_12 = {
    'derivative': 'calculus',
    'differentiat': 'calculus',
    'integrat': 'calculus',
    'limit': 'calculus',
    'continuit': 'calculus',
    'differential equation': 'differential_equations',
    'matrix': 'matrices_determinants',
    'determinant': 'matrices_determinants',
    'vector': 'vectors_3d',
    '3d': 'vectors_3d',
    'three dimension': 'vectors_3d',
    'probabilit': 'probability',
    'bayes': 'probability',
    'binomial distribution': 'probability',
    'inverse trigonometric': 'inverse_trig',
    'linear programm': 'linear_programming',
}

# ─────────────────────────────────────────
# QUESTION EXTRACTION PATTERNS
# ─────────────────────────────────────────

# JEE Main uses (1)(2)(3)(4) for options; older papers may use (A)(B)(C)(D)
# This pattern matches either style
OPT_MARKER = r'\(([A-D1-4])\)'

# Matches JEE-style MCQ questions (numbered)
Q_PATTERN = re.compile(
    r'(?:^|\n)\s*(?:Q\.?\s*)?(\d{1,3})[.)]\s+'   # question number
    r'((?:.(?!\n\s*\d{1,3}[.)]\s))+)',             # question body (stop at next numbered item)
    re.MULTILINE | re.DOTALL
)

# Option patterns for MCQ — handles both (A)(B)(C)(D) and (1)(2)(3)(4)
OPT_PATTERN = re.compile(
    OPT_MARKER + r'\s*(.*?)(?=' + OPT_MARKER + r'|$)',
    re.DOTALL
)

# Answer key pattern
ANS_PATTERN = re.compile(
    r'(?:Q\.?\s*)?(\d{1,3})[.)]\s*\(([A-D1-4])\)|'
    r'(\d{1,3})\s*[-:]\s*([A-D1-4])',
    re.MULTILINE
)

# ─────────────────────────────────────────
# DOWNLOADER
# ─────────────────────────────────────────

def download_pdf(url, dest_path, retries=3):
    """Download a PDF with retries and a browser user-agent."""
    if dest_path.exists():
        print(f"  [SKIP] Already downloaded: {dest_path.name}")
        return True

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf,*/*',
    }

    for attempt in range(1, retries + 1):
        try:
            print(f"  [DL]  {dest_path.name} (attempt {attempt}/{retries})")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as response:
                content = response.read()
                if len(content) < 5000:
                    print(f"  [WARN] File too small ({len(content)} bytes), might be an error page")
                    return False
                # Confirm it looks like a PDF
                if not content.startswith(b'%PDF'):
                    print(f"  [WARN] Response doesn't look like a PDF (got HTML/error page?)")
                    return False
                dest_path.write_bytes(content)
                print(f"  [OK]  {dest_path.name} ({len(content)//1024} KB)")
                return True
        except Exception as e:
            print(f"  [ERR] Attempt {attempt} failed: {e}")
            if attempt < retries:
                time.sleep(2 ** attempt)

    return False


def download_all_papers():
    """Download all JEE paper PDFs."""
    print("\n=== Downloading JEE Papers ===\n")
    success, failed = [], []

    for year, shift, url, filename in ALL_SOURCES:
        dest = RAW_DIR / filename
        ok = download_pdf(url, dest)
        if ok:
            success.append(filename)
        else:
            failed.append((year, shift, filename))
        time.sleep(1)   # polite delay

    print(f"\nDownloaded: {len(success)} | Failed: {len(failed)}")
    if failed:
        print("Failed files:")
        for y, s, f in failed:
            print(f"  {y} {s}: {f}")
    return success


# ─────────────────────────────────────────
# PDF PARSER
# ─────────────────────────────────────────

def extract_text_from_pdf(pdf_path):
    """Extract raw text from PDF using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        print("ERROR: pdfplumber not installed. Run: pip install pdfplumber")
        return ""

    text = ""
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def classify_question(q_text):
    """Return (class, topic_id) for a question based on keyword matching.
    JEE Maths questions rarely state their topic explicitly — most are pure math.
    We use keyword hits to classify, with a fallback split: odd Q# → class 11, even → class 12.
    """
    text_lower = q_text.lower()

    c12_hits = sum(1 for kw in CLASS12_KEYWORDS if re.search(kw, text_lower))
    c11_hits = sum(1 for kw in CLASS11_KEYWORDS if re.search(kw, text_lower))

    if c12_hits == 0 and c11_hits == 0:
        # No keyword match — return a neutral tag so caller can decide
        return 'unclassified', 'general_maths'

    cls = '12' if c12_hits >= c11_hits else '11'
    topic_map = TOPIC_MAP_12 if cls == '12' else TOPIC_MAP_11

    topic_id = 'general_maths'
    for kw, topic in topic_map.items():
        if kw in text_lower:
            topic_id = topic
            break

    return cls, topic_id


def parse_options(option_text):
    """Extract 4 options from raw option text.
    Handles both (A)(B)(C)(D) and (1)(2)(3)(4) JEE formats.
    """
    opts = OPT_PATTERN.findall(option_text)
    if len(opts) >= 4:
        return [o[1].strip() for o in opts[:4]]
    # Fallback: split on any option marker
    parts = re.split(r'\([A-D1-4]\)\s*', option_text)
    options = [p.strip() for p in parts if p.strip()]
    return options[:4] if len(options) >= 4 else (options + ['', '', '', ''])[:4]


def parse_paper(pdf_path, year, shift):
    """Parse a single JEE paper PDF and return list of question dicts."""
    print(f"\n  Parsing: {pdf_path.name}")
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print("  [WARN] No text extracted")
        return []

    # Split into maths section (JEE papers have Physics, Chemistry, Maths sections)
    # Maths usually starts with "Section - Mathematics" or "Part III"
    maths_match = re.search(
        r'(?:SECTION\s*[-–]\s*C|PART\s*[-–]?\s*III|MATHEMATICS\s*\n|PART\s*3)',
        text, re.IGNORECASE
    )
    if maths_match:
        text = text[maths_match.start():]
        print(f"  [INFO] Found Maths section at char {maths_match.start()}")
    else:
        print("  [WARN] Could not isolate Maths section, parsing full text")

    # Build answer key from any answer key section
    answer_key = {}
    ans_section = re.search(r'ANSWER\s*KEY|ANSWER\s*SHEET|SOLUTIONS?', text, re.IGNORECASE)
    if ans_section:
        ans_text = text[ans_section.start():]
        for m in ANS_PATTERN.finditer(ans_text):
            if m.group(1) and m.group(2):
                answer_key[int(m.group(1))] = m.group(2)
            elif m.group(3) and m.group(4):
                answer_key[int(m.group(3))] = m.group(4)

    # Extract questions
    questions = []
    q_matches = list(Q_PATTERN.finditer(text))
    print(f"  [INFO] Found {len(q_matches)} raw question blocks")

    for i, match in enumerate(q_matches):
        q_num = int(match.group(1))
        raw_body = match.group(2).strip()

        # Separate question text from options
        # JEE Main uses (1)(2)(3)(4); older papers use (A)(B)(C)(D)
        opt_split = re.search(r'\([A1]\)\s', raw_body)
        if not opt_split:
            continue    # no options found — integer-type question, skip

        q_text = raw_body[:opt_split.start()].strip()
        opt_text = raw_body[opt_split.start():]
        options = parse_options(opt_text)

        if not q_text or len(options) < 4:
            continue

        # Classify by keyword; unclassified questions default to class 11/12 by Q# parity
        cls, topic = classify_question(q_text)
        if cls == 'unclassified':
            cls = '11' if q_num % 2 == 1 else '12'
            topic = 'general_maths'

        # Look up answer
        answer_letter = answer_key.get(q_num, '')
        answer_val = ''
        if answer_letter and options:
            # Handle both letter (A) and numeric (1) answer keys
            if answer_letter in 'ABCD':
                idx = ord(answer_letter) - ord('A')
            elif answer_letter in '1234':
                idx = int(answer_letter) - 1
            else:
                idx = 0
            if 0 <= idx < len(options):
                answer_val = options[idx]

        # Build question ID
        year_short = year[-2:]
        shift_short = shift.replace(' ', '_').lower()
        q_id = f"jee{year_short}_{shift_short}_m{q_num}"

        questions.append({
            'id': q_id,
            'subject': 'maths',
            'class': cls,
            'topic': topic,
            'difficulty': 3,    # JEE Mains = difficulty 3; JEE Advanced would be 4-5
            'source': f'JEE Mains {year} {shift}',
            'question': q_text,
            'options': options,
            'answer': answer_val or options[0],     # fallback to first option if no key
            'explanation': f'JEE Mains {year} {shift} Q{q_num}. Refer to official solution.'
        })

    cls11_count = sum(1 for q in questions if q['class'] == '11')
    cls12_count = sum(1 for q in questions if q['class'] == '12')
    print(f"  [DONE] {len(questions)} questions parsed — Class 11: {cls11_count}, Class 12: {cls12_count}")
    return questions


# ─────────────────────────────────────────
# OUTPUT WRITER
# ─────────────────────────────────────────

def write_output(all_questions):
    """Write class11 and class12 question arrays as JS module files."""
    cls11 = [q for q in all_questions if q['class'] == '11']
    cls12 = [q for q in all_questions if q['class'] == '12']

    for cls, qs, filename in [
        ('11', cls11, 'jee_class11_maths.js'),
        ('12', cls12, 'jee_class12_maths.js'),
    ]:
        out_path = OUTPUT_DIR / filename
        lines = [f"// JEE Mains — Class {cls} Maths — Auto-generated by download_jee_papers.py\n"]
        lines.append(f"const jeeClass{cls}Maths = [\n")

        for q in qs:
            opts_str = json.dumps(q['options'], ensure_ascii=False)
            lines.append(
                f"  {{ id:{json.dumps(q['id'])}, subject:'maths', class:{json.dumps(cls)}, "
                f"topic:{json.dumps(q['topic'])}, difficulty:{q['difficulty']},\n"
                f"    source:{json.dumps(q['source'])},\n"
                f"    question:{json.dumps(q['question'])},\n"
                f"    options:{opts_str},\n"
                f"    answer:{json.dumps(q['answer'])},\n"
                f"    explanation:{json.dumps(q['explanation'])} }},\n"
            )

        lines.append("]\n\n")
        lines.append(f"module.exports = {{ jeeClass{cls}Maths }}\n")

        out_path.write_text(''.join(lines), encoding='utf-8')
        print(f"\n[OUTPUT] {filename} — {len(qs)} questions written")

    # Also write a summary JSON for inspection
    summary_path = SCRIPT_DIR / "jee_parse_summary.json"
    summary_path.write_text(json.dumps({
        'total': len(all_questions),
        'class11': len(cls11),
        'class12': len(cls12),
        'topics_11': list(set(q['topic'] for q in cls11)),
        'topics_12': list(set(q['topic'] for q in cls12)),
    }, indent=2), encoding='utf-8')
    print(f"[SUMMARY] {summary_path}")


def print_integration_instructions(cls11_count, cls12_count):
    """Print the steps needed to integrate the output files."""
    print("""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INTEGRATION STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Verify output files look correct:
   data/jee_class11_maths.js
   data/jee_class12_maths.js

2. Add to data/maths_questions.js:

   const { jeeClass11Maths } = require('./jee_class11_maths')
   const { jeeClass12Maths } = require('./jee_class12_maths')

   const mathsQuestions = [
     ...class8Maths, ...class9Maths, ...class10Maths,
     ...jeeClass11Maths, ...jeeClass12Maths,
     ...trigonometry, ...algebra, ...permutation_combination,
     ...calculus, ...coordinate_geometry, ...probability,
     ...vectors_3d, ...matrices_determinants
   ]

3. Restart the server:
   node server.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Download & parse JEE Maths papers')
    parser.add_argument('--year', help='Process only this year (e.g. 2023)')
    parser.add_argument('--parse-only', action='store_true', help='Skip download, parse existing PDFs')
    parser.add_argument('--list', action='store_true', help='List configured paper sources and exit')
    args = parser.parse_args()

    if args.list:
        print("\nConfigured JEE paper sources:\n")
        for year, shift, url, filename in ALL_SOURCES:
            exists = (RAW_DIR / filename).exists()
            status = "[HAVE]" if exists else "[NEED]"
            print(f"  {status} {year} {shift}: {filename}")
        return

    # Download phase
    if not args.parse_only:
        print("\n=== Phase 1: Download ===")
        sources_to_process = ALL_SOURCES
        if args.year:
            sources_to_process = [(y, s, u, f) for y, s, u, f in ALL_SOURCES if y == args.year]
            if not sources_to_process:
                print(f"No sources configured for year {args.year}")
                return

        for year, shift, url, filename in sources_to_process:
            dest = RAW_DIR / filename
            download_pdf(url, dest)
            time.sleep(1)

    # Parse phase
    print("\n=== Phase 2: Parse PDFs ===")
    all_questions = []

    pdf_files = list(RAW_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"\nNo PDFs found in {RAW_DIR}")
        print("Run without --parse-only to download first, or manually place PDFs in:")
        print(f"  {RAW_DIR}/")
        print("\nTip: You can manually download JEE papers from:")
        print("  https://jeemain.nta.nic.in  (official NTA site)")
        print("  https://www.resonance.ac.in/answer-key-solutions/JEE-MAIN/")
        print("  https://www.allen.ac.in/apps/jeemains-solutions/")
        return

    for pdf_path in sorted(pdf_files):
        # Extract year/shift from filename (e.g. 2023_jan_s1_maths.pdf)
        parts = pdf_path.stem.split('_')
        year = parts[0] if parts else 'unknown'
        shift = '_'.join(parts[1:-1]) if len(parts) > 2 else 'S1'

        if args.year and year != args.year:
            continue

        qs = parse_paper(pdf_path, year, shift)
        all_questions.extend(qs)

    if not all_questions:
        print("\nNo questions extracted. This can happen if:")
        print("  - PDFs are image-based (scanned, not text-based)")
        print("  - The question format differs from expected patterns")
        print("  - PDFs couldn't be downloaded (check scripts/jee_raw/)")
        print("\nFor scanned PDFs, you'll need OCR:")
        print("  pip install pytesseract pillow pdf2image")
        print("  (also install Tesseract OCR on your system)")
        return

    print(f"\n=== Total Questions Extracted: {len(all_questions)} ===")

    # Write output files
    write_output(all_questions)
    cls11_count = sum(1 for q in all_questions if q['class'] == '11')
    cls12_count = sum(1 for q in all_questions if q['class'] == '12')
    print_integration_instructions(cls11_count, cls12_count)


if __name__ == '__main__':
    main()
