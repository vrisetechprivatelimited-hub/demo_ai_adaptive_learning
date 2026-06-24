#!/usr/bin/env python3
"""
VriseTech Physics PDF Parser — v2 (layout-aware)
Run: python3 parse_physics_pdfs.py

KEY FIX from v1: options are often arranged in a 2-column grid inside
the PDF (a) ... b) ... on one visual row, c) ... d) ... below). Plain
text extraction reads left-to-right across the full page width, which
merges "a) X   b) Y" onto a single text line. This version uses
pdfplumber's word-level x/y coordinates to detect column splits and
separate merged options correctly.
"""
import os, re, json, sys, random

try:
    import pdfplumber
except ImportError:
    os.system("pip install pdfplumber --quiet")
    import pdfplumber

PHYSICS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Physics 8-10")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "physics_questions.js")
REVIEW_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "physics_needs_review.json")

BLOOMS = {1:"Knowledge",2:"Comprehension",3:"Application",4:"Analysis",5:"Synthesis",6:"Evaluation"}
CLASS_DIFF = {"Class 8":[1,2],"Class 9":[2,3],"Class 10":[3,4]}

OPT_LETTER_RE = re.compile(r'^[\(\[]?([A-Da-d])[\)\]\.]\s*')
Q_START_RE    = re.compile(r'^(?:Q\.?\s*\d+[\.\):]|\d+[\.\)])\s*')
ANS_RE        = re.compile(r'(?:ans(?:wer)?|correct\s*(?:option|answer)?)[\s:\-]*([A-Da-d])\b', re.I)
FOOTNOTE_RE   = re.compile(r'\[\d+\]')   # strips stray [1] [2] footnote markers

def clean(s):
    s = FOOTNOTE_RE.sub('', s)
    return re.sub(r'\s+', ' ', s).strip()

def words_to_lines_with_columns(page):
    """
    Group words into visual rows by y-position, then within each row
    detect if there are 2 options side by side (column split) by
    looking for a large x-gap that coincides with a new 'a)/b)/c)/d)'
    marker. Returns list of logical lines (option-split aware).
    """
    words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
    if not words:
        return []

    # group by approx y (row)
    rows = {}
    for w in words:
        y = round(w['top'] / 3) * 3   # bucket rows to handle small jitter
        rows.setdefault(y, []).append(w)

    lines = []
    for y in sorted(rows.keys()):
        row_words = sorted(rows[y], key=lambda w: w['x0'])
        # Find indices where a new option letter marker starts mid-row
        # e.g. "Mg(√2+1)" ... gap ... "b)" "Mg√2"
        split_indices = [0]
        for i in range(1, len(row_words)):
            txt = row_words[i]['text']
            prev_x1 = row_words[i-1]['x1']
            gap = row_words[i]['x0'] - prev_x1
            # New column starts if: big gap AND this word looks like an option marker (a) b) c) d)
            if gap > 15 and re.match(r'^[\(\[]?[a-dA-D][\)\].]$', txt):
                split_indices.append(i)
        split_indices.append(len(row_words))

        if len(split_indices) > 2:
            # row contains multiple option segments — split into separate logical lines
            for k in range(len(split_indices)-1):
                seg = row_words[split_indices[k]:split_indices[k+1]]
                if seg:
                    lines.append(" ".join(w['text'] for w in seg))
        else:
            lines.append(" ".join(w['text'] for w in row_words))

    return lines

