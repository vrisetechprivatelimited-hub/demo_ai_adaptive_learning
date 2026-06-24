const { createSession, getNextQuestion, processAnswer, computeAnalytics, getAllResults } = require('./engine/adaptiveEngine')
const { questions } = require('./data/questions')

console.log('\n═══════════════════════════════════════════')
console.log('  VriseTech Adaptive Engine — Terminal Test')
console.log('═══════════════════════════════════════════\n')

const topics = ['algebra','geometry','trigonometry','mensuration']
const session = createSession('student_1','tenant_001','test_1','dpp', topics, 3)

console.log(`Session created: ${session.totalQuestions} questions (3 per topic)\n`)

const sim = [
  {correct:true,time:12000},{correct:true,time:15000},{correct:false,time:25000},
  {correct:false,time:30000},{correct:true,time:45000},{correct:true,time:10000},
  {correct:false,time:20000},{correct:true,time:8000},{correct:true,time:9000},
  {correct:true,time:70000},{correct:false,time:25000},{correct:true,time:12000},
]

for (let i = 0; i < sim.length; i++) {
  const q = getNextQuestion(session)
  if (!q) break
  const s = sim[i]
  const answer = s.correct ? questions.find(x => x.id === q.id).answer : 'WRONG'
  const result = processAnswer(session, q.id, answer, s.time)
  const arrow = result.difficultyChange > 0 ? '↑' : result.difficultyChange < 0 ? '↓' : '→'
  console.log(`Q${i+1}  [${q.topic.padEnd(13)}] diff:${q.difficulty}  ${s.correct?'✓ CORRECT':'✗ WRONG  '} in ${(s.time/1000).toFixed(0)}s  diff ${arrow}${result.newDifficulty}`)
}

console.log('\n─── Final Analytics ──────────────────────\n')
const a = getAllResults(session)
console.log(`Accuracy : ${a.overallAccuracy}%  (${a.totalCorrect}/${a.totalAnswered})`)
for (const [t, v] of Object.entries(a.topicBreakdown)) {
  const bar = '█'.repeat(Math.round(v.accuracy/10))+'░'.repeat(10-Math.round(v.accuracy/10))
  console.log(`  ${t.padEnd(14)} ${bar} ${String(v.accuracy).padStart(3)}%  [${v.status.toUpperCase()}]`)
}
if (a.weakTopics.length)   console.log(`\n⚠  Weak  : ${a.weakTopics.join(', ')}`)
if (a.strongTopics.length) console.log(`★  Strong: ${a.strongTopics.join(', ')}`)
console.log('\n═══════════════════════════════════════════\n')
