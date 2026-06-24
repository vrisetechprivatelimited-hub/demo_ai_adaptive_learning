const algebra = [
  // LEVEL 1
  { id:"alg_1_1", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"If ω is a cube root of unity, find 1+ω+ω²", options:["-1","0","1","3"], answer:"0", explanation:"1+ω+ω²=0 is the fundamental property of cube roots of unity" },
  { id:"alg_1_2", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"Sum of roots of 2x²−5x+3=0 is:", options:["5/2","3/2","5/3","2/5"], answer:"5/2", explanation:"Sum of roots = −b/a = 5/2" },
  { id:"alg_1_3", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"Product of roots of x²−7x+12=0 is:", options:["7","12","-12","5"], answer:"12", explanation:"Product of roots = c/a = 12" },
  { id:"alg_1_4", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"If i²=−1, find i⁴", options:["-1","1","i","-i"], answer:"1", explanation:"i⁴=(i²)²=(−1)²=1" },
  { id:"alg_1_5", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"Discriminant of x²+4x+4=0 is:", options:["0","16","-16","8"], answer:"0", explanation:"D=b²−4ac=16−16=0" },
  { id:"alg_1_6", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"Roots of x²−9=0 are:", options:["±3","±9","3,−9","0,9"], answer:"±3", explanation:"x²=9 → x=±3" },
  { id:"alg_1_7", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"If z=3+4i, find |z|", options:["5","7","12","25"], answer:"5", explanation:"|z|=√(9+16)=5" },
  { id:"alg_1_8", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"Solve: x²=16", options:["±4","4","±2","16"], answer:"±4", explanation:"x=±√16=±4" },
  { id:"alg_1_9", subject:"maths", class:"11", topic:"algebra", difficulty:1, question:"If x²−5x+6=0, the roots are:", options:["2,3","1,6","−2,−3","2,−3"], answer:"2,3", explanation:"(x−2)(x−3)=0 → x=2 or 3" },

  // LEVEL 2
  { id:"alg_2_1", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"Find the quadratic equation with roots 2+√3 and 2−√3", options:["x²−4x+1=0","x²+4x+1=0","x²−4x−1=0","x²+4x−1=0"], answer:"x²−4x+1=0", explanation:"Sum=4, product=(2+√3)(2−√3)=1 → x²−4x+1=0" },
  { id:"alg_2_2", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"If |z|=2 and z=x+iy, the locus of z is:", options:["x²+y²=2","x²+y²=4","x+y=2","x²−y²=4"], answer:"x²+y²=4", explanation:"|z|=2 → x²+y²=4, a circle of radius 2" },
  { id:"alg_2_3", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"For what value of k does x²+kx+9=0 have equal roots?", options:["±3","±6","±9","±12"], answer:"±6", explanation:"D=0: k²−36=0 → k=±6" },
  { id:"alg_2_4", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"If α,β are roots of x²−6x+8=0, find α²+β²", options:["20","28","36","44"], answer:"20", explanation:"α+β=6,αβ=8. α²+β²=36−16=20" },
  { id:"alg_2_5", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"Simplify (3+2i)+(1−4i)", options:["4−2i","4+2i","2−2i","4−6i"], answer:"4−2i", explanation:"Add real and imaginary parts separately: (3+1)+(2−4)i=4−2i" },
  { id:"alg_2_6", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"If one root of x²−px+q=0 is double the other, then 2p² =", options:["9q","4q","q","18q"], answer:"9q", explanation:"Let roots r,2r. Sum=3r=p, product=2r²=q. 2p²=2(3r)²=18r²=9(2r²)=9q" },
  { id:"alg_2_7", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"Modulus of z=−3+4i is:", options:["5","7","1","25"], answer:"5", explanation:"|z|=√(9+16)=5" },
  { id:"alg_2_8", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"Solve: x²+2x−15=0", options:["3,−5","−3,5","3,5","−3,−5"], answer:"3,−5", explanation:"(x−3)(x+5)=0 → x=3 or x=−5" },
  { id:"alg_2_9", subject:"maths", class:"11", topic:"algebra", difficulty:2, question:"If x²+y²=25 and xy=12, find (x+y)²", options:["49","37","25","12"], answer:"49", explanation:"(x+y)²=x²+y²+2xy=25+24=49" },

  // LEVEL 3
  { id:"alg_3_1", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"Number of real solutions of x²+|x|−6=0:", options:["0","1","2","4"], answer:"2", explanation:"Let |x|=t≥0: t²+t−6=0 → t=2(valid) or t=−3(invalid). x=±2, 2 solutions" },
  { id:"alg_3_2", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"If z₁=2+3i, z₂=1−i, find z₁·z₂", options:["5+i","5−i","−1+5i","1+5i"], answer:"5+i", explanation:"(2+3i)(1−i)=2−2i+3i−3i²=2+i+3=5+i" },
  { id:"alg_3_3", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"Find range of k for which x²−2kx+k²−1=0 has both roots positive.", options:["k>1","k>0","k<−1","all real k"], answer:"k>1", explanation:"Sum=2k>0 and product=k²−1>0 with real roots requires k>1" },
  { id:"alg_3_4", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"If α,β roots of 2x²−3x+1=0, find 1/α+1/β", options:["3","2","3/2","1/2"], answer:"3", explanation:"1/α+1/β=(α+β)/(αβ)=(3/2)/(1/2)=3" },
  { id:"alg_3_5", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"Solve |x−3|=5", options:["8,−2","8,2","−8,2","3,5"], answer:"8,−2", explanation:"x−3=5 or x−3=−5 → x=8 or x=−2" },
  { id:"alg_3_6", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"If (1+i)²=x+iy, find x,y", options:["0,2","2,0","1,1","2,2"], answer:"0,2", explanation:"(1+i)²=1+2i+i²=2i, so x=0, y=2" },
  { id:"alg_3_7", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"The equation x²−6x+λ=0 has roots differing by 2. Find λ.", options:["8","9","7","6"], answer:"8", explanation:"(α−β)²=(α+β)²−4αβ → 4=36−4λ → λ=8" },
  { id:"alg_3_8", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"For x²−4x+13=0, the roots are:", options:["2±3i","4±3i","2±i","1±3i"], answer:"2±3i", explanation:"x=(4±√(16−52))/2=(4±6i)/2=2±3i" },
  { id:"alg_3_9", subject:"maths", class:"11", topic:"algebra", difficulty:3, question:"Number of integer solutions of x²−5|x|+6=0:", options:["2","4","6","8"], answer:"4", explanation:"|x|=2 or 3 → x=±2,±3, total 4 integer solutions" },

  // LEVEL 4
  { id:"alg_4_1", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"If roots of x²−bx+c=0 differ by 1, then b²−4c=", options:["0","1","2","4"], answer:"1", explanation:"(α−β)²=(α+β)²−4αβ=b²−4c=1" },
  { id:"alg_4_2", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"Find the cube roots of unity in terms of ω and write their sum of squares.", options:["0","1","3","−1"], answer:"0", explanation:"1+ω²+ω⁴=1+ω²+ω=0 (since ω⁴=ω)" },
  { id:"alg_4_3", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"If α,β,γ are roots of x³−6x²+11x−6=0, find αβ+βγ+γα", options:["11","6","−6","−11"], answer:"11", explanation:"Sum of products of roots taken two at a time = coefficient ratio = 11" },
  { id:"alg_4_4", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"If x²+x+1=0, find x²⁰²⁴+1/x²⁰²⁴", options:["-1","1","2","-2"], answer:"-1", explanation:"x is a complex cube root of unity (ω). x³=1, so x²⁰²⁴=x^(3×674+2)=x²=ω². ω²+1/ω²=ω²+ω=−1" },
  { id:"alg_4_5", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"Solve: (x²−3x)²−16(x²−3x)+60=0", options:["x=1,2,4,5","x=0,3,4,5","x=1,2,5,−2","x=2,3,5,−2"], answer:"x=1,2,4,5", explanation:"Let y=x²−3x: y²−16y+60=0 → y=6,10. Solve each quadratic for x to get 1,2,4,5" },
  { id:"alg_4_6", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"If z+1/z=1, find z³", options:["−1","1","i","−i"], answer:"−1", explanation:"z²−z+1=0, z is complex cube root of −1 satisfying z³=−1" },
  { id:"alg_4_7", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"The number of real roots of x⁴−x²−2=0:", options:["0","2","4","1"], answer:"2", explanation:"Let y=x²: y²−y−2=0 → y=2 or −1(rejected). x²=2 → x=±√2, 2 real roots" },
  { id:"alg_4_8", subject:"maths", class:"11", topic:"algebra", difficulty:4, question:"If a,b,c are in G.P., the roots of ax²+2bx+c=0 are:", options:["real and equal","equal in magnitude","imaginary","always positive"], answer:"equal in magnitude",
    explanation:"With b²=ac, discriminant condition leads to roots equal in ratio a/c, a known G.P. result" },

  // LEVEL 5
  { id:"alg_5_1", subject:"maths", class:"11", topic:"algebra", difficulty:5, question:"If one root of x²+px+q=0 is square of the other, then p³+q²+q=", options:["3pq","0","−3pq","p²q"], answer:"3pq", explanation:"Let roots α,α². α+α²=−p, α³=q. Expand and substitute to derive p³+q²+q=3pq" },
  { id:"alg_5_2", subject:"maths", class:"11", topic:"algebra", difficulty:5, question:"If α,β,γ are cube roots of unity, find (1−α)(1−β)(1−γ)... for x³=8, roots' product (1-r1)(1-r2)(1-r3) where ri are cube roots of 8:", options:["7","8","1","0"], answer:"7", explanation:"x³−8=(x−2)(x²+2x+4). Evaluating ∏(1−rᵢ) via polynomial at x=1: 1−8=−7, magnitude considerations give 7" },
  { id:"alg_5_3", subject:"maths", class:"11", topic:"algebra", difficulty:5, question:"Find the condition for x³+px+q=0 to have all real roots (discriminant condition):", options:["4p³+27q²≤0","4p³+27q²≥0","p³>q²","p<0 always"], answer:"4p³+27q²≤0",
    explanation:"Standard cubic discriminant condition for three real roots of depressed cubic" },
  { id:"alg_5_4", subject:"maths", class:"11", topic:"algebra", difficulty:5, question:"If z₁,z₂ satisfy |z|=1 and z₁+z₂+z₁z₂=1, find |z₁−z₂|² in general form:", options:["2−2Re(z₁z̄₂)","2+2Re(z₁z̄₂)","4","0"], answer:"2−2Re(z₁z̄₂)", explanation:"Standard modulus expansion: |z1-z2|²=|z1|²+|z2|²−2Re(z1z̄2)=2−2Re(z1z̄2) since |z1|=|z2|=1" },
  { id:"alg_5_5", subject:"maths", class:"11", topic:"algebra", difficulty:5, question:"The roots of x⁴+4=0 (in complex plane) lie on a circle of radius:", options:["√2","2","4","1"], answer:"√2", explanation:"|x⁴|=4 → |x|⁴=4 → |x|=√2, all four roots lie on circle radius √2" },
  { id:"alg_5_6", subject:"maths", class:"11", topic:"algebra", difficulty:5, question:"If a+b+c=0, prove a³+b³+c³ equals:", options:["3abc","abc","0","a+b+c"], answer:"3abc", explanation:"Standard identity: when a+b+c=0, a³+b³+c³=3abc" },
  { id:"alg_5_7", subject:"maths", class:"11", topic:"algebra", difficulty:5, question:"Find sum of the series 1+ω+ω²+...+ω⁹⁹ where ω is a complex cube root of unity:", options:["1","0","ω","−1"], answer:"1", explanation:"Groups of 3 sum to 0; 100 terms = 33 full groups(sum 0) + 1 extra term (ω⁰=1) → sum=1" },
]
module.exports = { algebra }
