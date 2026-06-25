// Quick diagnostic: run with  node test_pdf.js "path/to/file.pdf"
// It shows raw text, cleaned text, and what questions are parsed.
const pdfParse = require('pdf-parse')
const fs       = require('fs')
const path     = require('path')

const filePath = process.argv[2]
if (!filePath) {
  console.log('Usage: node test_pdf.js "path/to/file.pdf"')
  process.exit(1)
}

const DEVANAGARI = new RegExp('[\\u0900-\\u097F]+', 'g')
const INVISIBLE  = new RegExp('[\\u200B-\\u200F\\uFEFF]+', 'g')

pdfParse(fs.readFileSync(filePath)).then(data => {
  const raw = data.text
  console.log('\n=== PDF INFO ===')
  console.log('Pages :', data.numpages)
  console.log('Chars :', raw.length)

  console.log('\n=== RAW TEXT (first 3000 chars) ===')
  console.log(raw.slice(0, 3000))

  const cleaned = raw
    .replace(DEVANAGARI, ' ')
    .replace(INVISIBLE, '')
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  console.log('\n=== CLEANED TEXT (first 3000 chars) ===')
  console.log(cleaned.slice(0, 3000))

  // Count how many question-like lines appear
  const qLines = cleaned.split('\n').filter(l => /^\s*(?:Q\.?\s*)?\d{1,3}[.)]\s/.test(l))
  console.log('\n=== QUESTION-LIKE LINES ===')
  console.log(`Found ${qLines.length} lines that look like question starts:`)
  qLines.slice(0, 30).forEach(l => console.log(' ', l.slice(0, 120)))

  // Try inline pattern
  const inlineRe = /(?:^|\n)\s*(?:Q\.?\s*)?(\d{1,3})[.)]\s+([\s\S]+?)\s+\(A\)\s+([\s\S]+?)\s+\(B\)\s+([\s\S]+?)\s+\(C\)\s+([\s\S]+?)\s+\(D\)\s+([^\n(]+)/gi
  const inlineMatches = []
  let m
  while ((m = inlineRe.exec(cleaned)) !== null) inlineMatches.push(+m[1])
  console.log(`\n=== Strategy 1 (inline options): matched Q# ${inlineMatches.join(', ') || 'none'} ===`)

  // Try block pattern
  const blocks = cleaned.split(/\n(?=\s*(?:Q\.?\s*)?\d{1,3}[.)]\s)/)
  console.log(`\n=== Strategy 2 (blocks): split into ${blocks.length} block(s) ===`)
  blocks.slice(0, 5).forEach((b, i) => {
    console.log(`\n-- Block ${i+1} (first 200 chars) --`)
    console.log(b.slice(0, 200))
  })
}).catch(err => {
  console.error('pdf-parse error:', err.message)
})