def extract_logical_lines(pdf_path):
    """Returns (lines, is_scanned)."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            all_lines = []
            any_text = False
            for page in pdf.pages:
                page_lines = words_to_lines_with_columns(page)
                if page_lines:
                    any_text = True
                all_lines.extend(page_lines)
            if not any_text:
                return [], True
            return all_lines, False
    except Exception as e:
        print(f"    ERROR: {e}")
        return [], True

def parse_mcqs(lines, class_name, topic, q_idx, pdf_file):
    results, flagged = [], []
    cur_q, cur_opts, cur_ans = None, {}, None
    pending_opt_continuation = None  # handles option text wrapping to next line

    def flush():
        nonlocal cur_q, cur_opts, cur_ans
        if cur_q and len(cur_opts) >= 2:
            opts = [cur_opts.get(k,"") for k in "ABCD" if cur_opts.get(k)]
            ans_letter = (cur_ans or "").upper()
            ans = cur_opts.get(ans_letter, "")
            needs_review = False

            if not ans:
                ans = opts[0] if opts else ""
                needs_review = True   # no answer key found — flag for manual check

            diff = random.choice(CLASS_DIFF.get(class_name,[3,4]))
            q_id = f"phy_{q_idx[0]:04d}"
            entry = {
                "id": q_id, "subject":"physics","class":class_name,"topic":topic,
                "difficulty":diff,"bloomsLevel":BLOOMS[diff],
                "question": clean(cur_q),
                "options": [clean(o) for o in opts[:4]],
                "answer": clean(ans),
                "explanation": f"Refer to solution PDF for {pdf_file}",
                "sourceFile": pdf_file,
                "needsReview": needs_review or len(opts) < 4
            }
            results.append(entry)
            if entry["needsReview"]:
                flagged.append(entry)
            q_idx[0] += 1
        cur_q, cur_opts, cur_ans = None, {}, None

    for raw in lines:
        line = raw.strip()
        if not line:
            continue

        # New question starts
        qm = Q_START_RE.match(line)
        if qm:
            flush()
            cur_q = line[qm.end():]
            continue

        # Option line
        om = OPT_LETTER_RE.match(line)
        if om and cur_q is not None:
            letter = om.group(1).upper()
            text = line[om.end():].strip()
            cur_opts[letter] = text
            continue

        # Answer key line
        am = ANS_RE.search(line)
        if am:
            cur_ans = am.group(1).upper()
            continue

        # Continuation line — append to last open option, or question if no options yet
        if cur_opts:
            last_letter = sorted(cur_opts.keys())[-1]
            cur_opts[last_letter] += " " + line
        elif cur_q is not None:
            cur_q += " " + line

    flush()
    return results, flagged

def main():
    if not os.path.exists(PHYSICS_DIR):
        print(f"\nERROR: Folder not found: {PHYSICS_DIR}")
        sys.exit(1)

    all_qs, scanned, all_flagged, q_idx = [], [], [], [1]
    print(f"\nScanning: {PHYSICS_DIR}\n")

    for cls in sorted(os.listdir(PHYSICS_DIR)):
        cls_path = os.path.join(PHYSICS_DIR, cls)
        if not os.path.isdir(cls_path): continue
        for topic in sorted(os.listdir(cls_path)):
            t_path = os.path.join(cls_path, topic)
            if not os.path.isdir(t_path): continue
            pdfs = sorted(f for f in os.listdir(t_path) if f.startswith("question-") and f.endswith(".pdf"))
            for pdf in pdfs:
                pdf_path = os.path.join(t_path, pdf)
                print(f"  {cls}/{topic}/{pdf}")
                lines, is_scan = extract_logical_lines(pdf_path)

                if is_scan:
                    print(f"    SCANNED — placeholder created")
                    scanned.append(f"{cls}/{topic}/{pdf}")
                    diff = random.choice(CLASS_DIFF.get(cls,[3,4]))
                    all_qs.append({"id":f"phy_{q_idx[0]:04d}","subject":"physics","class":cls,
                        "topic":topic,"difficulty":diff,"bloomsLevel":BLOOMS[diff],
                        "question":f"[MANUAL ENTRY NEEDED] {pdf}",
                        "options":["Option A","Option B","Option C","Option D"],
                        "answer":"Option A","explanation":"Add explanation manually.",
                        "sourceFile":pdf,"needsReview":True})
                    q_idx[0] += 1
                    continue

                parsed, flagged = parse_mcqs(lines, cls, topic, q_idx, pdf)
                if parsed:
                    review_pct = round(100*len(flagged)/len(parsed)) if parsed else 0
                    print(f"    OK — {len(parsed)} questions  ({len(flagged)} flagged for review, {review_pct}%)")
                    all_qs.extend(parsed)
                    all_flagged.extend(flagged)
                else:
                    print(f"    No MCQ pattern detected — saving raw text for inspection")
                    raw_path = pdf_path.replace(".pdf","_extracted.txt")
                    with open(raw_path,"w",encoding="utf-8") as f:
                        f.write("\n".join(lines))
                    print(f"    Saved: {os.path.basename(raw_path)}")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    js = f"""// Physics Question Bank — auto-generated by parse_physics_pdfs.py (v2, layout-aware)
// Total: {len(all_qs)} questions | Flagged for review: {len(all_flagged)} | Scanned: {len(scanned)}
//
// difficulty = Bloom's Taxonomy:
//   1=Knowledge  2=Comprehension  3=Application
//   4=Analysis   5=Synthesis      6=Evaluation
//
// IMPORTANT: questions with needsReview:true had parsing issues
// (missing answer key, fewer than 4 options, or column-merge artifacts).
// See data/physics_needs_review.json for the full flagged list to fix manually.

const BLOOMS_LABELS = {json.dumps(BLOOMS, indent=2)}

const physicsQuestions = {json.dumps(all_qs, indent=2, ensure_ascii=False)}

module.exports = {{ physicsQuestions, BLOOMS_LABELS }}
"""
    with open(OUTPUT_FILE,"w",encoding="utf-8") as f: f.write(js)
    with open(REVIEW_FILE,"w",encoding="utf-8") as f:
        json.dump(all_flagged, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*55}")
    print(f"DONE: {len(all_qs)} questions → {OUTPUT_FILE}")
    print(f"FLAGGED FOR REVIEW: {len(all_flagged)} → {REVIEW_FILE}")
    if scanned:
        print(f"\nSCANNED FILES ({len(scanned)}) — need manual entry:")
        for s in scanned: print(f"  - {s}")
    topics = {}
    for q in all_qs: k=f"{q['class']}/{q['topic']}"; topics[k]=topics.get(k,0)+1
    print(f"\nPer topic:")
    for t,n in sorted(topics.items()): print(f"  {t:<35} {n}")
    print("="*55)
    if all_flagged:
        print(f"\n⚠  {len(all_flagged)} questions need manual review (bad parse / missing answer).")
        print(f"   Open data/physics_needs_review.json to see exactly which ones.")
        print(f"   Each flagged question is also marked needsReview:true inside")
        print(f"   data/physics_questions.js — fix or filter them as you see fit.")

if __name__=="__main__": main()
