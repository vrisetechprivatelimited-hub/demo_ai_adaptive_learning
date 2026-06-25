const { trigonometry } = require('./topic_trigonometry')
const { algebra } = require('./topic_algebra')
const { permutation_combination } = require('./topic_permutation_combination')
const { calculus } = require('./topic_calculus')
const { coordinate_geometry } = require('./topic_coordinate_geometry')
const { probability } = require('./topic_probability')
const { vectors_3d } = require('./topic_vectors_3d')
const { matrices_determinants } = require('./topic_matrices_determinants')
const { class8Maths } = require('./class8_maths')
const { class9Maths } = require('./class9_maths')
const { class10Maths } = require('./class10_maths')
const { class8MathsExtra } = require('./class8_maths_extra')
const { class9MathsExtra } = require('./class9_maths_extra')
const { class10MathsExtra } = require('./class10_maths_extra')

const mathsQuestions = [
  ...class8Maths, ...class8MathsExtra,
  ...class9Maths, ...class9MathsExtra,
  ...class10Maths, ...class10MathsExtra,
  ...trigonometry, ...algebra, ...permutation_combination, ...calculus,
  ...coordinate_geometry, ...probability, ...vectors_3d, ...matrices_determinants
]

module.exports = { mathsQuestions }
