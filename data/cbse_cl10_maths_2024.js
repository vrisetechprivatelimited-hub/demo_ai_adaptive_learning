// CBSE Class 10 Mathematics Standard — Paper 30/2/1 (Series 2LKNM, Set 1)
// Section A: 18 MCQs (Q1–Q18) + 2 Assertion-Reason (Q19–Q20)
// Source: Official CBSE board paper

const cbseCl10Maths2024 = [
  { id:'cbse24_01', subject:'maths', class:'10', topic:'real_numbers', difficulty:1,
    question:'The LCM of 960 and 240 is :',
    options:['960','240','60','15'], answer:'960',
    explanation:'Prime factorize: 960=2^6×3×5, 240=2^4×3×5. LCM=2^6×3×5=960.' },

  { id:'cbse24_02', subject:'maths', class:'10', topic:'real_numbers', difficulty:1,
    question:'The natural number 1 is :',
    options:['a prime number','a composite number','prime as well as composite','neither prime nor composite'],
    answer:'neither prime nor composite',
    explanation:'By definition, primes have exactly two factors and composites have more than two. 1 has only one factor, so it is neither.' },

  { id:'cbse24_03', subject:'maths', class:'10', topic:'real_numbers', difficulty:2,
    question:'For any natural number n, 5^n ends with the digit :',
    options:['0','5','3','2'], answer:'5',
    explanation:'5^1=5, 5^2=25, 5^3=125 — the units digit is always 5 for any natural number n.' },

  { id:'cbse24_04', subject:'maths', class:'10', topic:'polynomials_10', difficulty:2,
    question:'The graph of y = f(x) is given. The number of distinct zeroes of y = f(x) is :',
    options:['0','1','2','3'], answer:'2',
    explanation:'The graph crosses (touches) the x-axis at two distinct points, giving 2 zeroes.' },

  { id:'cbse24_05', subject:'maths', class:'10', topic:'polynomials_10', difficulty:3,
    question:'If α and β are two zeroes of a polynomial f(x) = px² – 2x + 3p and α + β = αβ, then value of p is :',
    options:['–2/3','2/3','1/3','–1/3'], answer:'2/3',
    explanation:'Sum of zeroes α+β = 2/p and product αβ = 3p/p = 3. Setting equal: 2/p = 3 → p = 2/3.' },

  { id:'cbse24_06', subject:'maths', class:'10', topic:'linear_equations_pair', difficulty:2,
    question:'If the pair of linear equations a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0 is consistent and dependent, then :',
    options:['a₁/a₂ ≠ b₁/b₂','a₁/a₂ ≠ b₁/b₂ = c₁/c₂','a₁/a₂ = b₁/b₂ ≠ c₁/c₂','a₁/a₂ = b₁/b₂ = c₁/c₂'],
    answer:'a₁/a₂ = b₁/b₂ = c₁/c₂',
    explanation:'Consistent and dependent means infinitely many solutions — the two equations represent the same line, so a₁/a₂ = b₁/b₂ = c₁/c₂.' },

  { id:'cbse24_07', subject:'maths', class:'10', topic:'arithmetic_progressions', difficulty:3,
    question:'Which of the following sequence is NOT an A.P. ?',
    options:['2, 5/2, 3, 7/2, …','–1·2, –3·2, –5·2, –7·2, …','√2, √8, √18, …','1², 3², 5², 7², …'],
    answer:'1², 3², 5², 7², …',
    explanation:'1,9,25,49 have differences 8,16,24 — not constant, so not an AP. The others all have constant differences.' },

  { id:'cbse24_08', subject:'maths', class:'10', topic:'triangles_10', difficulty:2,
    question:'In triangles ABC and PQR, ∠A = ∠Q and ∠B = ∠R, then AB : AC is equal to :',
    options:['PQ : PR','PQ : QR','QR : QP','PR : QR'], answer:'QR : QP',
    explanation:'∠A=∠Q and ∠B=∠R gives △ABC~△QRP. Corresponding sides: AB/QR = AC/QP, so AB:AC = QR:QP.' },

  { id:'cbse24_09', subject:'maths', class:'10', topic:'coordinate_geometry_10', difficulty:1,
    question:'The distance of the point A(4a, 3a) from x-axis is :',
    options:['3a','–3a','4a','–4a'], answer:'3a',
    explanation:'Distance from the x-axis equals the absolute value of the y-coordinate = |3a| = 3a (taking a > 0).' },

  { id:'cbse24_10', subject:'maths', class:'10', topic:'trigonometry_10', difficulty:2,
    question:'If cos A = 4/5, then the value of tan A is :',
    options:['3/5','3/4','4/3','5/3'], answer:'3/4',
    explanation:'sin A = √(1 – cos²A) = √(1 – 16/25) = 3/5. tan A = sin A / cos A = (3/5)/(4/5) = 3/4.' },

  { id:'cbse24_11', subject:'maths', class:'10', topic:'trigonometry_10', difficulty:3,
    question:'If 2 sin A = 1, then the value of tan A + cot A is :',
    options:['√3','4/√3','√3/2','1'], answer:'4/√3',
    explanation:'sin A = 1/2 → A = 30°. tan 30° = 1/√3, cot 30° = √3. Sum = 1/√3 + √3 = (1+3)/√3 = 4/√3.' },

  { id:'cbse24_12', subject:'maths', class:'10', topic:'trigonometry_10', difficulty:2,
    question:'From a point on the ground, which is 60 m away from the foot of a vertical tower, the angle of elevation of the top of the tower is found to be 45°. The height (in metres) of the tower is :',
    options:['10√3','30√3','60','30'], answer:'60',
    explanation:'tan 45° = height / 60 → 1 = h/60 → h = 60 m.' },

  { id:'cbse24_13', subject:'maths', class:'10', topic:'circles_10', difficulty:3,
    question:'In the given figure, PA and PB are tangents to a circle centred at O. If ∠OAB = 15°, then ∠APB equals :',
    options:['30°','15°','45°','10°'], answer:'30°',
    explanation:'∠OAP = 90° (radius ⊥ tangent), so ∠PAB = 90°–15° = 75°. PA=PB (equal tangents), so ∠PBA=75°. ∠APB = 180°–75°–75° = 30°.' },

  { id:'cbse24_14', subject:'maths', class:'10', topic:'circles_10', difficulty:3,
    question:'In the given figure, PA and PB are tangents to a circle centred at O. If ∠AOB = 130°, then ∠APB is equal to :',
    options:['130°','50°','120°','90°'], answer:'50°',
    explanation:'In quadrilateral OAPB: ∠OAP = ∠OBP = 90°. So ∠APB = 360°–130°–90°–90° = 50°.' },

  { id:'cbse24_15', subject:'maths', class:'10', topic:'surface_areas_volumes', difficulty:3,
    question:'Area of a segment of a circle of radius r and central angle 60° is :',
    options:['πr²/2 – r²/2','2πr/4 – (√3/4)r²','πr²/6 – (√3/4)r²','2πr/4 – r² sin 60°'],
    answer:'πr²/6 – (√3/4)r²',
    explanation:'Sector area = (60/360)πr² = πr²/6. Triangle area = (1/2)r²sin60° = (√3/4)r². Segment = πr²/6 – (√3/4)r².' },

  { id:'cbse24_16', subject:'maths', class:'10', topic:'surface_areas_volumes', difficulty:4,
    question:'A hemispherical bowl is made of steel of thickness 1 cm. The outer radius of the bowl is 6 cm. The volume of steel used (in cm³) is :',
    options:['182π','(182/3)π','(682/3)π','(364/3)π'], answer:'(182/3)π',
    explanation:'Volume = (2/3)π(R³ – r³) = (2/3)π(6³ – 5³) = (2/3)π(216–125) = (2/3)π(91) = 182π/3.' },

  { id:'cbse24_17', subject:'maths', class:'10', topic:'statistics_10', difficulty:2,
    question:'The mean and median of a frequency distribution are 43 and 43·4 respectively. The mode of the distribution is :',
    options:['43·4','42·4','44·2','49·3'], answer:'44·2',
    explanation:'Mode = 3×Median – 2×Mean = 3(43.4) – 2(43) = 130.2 – 86 = 44.2.' },

  { id:'cbse24_18', subject:'maths', class:'10', topic:'probability_10', difficulty:2,
    question:'The probability for a randomly selected number out of 1, 2, 3, 4, …, 25 to be a composite number is :',
    options:['15/25','10/25','11/25','9/25'], answer:'15/25',
    explanation:'Composites in 1–25: 4,6,8,9,10,12,14,15,16,18,20,21,22,24,25 = 15 numbers. P = 15/25.' },

  { id:'cbse24_19', subject:'maths', class:'10', topic:'surface_areas_volumes', difficulty:3,
    question:'Assertion (A): The surface area of the cuboid formed by joining two cubes of sides 4 cm each, end-to-end, is 160 cm². Reason (R): The surface area of a cuboid of dimensions l × b × h is (lb + bh + hl).',
    options:[
      'Both A and R are true and R is the correct explanation of A',
      'Both A and R are true but R is NOT the correct explanation of A',
      'Assertion A is true, but Reason R is false',
      'Assertion A is false, but Reason R is true'
    ],
    answer:'Assertion A is true, but Reason R is false',
    explanation:'A is true: cuboid 8×4×4 → SA = 2(32+16+32)=160 cm². R is false: correct formula is 2(lb+bh+hl), not (lb+bh+hl).' },

  { id:'cbse24_20', subject:'maths', class:'10', topic:'statistics_10', difficulty:3,
    question:'Assertion (A): The mean of first n natural numbers is (n–1)/2. Reason (R): The sum of first n natural numbers is n(n+1)/2.',
    options:[
      'Both A and R are true and R is the correct explanation of A',
      'Both A and R are true but R is NOT the correct explanation of A',
      'Assertion A is true, but Reason R is false',
      'Assertion A is false, but Reason R is true'
    ],
    answer:'Assertion A is false, but Reason R is true',
    explanation:'Mean of 1,2,...,n = (n+1)/2, NOT (n-1)/2 → A is false. Sum = n(n+1)/2 is correct → R is true.' }
]

module.exports = { cbseCl10Maths2024 }
