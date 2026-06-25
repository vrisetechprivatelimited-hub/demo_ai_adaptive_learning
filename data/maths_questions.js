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
const { class8MathsExtra2 } = require('./class8_maths_extra2')
const { class9MathsExtra2 } = require('./class9_maths_extra2')
const { class10MathsExtra2 } = require('./class10_maths_extra2')
const { class8MathsExtra3 } = require('./class8_maths_extra3')
const { class9MathsExtra3 } = require('./class9_maths_extra3')
const { class10MathsExtra3 } = require('./class10_maths_extra3')
const { cbseCl10Maths2024 } = require('./cbse_cl10_maths_2024')

const mathsQuestions = [
  ...class8Maths, ...class8MathsExtra, ...class8MathsExtra2, ...class8MathsExtra3,
  ...class9Maths, ...class9MathsExtra, ...class9MathsExtra2, ...class9MathsExtra3,
  ...class10Maths, ...class10MathsExtra, ...class10MathsExtra2, ...class10MathsExtra3, ...cbseCl10Maths2024,
  ...trigonometry, ...algebra, ...permutation_combination, ...calculus,
  ...coordinate_geometry, ...probability, ...vectors_3d, ...matrices_determinants
]

module.exports = { mathsQuestions }
