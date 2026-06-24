const { mathsQuestions } = require('./maths_questions')

let physicsQuestions = []
try {
  const phys = require('./physics_questions')
  physicsQuestions = phys.physicsQuestions || []
} catch(e) { /* physics_questions.js not generated yet */ }

const questions = [...mathsQuestions, ...physicsQuestions]

// Class-aware topic structure — used by frontend and engine
const CLASS_TOPICS = {
  '8': {
    maths: [
      { id:'rational_numbers',          label:'Rational Numbers' },
      { id:'linear_equations_1var',     label:'Linear Equations (One Variable)' },
      { id:'algebraic_expressions',     label:'Algebraic Expressions & Identities' },
      { id:'mensuration_8',             label:'Mensuration' },
      { id:'exponents_powers',          label:'Exponents & Powers' },
      { id:'direct_inverse_proportion', label:'Direct & Inverse Proportion' },
      { id:'factorization_8',           label:'Factorization' },
      { id:'quadrilaterals',            label:'Understanding Quadrilaterals' },
    ]
  },
  '9': {
    maths: [
      { id:'number_systems',            label:'Number Systems' },
      { id:'polynomials_9',             label:'Polynomials' },
      { id:'coordinate_geometry_9',     label:'Coordinate Geometry' },
      { id:'lines_angles',              label:'Lines & Angles' },
      { id:'triangles_9',              label:'Triangles' },
      { id:'quadrilaterals_9',          label:'Quadrilaterals' },
      { id:'circles_9',                label:'Circles' },
      { id:'surface_volumes_9',         label:'Surface Areas & Volumes' },
      { id:'statistics_9',             label:'Statistics' },
      { id:'probability_9',            label:'Probability' },
    ]
  },
  '10': {
    maths: [
      { id:'real_numbers',              label:'Real Numbers' },
      { id:'polynomials_10',            label:'Polynomials' },
      { id:'pair_linear_equations',     label:'Pair of Linear Equations' },
      { id:'quadratic_equations',       label:'Quadratic Equations' },
      { id:'arithmetic_progressions',   label:'Arithmetic Progressions' },
      { id:'triangles_10',             label:'Triangles & Similarity' },
      { id:'coordinate_geometry_10',    label:'Coordinate Geometry' },
      { id:'trigonometry_10',          label:'Introduction to Trigonometry' },
      { id:'trig_applications',         label:'Applications of Trigonometry' },
      { id:'circles_10',               label:'Circles' },
      { id:'surface_areas_volumes',     label:'Surface Areas & Volumes' },
      { id:'statistics_10',            label:'Statistics' },
      { id:'probability_10',           label:'Probability' },
    ]
  },
  '11': {
    maths: [
      { id:'sets',                      label:'Sets' },
      { id:'relations_functions_11',    label:'Relations & Functions' },
      { id:'trigonometry',              label:'Trigonometric Functions' },
      { id:'algebra',                   label:'Complex Numbers & Quadratics' },
      { id:'linear_inequalities',       label:'Linear Inequalities' },
      { id:'permutation_combination',   label:'Permutation & Combination' },
      { id:'binomial_theorem',          label:'Binomial Theorem' },
      { id:'sequences_series',          label:'Sequences & Series' },
      { id:'coordinate_geometry',       label:'Straight Lines & Conics' },
      { id:'probability',               label:'Probability' },
    ]
  },
  '12': {
    maths: [
      { id:'relations_functions_12',    label:'Relations & Functions' },
      { id:'inverse_trig',              label:'Inverse Trigonometric Functions' },
      { id:'matrices_determinants',     label:'Matrices & Determinants' },
      { id:'calculus',                  label:'Differential & Integral Calculus' },
      { id:'vectors_3d',               label:'Vectors & 3D Geometry' },
      { id:'linear_programming',        label:'Linear Programming' },
      { id:'probability_12',           label:'Probability (Advanced)' },
    ]
  }
}

// Keep legacy export for any code that still references SUBJECT_TOPICS
const SUBJECT_TOPICS = {
  maths: [
    ...CLASS_TOPICS['11'].maths,
    ...CLASS_TOPICS['12'].maths,
  ],
  physics: [...new Set(physicsQuestions.map(q=>q.topic))].map(t=>({
    id: t, label: t.charAt(0).toUpperCase()+t.slice(1)
  }))
}

const DIFFICULTY_LABELS = {
  maths:   { 1:'Easy', 2:'Easy-Med', 3:'Medium', 4:'Hard', 5:'Very Hard' },
  physics: { 1:'Knowledge', 2:'Comprehension', 3:'Application', 4:'Analysis', 5:'Synthesis', 6:'Evaluation' }
}

module.exports = { questions, CLASS_TOPICS, SUBJECT_TOPICS, DIFFICULTY_LABELS }
