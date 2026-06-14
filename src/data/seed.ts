import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function upsertSection(data: { slug: string; title: string; description: string; order_index: number }) {
  const { data: existing } = await supabase.from('sections').select('id').eq('slug', data.slug).single()
  if (existing) { console.log(`⏭️  Section exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('sections').insert(data).select('id').single()
  if (error) { console.error(`❌ Section error (${data.slug}):`, error.message); process.exit(1) }
  console.log(`✅ Section: ${data.title}`)
  return row!.id
}

async function upsertCourse(data: { section_id: string; slug: string; title: string; description: string; order_index: number }) {
  const { data: existing } = await supabase.from('courses').select('id').eq('slug', data.slug).single()
  if (existing) { console.log(`  ⏭️  Course exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('courses').insert(data).select('id').single()
  if (error) { console.error(`❌ Course error (${data.slug}):`, error.message); process.exit(1) }
  console.log(`  ✅ Course: ${data.title}`)
  return row!.id
}

async function upsertLesson(data: { course_id: string; slug: string; title: string; content: unknown[]; order_index: number }) {
  const { data: existing } = await supabase.from('lessons').select('id').eq('course_id', data.course_id).eq('slug', data.slug).single()
  if (existing) { console.log(`    ⏭️  Lesson exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('lessons').insert(data).select('id').single()
  if (error) { console.error(`❌ Lesson error (${data.slug}):`, error.message); process.exit(1) }
  console.log(`    ✅ Lesson: ${data.title}`)
  return row!.id
}

async function upsertQuiz(data: { lesson_id: string; question: string; options: string[]; correct_option_index: number; explanation: string; order_index: number }) {
  const { data: existing } = await supabase.from('lesson_quizzes').select('id').eq('lesson_id', data.lesson_id).eq('question', data.question).single()
  if (existing) return
  const { error } = await supabase.from('lesson_quizzes').insert({ ...data, options: JSON.stringify(data.options) })
  if (error) console.error(`❌ Quiz error:`, error.message)
}

async function upsertChallenge(data: {
  course_id: string; slug: string; title: string; description: string
  difficulty: string; starter_code: string; solution_code: string
  hints: string[]; order_index: number
}) {
  const { data: existing } = await supabase.from('challenges').select('id').eq('course_id', data.course_id).eq('slug', data.slug).single()
  if (existing) { console.log(`    ⏭️  Challenge exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('challenges').insert({ ...data, hints: JSON.stringify(data.hints) }).select('id').single()
  if (error) { console.error(`❌ Challenge error (${data.slug}):`, error.message); return null }
  console.log(`    ✅ Challenge: ${data.title}`)
  return row!.id
}

async function upsertTestCases(challenge_id: string, cases: { description: string; function_call: string; expected_output: string; is_hidden: boolean; order_index: number }[]) {
  const { data: existing } = await supabase.from('test_cases').select('id').eq('challenge_id', challenge_id)
  if (existing && existing.length > 0) return
  for (const tc of cases) {
    const { error } = await supabase.from('test_cases').insert({ ...tc, challenge_id })
    if (error) console.error(`❌ TestCase error:`, error.message)
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Seeding JSQuest — full content\n')

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — JavaScript Basics
  // ════════════════════════════════════════════════════════════════════════════
  const s1 = await upsertSection({ slug: 'javascript-basics', title: 'JavaScript Basics', description: 'Master the core building blocks of JavaScript from scratch.', order_index: 1 })

  // ── Course: Variables ──────────────────────────────────────────────────────
  const cVariables = await upsertCourse({ section_id: s1, slug: 'variables', title: 'Variables', description: 'The basics of declaring and assigning values to variables.', order_index: 1 })

  const lVars1 = await upsertLesson({ course_id: cVariables, slug: 'intro', title: 'What are variables?', order_index: 1, content: [
    { type: 'text', content: 'A **variable** is a named container that stores a value. Think of it as a labeled box — you give it a name, put something inside, and can reference it later by that name.' },
    { type: 'code', language: 'javascript', content: `let age = 25;\nconst name = "Alice";\nvar legacy = true;\n\nconsole.log(age);  // 25\nconsole.log(name); // "Alice"` },
    { type: 'callout', calloutType: 'tip', content: 'Use **const** by default. Use **let** only when you need to reassign the value. Avoid **var** — it has confusing scoping rules.' },
    { type: 'quiz', content: '', quizId: 'q1' },
    { type: 'text', content: 'Variable names can contain letters, digits, underscores, and dollar signs. They cannot start with a digit and cannot be a reserved keyword like `let` or `return`.' },
    { type: 'code', language: 'javascript', content: `let userName = "Bob";   // ✅ camelCase (preferred)\nlet user_name = "Bob"; // ✅ snake_case (valid)\nlet 1name = "Bob";     // ❌ SyntaxError: starts with digit` },
  ]})
  await upsertQuiz({ lesson_id: lVars1, question: 'Which keyword should you use for a value that never changes?', options: ['var', 'let', 'const', 'static'], correct_option_index: 2, explanation: '`const` declares a constant — it cannot be reassigned after its initial value is set.', order_index: 1 })

  const lVars2 = await upsertLesson({ course_id: cVariables, slug: 'declaring-variables', title: 'Declaring and assigning', order_index: 2, content: [
    { type: 'text', content: 'You **declare** a variable by writing `let`, `const`, or `var` followed by a name. You **assign** a value using the `=` operator. Both can happen at once or separately.' },
    { type: 'code', language: 'javascript', content: `let score;      // declared, value is undefined\nscore = 10;     // assigned later\n\nconst PI = 3.14159; // declared + assigned at once` },
    { type: 'callout', calloutType: 'warning', content: 'Trying to reassign a `const` throws a **TypeError** at runtime. Always initialize `const` at declaration.' },
    { type: 'code', language: 'javascript', content: `const MAX = 100;\nMAX = 200; // ❌ TypeError: Assignment to constant variable` },
    { type: 'quiz', content: '', quizId: 'q2' },
  ]})
  await upsertQuiz({ lesson_id: lVars2, question: 'What is the value of a declared but unassigned variable?', options: ['null', '0', 'undefined', 'false'], correct_option_index: 2, explanation: 'In JavaScript, declared but uninitialized variables have the value `undefined`.', order_index: 1 })

  // Challenges: Variables
  const ch1 = await upsertChallenge({ course_id: cVariables, slug: 'declare-a-variable', title: 'Declare a variable', description: 'Declare a variable called `name` and assign it the string `"JavaScript"`. Return it.\n\n**Example output:**\n```\n"JavaScript"\n```', difficulty: 'easy', starter_code: 'function solution() {\n  // your code here\n}', solution_code: 'function solution() {\n  const name = "JavaScript";\n  return name;\n}', hints: ['Use const to declare the variable.', 'Assign the string "JavaScript" (capital J and S).', 'Use return to return the variable.'], order_index: 1 })
  if (ch1) await upsertTestCases(ch1, [{ description: 'Returns "JavaScript"', function_call: 'solution()', expected_output: '"JavaScript"', is_hidden: false, order_index: 1 }])

  const ch2 = await upsertChallenge({ course_id: cVariables, slug: 'sum-two-numbers', title: 'Sum two numbers', description: 'Write a function that takes two numbers `a` and `b` and returns their sum.\n\n**Examples:**\n```\nsolution(2, 3)   // 5\nsolution(0, 0)   // 0\nsolution(-1, 1)  // 0\n```', difficulty: 'easy', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b) {\n  return a + b;\n}', hints: ['Use the + operator.', 'Return the result directly without storing it.'], order_index: 2 })
  if (ch2) await upsertTestCases(ch2, [
    { description: 'solution(2, 3) returns 5', function_call: 'solution(2, 3)', expected_output: '5', is_hidden: false, order_index: 1 },
    { description: 'solution(0, 0) returns 0', function_call: 'solution(0, 0)', expected_output: '0', is_hidden: false, order_index: 2 },
    { description: 'solution(-1, 1) returns 0', function_call: 'solution(-1, 1)', expected_output: '0', is_hidden: false, order_index: 3 },
    { description: 'solution(100, 200) returns 300', function_call: 'solution(100, 200)', expected_output: '300', is_hidden: true, order_index: 4 },
  ])

  const ch3 = await upsertChallenge({ course_id: cVariables, slug: 'swap-variables', title: 'Swap two variables', description: 'Given two arguments `a` and `b`, return them swapped as an array `[b, a]`.\n\n**Examples:**\n```\nsolution(1, 2)             // [2, 1]\nsolution("hello", "world") // ["world", "hello"]\n```', difficulty: 'easy', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b) {\n  return [b, a];\n}', hints: ['Return an array literal: return [...]', 'The first element should be b, the second a.'], order_index: 3 })
  if (ch3) await upsertTestCases(ch3, [
    { description: 'solution(1, 2) returns [2,1]', function_call: 'solution(1, 2)', expected_output: '[2,1]', is_hidden: false, order_index: 1 },
    { description: 'solution("hello","world") swaps', function_call: 'solution("hello", "world")', expected_output: '["world","hello"]', is_hidden: false, order_index: 2 },
    { description: 'solution(true, false) swaps', function_call: 'solution(true, false)', expected_output: '[false,true]', is_hidden: true, order_index: 3 },
  ])

  const ch4 = await upsertChallenge({ course_id: cVariables, slug: 'multiply-and-add', title: 'Multiply and add', description: 'Write a function that takes three numbers `a`, `b`, and `c`. Multiply `a` by `b`, then add `c`. Return the result.\n\n**Examples:**\n```\nsolution(2, 3, 4)  // 10\nsolution(5, 5, 5)  // 30\n```', difficulty: 'easy', starter_code: 'function solution(a, b, c) {\n  // your code here\n}', solution_code: 'function solution(a, b, c) {\n  return a * b + c;\n}', hints: ['Use * for multiplication and + for addition.', 'Multiplication happens before addition in JavaScript (standard math precedence).'], order_index: 4 })
  if (ch4) await upsertTestCases(ch4, [
    { description: 'solution(2,3,4) returns 10', function_call: 'solution(2, 3, 4)', expected_output: '10', is_hidden: false, order_index: 1 },
    { description: 'solution(5,5,5) returns 30', function_call: 'solution(5, 5, 5)', expected_output: '30', is_hidden: false, order_index: 2 },
    { description: 'solution(0,100,7) returns 7', function_call: 'solution(0, 100, 7)', expected_output: '7', is_hidden: true, order_index: 3 },
  ])

  const ch5 = await upsertChallenge({ course_id: cVariables, slug: 'absolute-difference', title: 'Absolute difference', description: 'Write a function that takes two numbers and returns the absolute difference between them (always a positive number).\n\n**Examples:**\n```\nsolution(10, 3)  // 7\nsolution(3, 10)  // 7\nsolution(5, 5)   // 0\n```', difficulty: 'medium', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b) {\n  return Math.abs(a - b);\n}', hints: ['Subtract one from the other first.', 'Use Math.abs() to make it always positive.'], order_index: 5 })
  if (ch5) await upsertTestCases(ch5, [
    { description: 'solution(10,3) returns 7', function_call: 'solution(10, 3)', expected_output: '7', is_hidden: false, order_index: 1 },
    { description: 'solution(3,10) returns 7', function_call: 'solution(3, 10)', expected_output: '7', is_hidden: false, order_index: 2 },
    { description: 'solution(5,5) returns 0', function_call: 'solution(5, 5)', expected_output: '0', is_hidden: false, order_index: 3 },
  ])

  // ── Course: Booleans ───────────────────────────────────────────────────────
  const cBooleans = await upsertCourse({ section_id: s1, slug: 'booleans', title: 'Booleans', description: 'Learn how to make your code think with true/false logic.', order_index: 2 })

  const lBool1 = await upsertLesson({ course_id: cBooleans, slug: 'intro', title: 'What are booleans?', order_index: 1, content: [
    { type: 'text', content: 'A **boolean** is a value that is either `true` or `false`. Booleans are the foundation of all logic in programming — every condition, every decision is ultimately boolean.' },
    { type: 'code', language: 'javascript', content: `const isLoggedIn = true;\nconst hasError = false;\n\nconsole.log(typeof isLoggedIn); // "boolean"` },
    { type: 'callout', calloutType: 'info', content: 'In JavaScript, values can be **truthy** or **falsy** — they behave like `true` or `false` in boolean contexts even if they are not literally booleans.' },
    { type: 'code', language: 'javascript', content: `// Falsy values (only these 6):\nfalse, 0, "", null, undefined, NaN\n\n// Everything else is truthy:\n1, -1, "hello", [], {}, function(){}` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lBool1, question: 'Which of the following is a falsy value?', options: ['"false"', '[]', '0', '-1'], correct_option_index: 2, explanation: '`0` is falsy. The string `"false"` is truthy (any non-empty string is truthy), and `[]` is also truthy (arrays are always truthy).', order_index: 1 })

  const lBool2 = await upsertLesson({ course_id: cBooleans, slug: 'logical-operators', title: 'Logical operators', order_index: 2, content: [
    { type: 'text', content: 'JavaScript has three logical operators: **AND** (`&&`), **OR** (`||`), and **NOT** (`!`). They let you combine and invert boolean expressions.' },
    { type: 'code', language: 'javascript', content: `// AND: both must be true\ntrue && true   // true\ntrue && false  // false\n\n// OR: at least one must be true\ntrue || false  // true\nfalse || false // false\n\n// NOT: inverts the value\n!true  // false\n!false // true` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lBool2, question: 'What does !false evaluate to?', options: ['false', 'null', 'true', 'undefined'], correct_option_index: 2, explanation: 'The NOT operator (`!`) inverts a boolean. `!false` becomes `true`.', order_index: 1 })

  const ch6 = await upsertChallenge({ course_id: cBooleans, slug: 'return-true', title: 'Return true', description: 'Write a function that always returns `true`.\n\n**Example:**\n```\nsolution() // true\n```', difficulty: 'easy', starter_code: 'function solution() {\n  // your code here\n}', solution_code: 'function solution() {\n  return true;\n}', hints: ['The boolean literal for true is: true (no quotes).'], order_index: 1 })
  if (ch6) await upsertTestCases(ch6, [{ description: 'Returns true', function_call: 'solution()', expected_output: 'true', is_hidden: false, order_index: 1 }])

  const ch7 = await upsertChallenge({ course_id: cBooleans, slug: 'check-if-adult', title: 'Check if adult', description: 'Write a function that takes an `age` (number) and returns `true` if the person is 18 or older, `false` otherwise.\n\n**Examples:**\n```\nsolution(18) // true\nsolution(17) // false\nsolution(25) // true\n```', difficulty: 'easy', starter_code: 'function solution(age) {\n  // your code here\n}', solution_code: 'function solution(age) {\n  return age >= 18;\n}', hints: ['Use the >= operator.', 'Comparison operators return a boolean directly — no need for an if statement.'], order_index: 2 })
  if (ch7) await upsertTestCases(ch7, [
    { description: 'solution(18) returns true', function_call: 'solution(18)', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'solution(17) returns false', function_call: 'solution(17)', expected_output: 'false', is_hidden: false, order_index: 2 },
    { description: 'solution(25) returns true', function_call: 'solution(25)', expected_output: 'true', is_hidden: false, order_index: 3 },
    { description: 'solution(0) returns false', function_call: 'solution(0)', expected_output: 'false', is_hidden: true, order_index: 4 },
  ])

  const ch8 = await upsertChallenge({ course_id: cBooleans, slug: 'both-true', title: 'Both true', description: 'Write a function that takes two booleans and returns `true` only if **both** are true.\n\n**Examples:**\n```\nsolution(true, true)   // true\nsolution(true, false)  // false\nsolution(false, false) // false\n```', difficulty: 'easy', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b) {\n  return a && b;\n}', hints: ['Use the && (AND) operator.'], order_index: 3 })
  if (ch8) await upsertTestCases(ch8, [
    { description: 'both true', function_call: 'solution(true, true)', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'one false', function_call: 'solution(true, false)', expected_output: 'false', is_hidden: false, order_index: 2 },
    { description: 'both false', function_call: 'solution(false, false)', expected_output: 'false', is_hidden: false, order_index: 3 },
  ])

  const ch9 = await upsertChallenge({ course_id: cBooleans, slug: 'negate-boolean', title: 'Negate a boolean', description: 'Write a function that takes a boolean and returns its opposite.\n\n**Examples:**\n```\nsolution(true)  // false\nsolution(false) // true\n```', difficulty: 'easy', starter_code: 'function solution(bool) {\n  // your code here\n}', solution_code: 'function solution(bool) {\n  return !bool;\n}', hints: ['Use the ! (NOT) operator.'], order_index: 4 })
  if (ch9) await upsertTestCases(ch9, [
    { description: 'negate true', function_call: 'solution(true)', expected_output: 'false', is_hidden: false, order_index: 1 },
    { description: 'negate false', function_call: 'solution(false)', expected_output: 'true', is_hidden: false, order_index: 2 },
  ])

  const ch10 = await upsertChallenge({ course_id: cBooleans, slug: 'is-even', title: 'Is even', description: 'Write a function that takes a number and returns `true` if it is even, `false` if it is odd.\n\n**Examples:**\n```\nsolution(4)  // true\nsolution(7)  // false\nsolution(0)  // true\n```', difficulty: 'medium', starter_code: 'function solution(n) {\n  // your code here\n}', solution_code: 'function solution(n) {\n  return n % 2 === 0;\n}', hints: ['Use the modulo operator %.', 'If a number divided by 2 has remainder 0, it is even.'], order_index: 5 })
  if (ch10) await upsertTestCases(ch10, [
    { description: 'solution(4) is even', function_call: 'solution(4)', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'solution(7) is odd', function_call: 'solution(7)', expected_output: 'false', is_hidden: false, order_index: 2 },
    { description: 'solution(0) is even', function_call: 'solution(0)', expected_output: 'true', is_hidden: false, order_index: 3 },
    { description: 'solution(-2) is even', function_call: 'solution(-2)', expected_output: 'true', is_hidden: true, order_index: 4 },
  ])

  // ── Course: Operators ──────────────────────────────────────────────────────
  const cOperators = await upsertCourse({ section_id: s1, slug: 'operators', title: 'Operators', description: 'Learn how to calculate with JavaScript values and compare them using operators.', order_index: 3 })

  const lOp1 = await upsertLesson({ course_id: cOperators, slug: 'arithmetic', title: 'Arithmetic operators', order_index: 1, content: [
    { type: 'text', content: 'JavaScript supports the standard arithmetic operators: `+`, `-`, `*`, `/`, and `%` (modulo). There is also `**` for exponentiation.' },
    { type: 'code', language: 'javascript', content: `console.log(10 + 3);  // 13\nconsole.log(10 - 3);  // 7\nconsole.log(10 * 3);  // 30\nconsole.log(10 / 3);  // 3.333...\nconsole.log(10 % 3);  // 1  (remainder)\nconsole.log(2 ** 8);  // 256 (2 to the power of 8)` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lOp1, question: 'What does 17 % 5 return?', options: ['3', '2', '1', '0'], correct_option_index: 1, explanation: '17 divided by 5 is 3 with a remainder of 2. The % operator returns the remainder.', order_index: 1 })

  const lOp2 = await upsertLesson({ course_id: cOperators, slug: 'comparison', title: 'Comparison operators', order_index: 2, content: [
    { type: 'text', content: 'Comparison operators compare two values and return a boolean (`true` or `false`). Always prefer **strict equality** (`===`) over loose equality (`==`).' },
    { type: 'code', language: 'javascript', content: `5 === 5    // true  (strict equal)\n5 === "5"  // false (different types)\n5 == "5"   // true  (loose equal, type coercion — avoid!)\n\n5 !== 3    // true\n5 > 3      // true\n5 < 3      // false\n5 >= 5     // true\n5 <= 4     // false` },
    { type: 'callout', calloutType: 'warning', content: 'Always use `===` and `!==` instead of `==` and `!=`. Loose equality does type coercion which leads to unexpected bugs.' },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lOp2, question: 'What does 5 === "5" return?', options: ['true', 'false', 'undefined', 'TypeError'], correct_option_index: 1, explanation: 'Strict equality (===) checks both value AND type. 5 is a number and "5" is a string, so they are not strictly equal.', order_index: 1 })

  const ch11 = await upsertChallenge({ course_id: cOperators, slug: 'remainder', title: 'Get the remainder', description: 'Write a function that takes two numbers and returns the remainder of dividing the first by the second.\n\n**Examples:**\n```\nsolution(10, 3)  // 1\nsolution(20, 4)  // 0\nsolution(7, 2)   // 1\n```', difficulty: 'easy', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b) {\n  return a % b;\n}', hints: ['Use the % (modulo) operator.'], order_index: 1 })
  if (ch11) await upsertTestCases(ch11, [
    { description: 'solution(10,3) returns 1', function_call: 'solution(10, 3)', expected_output: '1', is_hidden: false, order_index: 1 },
    { description: 'solution(20,4) returns 0', function_call: 'solution(20, 4)', expected_output: '0', is_hidden: false, order_index: 2 },
    { description: 'solution(7,2) returns 1', function_call: 'solution(7, 2)', expected_output: '1', is_hidden: false, order_index: 3 },
  ])

  const ch12 = await upsertChallenge({ course_id: cOperators, slug: 'power', title: 'Power of a number', description: 'Write a function that takes a `base` and an `exponent` and returns `base` raised to the power of `exponent`.\n\n**Examples:**\n```\nsolution(2, 8)   // 256\nsolution(3, 3)   // 27\nsolution(10, 0)  // 1\n```', difficulty: 'easy', starter_code: 'function solution(base, exponent) {\n  // your code here\n}', solution_code: 'function solution(base, exponent) {\n  return base ** exponent;\n}', hints: ['Use the ** operator or Math.pow(base, exponent).'], order_index: 2 })
  if (ch12) await upsertTestCases(ch12, [
    { description: 'solution(2,8) returns 256', function_call: 'solution(2, 8)', expected_output: '256', is_hidden: false, order_index: 1 },
    { description: 'solution(3,3) returns 27', function_call: 'solution(3, 3)', expected_output: '27', is_hidden: false, order_index: 2 },
    { description: 'solution(10,0) returns 1', function_call: 'solution(10, 0)', expected_output: '1', is_hidden: false, order_index: 3 },
  ])

  const ch13 = await upsertChallenge({ course_id: cOperators, slug: 'strict-equals', title: 'Strict equality check', description: 'Write a function that takes two values and returns `true` if they are **strictly equal** (same value AND same type).\n\n**Examples:**\n```\nsolution(5, 5)     // true\nsolution(5, "5")   // false\nsolution(null, undefined) // false\n```', difficulty: 'easy', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b) {\n  return a === b;\n}', hints: ['Use === (strict equality), not == (loose equality).'], order_index: 3 })
  if (ch13) await upsertTestCases(ch13, [
    { description: 'same number', function_call: 'solution(5, 5)', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'number vs string', function_call: 'solution(5, "5")', expected_output: 'false', is_hidden: false, order_index: 2 },
    { description: 'null vs undefined', function_call: 'solution(null, undefined)', expected_output: 'false', is_hidden: false, order_index: 3 },
  ])

  const ch14 = await upsertChallenge({ course_id: cOperators, slug: 'clamp', title: 'Clamp a number', description: 'Write a function that takes a number `n`, a `min`, and a `max`. Return `n` clamped to the range `[min, max]` — if `n` is less than `min`, return `min`; if greater than `max`, return `max`; otherwise return `n`.\n\n**Examples:**\n```\nsolution(5, 1, 10)   // 5\nsolution(-3, 0, 100) // 0\nsolution(150, 0, 100)// 100\n```', difficulty: 'medium', starter_code: 'function solution(n, min, max) {\n  // your code here\n}', solution_code: 'function solution(n, min, max) {\n  return Math.min(Math.max(n, min), max);\n}', hints: ['Use Math.max(n, min) to ensure n is at least min.', 'Then wrap it with Math.min(..., max) to ensure it does not exceed max.'], order_index: 4 })
  if (ch14) await upsertTestCases(ch14, [
    { description: 'in range', function_call: 'solution(5, 1, 10)', expected_output: '5', is_hidden: false, order_index: 1 },
    { description: 'below min', function_call: 'solution(-3, 0, 100)', expected_output: '0', is_hidden: false, order_index: 2 },
    { description: 'above max', function_call: 'solution(150, 0, 100)', expected_output: '100', is_hidden: false, order_index: 3 },
  ])

  // ── Course: Strings ────────────────────────────────────────────────────────
  const cStrings = await upsertCourse({ section_id: s1, slug: 'strings', title: 'Strings', description: 'Learn to declare and manipulate text in JavaScript.', order_index: 4 })

  const lStr1 = await upsertLesson({ course_id: cStrings, slug: 'intro', title: 'String basics', order_index: 1, content: [
    { type: 'text', content: 'A **string** is a sequence of characters enclosed in single quotes, double quotes, or backticks. Backtick strings (template literals) allow embedding expressions.' },
    { type: 'code', language: 'javascript', content: `const a = 'hello';\nconst b = "world";\nconst c = \`Hello, \${b}!\`; // template literal\n\nconsole.log(c); // "Hello, world!"` },
    { type: 'text', content: 'Strings have a `.length` property and many useful methods like `.toUpperCase()`, `.toLowerCase()`, `.trim()`, `.includes()`, `.slice()`, and more.' },
    { type: 'code', language: 'javascript', content: `const s = "  Hello World  ";\nconsole.log(s.length);         // 17\nconsole.log(s.trim());         // "Hello World"\nconsole.log(s.trim().toLowerCase()); // "hello world"` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lStr1, question: 'What does "hello".length return?', options: ['4', '5', '6', 'undefined'], correct_option_index: 1, explanation: '"hello" has 5 characters: h, e, l, l, o. The .length property counts all characters.', order_index: 1 })

  const ch15 = await upsertChallenge({ course_id: cStrings, slug: 'string-length', title: 'Get string length', description: 'Write a function that takes a string and returns its length.\n\n**Examples:**\n```\nsolution("hello")  // 5\nsolution("")       // 0\nsolution("JS!")    // 3\n```', difficulty: 'easy', starter_code: 'function solution(str) {\n  // your code here\n}', solution_code: 'function solution(str) {\n  return str.length;\n}', hints: ['Every string has a .length property.'], order_index: 1 })
  if (ch15) await upsertTestCases(ch15, [
    { description: '"hello" has length 5', function_call: 'solution("hello")', expected_output: '5', is_hidden: false, order_index: 1 },
    { description: 'empty string has length 0', function_call: 'solution("")', expected_output: '0', is_hidden: false, order_index: 2 },
    { description: '"JS!" has length 3', function_call: 'solution("JS!")', expected_output: '3', is_hidden: false, order_index: 3 },
  ])

  const ch16 = await upsertChallenge({ course_id: cStrings, slug: 'uppercase', title: 'Convert to uppercase', description: 'Write a function that takes a string and returns it converted to uppercase.\n\n**Examples:**\n```\nsolution("hello")    // "HELLO"\nsolution("javaScript") // "JAVASCRIPT"\n```', difficulty: 'easy', starter_code: 'function solution(str) {\n  // your code here\n}', solution_code: 'function solution(str) {\n  return str.toUpperCase();\n}', hints: ['Use the .toUpperCase() string method.'], order_index: 2 })
  if (ch16) await upsertTestCases(ch16, [
    { description: 'hello → HELLO', function_call: 'solution("hello")', expected_output: '"HELLO"', is_hidden: false, order_index: 1 },
    { description: 'javaScript → JAVASCRIPT', function_call: 'solution("javaScript")', expected_output: '"JAVASCRIPT"', is_hidden: false, order_index: 2 },
  ])

  const ch17 = await upsertChallenge({ course_id: cStrings, slug: 'concatenate', title: 'Concatenate strings', description: 'Write a function that takes a `firstName` and `lastName` and returns the full name with a space between them.\n\n**Examples:**\n```\nsolution("John", "Doe")   // "John Doe"\nsolution("Ada", "Lovelace") // "Ada Lovelace"\n```', difficulty: 'easy', starter_code: 'function solution(firstName, lastName) {\n  // your code here\n}', solution_code: 'function solution(firstName, lastName) {\n  return `${firstName} ${lastName}`;\n}', hints: ['Use a template literal: `${firstName} ${lastName}`', 'Or use the + operator: firstName + " " + lastName'], order_index: 3 })
  if (ch17) await upsertTestCases(ch17, [
    { description: 'John Doe', function_call: 'solution("John", "Doe")', expected_output: '"John Doe"', is_hidden: false, order_index: 1 },
    { description: 'Ada Lovelace', function_call: 'solution("Ada", "Lovelace")', expected_output: '"Ada Lovelace"', is_hidden: false, order_index: 2 },
  ])

  const ch18 = await upsertChallenge({ course_id: cStrings, slug: 'string-includes', title: 'Check if string contains word', description: 'Write a function that takes a `sentence` and a `word`, and returns `true` if the sentence contains the word, `false` otherwise.\n\n**Examples:**\n```\nsolution("I love JavaScript", "JavaScript") // true\nsolution("I love JavaScript", "Python")     // false\n```', difficulty: 'easy', starter_code: 'function solution(sentence, word) {\n  // your code here\n}', solution_code: 'function solution(sentence, word) {\n  return sentence.includes(word);\n}', hints: ['Use the .includes() string method.'], order_index: 4 })
  if (ch18) await upsertTestCases(ch18, [
    { description: 'contains JavaScript', function_call: 'solution("I love JavaScript", "JavaScript")', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'does not contain Python', function_call: 'solution("I love JavaScript", "Python")', expected_output: 'false', is_hidden: false, order_index: 2 },
  ])

  const ch19 = await upsertChallenge({ course_id: cStrings, slug: 'reverse-string', title: 'Reverse a string', description: 'Write a function that takes a string and returns it reversed.\n\n**Examples:**\n```\nsolution("hello")      // "olleh"\nsolution("JavaScript") // "tpircSavaJ"\n```', difficulty: 'medium', starter_code: 'function solution(str) {\n  // your code here\n}', solution_code: 'function solution(str) {\n  return str.split("").reverse().join("");\n}', hints: ['Split the string into an array of characters with .split("")', 'Reverse the array with .reverse()', 'Join it back with .join("")'], order_index: 5 })
  if (ch19) await upsertTestCases(ch19, [
    { description: 'hello → olleh', function_call: 'solution("hello")', expected_output: '"olleh"', is_hidden: false, order_index: 1 },
    { description: 'JavaScript reversed', function_call: 'solution("JavaScript")', expected_output: '"tpircSavaJ"', is_hidden: false, order_index: 2 },
    { description: 'single char', function_call: 'solution("a")', expected_output: '"a"', is_hidden: true, order_index: 3 },
  ])

  const ch20 = await upsertChallenge({ course_id: cStrings, slug: 'repeat-string', title: 'Repeat a string', description: 'Write a function that takes a string `str` and a number `n`, and returns `str` repeated `n` times.\n\n**Examples:**\n```\nsolution("ha", 3)  // "hahaha"\nsolution("ab", 2)  // "abab"\n```', difficulty: 'medium', starter_code: 'function solution(str, n) {\n  // your code here\n}', solution_code: 'function solution(str, n) {\n  return str.repeat(n);\n}', hints: ['Use the .repeat() string method.'], order_index: 6 })
  if (ch20) await upsertTestCases(ch20, [
    { description: 'ha × 3', function_call: 'solution("ha", 3)', expected_output: '"hahaha"', is_hidden: false, order_index: 1 },
    { description: 'ab × 2', function_call: 'solution("ab", 2)', expected_output: '"abab"', is_hidden: false, order_index: 2 },
    { description: 'x × 1', function_call: 'solution("x", 1)', expected_output: '"x"', is_hidden: true, order_index: 3 },
  ])

  // ── Course: Conditionals ───────────────────────────────────────────────────
  const cConditionals = await upsertCourse({ section_id: s1, slug: 'conditionals', title: 'Conditionals', description: 'Control the flow of your programs with if, else, and switch.', order_index: 5 })

  const lCond1 = await upsertLesson({ course_id: cConditionals, slug: 'if-else', title: 'if / else', order_index: 1, content: [
    { type: 'text', content: 'An **if statement** executes a block of code only when a condition is truthy. The **else** block runs when the condition is falsy.' },
    { type: 'code', language: 'javascript', content: `const age = 20;\n\nif (age >= 18) {\n  console.log("Adult");\n} else {\n  console.log("Minor");\n}` },
    { type: 'text', content: 'You can chain multiple conditions with **else if**.' },
    { type: 'code', language: 'javascript', content: `const score = 75;\n\nif (score >= 90) {\n  console.log("A");\n} else if (score >= 75) {\n  console.log("B");\n} else {\n  console.log("C or below");\n}` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lCond1, question: 'What will the following code print?\n\nif (0) { console.log("yes") } else { console.log("no") }', options: ['"yes"', '"no"', 'nothing', 'TypeError'], correct_option_index: 1, explanation: '0 is falsy, so the else block runs and prints "no".', order_index: 1 })

  const ch21 = await upsertChallenge({ course_id: cConditionals, slug: 'positive-negative', title: 'Positive or negative', description: 'Write a function that takes a number and returns `"positive"` if it is greater than 0, `"negative"` if less than 0, or `"zero"` if it is exactly 0.\n\n**Examples:**\n```\nsolution(5)   // "positive"\nsolution(-3)  // "negative"\nsolution(0)   // "zero"\n```', difficulty: 'easy', starter_code: 'function solution(n) {\n  // your code here\n}', solution_code: 'function solution(n) {\n  if (n > 0) return "positive";\n  if (n < 0) return "negative";\n  return "zero";\n}', hints: ['Use if / else if / else.', 'Check for > 0, then < 0, then handle 0 as the default case.'], order_index: 1 })
  if (ch21) await upsertTestCases(ch21, [
    { description: 'positive', function_call: 'solution(5)', expected_output: '"positive"', is_hidden: false, order_index: 1 },
    { description: 'negative', function_call: 'solution(-3)', expected_output: '"negative"', is_hidden: false, order_index: 2 },
    { description: 'zero', function_call: 'solution(0)', expected_output: '"zero"', is_hidden: false, order_index: 3 },
  ])

  const ch22 = await upsertChallenge({ course_id: cConditionals, slug: 'grade', title: 'Letter grade', description: 'Write a function that takes a score (0–100) and returns the letter grade:\n- 90–100 → `"A"`\n- 75–89 → `"B"`\n- 60–74 → `"C"`\n- below 60 → `"F"`\n\n**Examples:**\n```\nsolution(95)  // "A"\nsolution(80)  // "B"\nsolution(50)  // "F"\n```', difficulty: 'easy', starter_code: 'function solution(score) {\n  // your code here\n}', solution_code: 'function solution(score) {\n  if (score >= 90) return "A";\n  if (score >= 75) return "B";\n  if (score >= 60) return "C";\n  return "F";\n}', hints: ['Use else if chains.', 'Check from highest to lowest threshold.'], order_index: 2 })
  if (ch22) await upsertTestCases(ch22, [
    { description: '95 → A', function_call: 'solution(95)', expected_output: '"A"', is_hidden: false, order_index: 1 },
    { description: '80 → B', function_call: 'solution(80)', expected_output: '"B"', is_hidden: false, order_index: 2 },
    { description: '65 → C', function_call: 'solution(65)', expected_output: '"C"', is_hidden: false, order_index: 3 },
    { description: '50 → F', function_call: 'solution(50)', expected_output: '"F"', is_hidden: false, order_index: 4 },
  ])

  const ch23 = await upsertChallenge({ course_id: cConditionals, slug: 'max-of-two', title: 'Maximum of two numbers', description: 'Write a function that takes two numbers and returns the larger one.\n\n**Examples:**\n```\nsolution(3, 7)   // 7\nsolution(10, 2)  // 10\nsolution(5, 5)   // 5\n```', difficulty: 'easy', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b) {\n  return a > b ? a : b;\n}', hints: ['Use an if statement or the ternary operator: condition ? valueIfTrue : valueIfFalse'], order_index: 3 })
  if (ch23) await upsertTestCases(ch23, [
    { description: 'max(3,7) = 7', function_call: 'solution(3, 7)', expected_output: '7', is_hidden: false, order_index: 1 },
    { description: 'max(10,2) = 10', function_call: 'solution(10, 2)', expected_output: '10', is_hidden: false, order_index: 2 },
    { description: 'equal numbers', function_call: 'solution(5, 5)', expected_output: '5', is_hidden: false, order_index: 3 },
  ])

  const ch24 = await upsertChallenge({ course_id: cConditionals, slug: 'fizzbuzz', title: 'FizzBuzz', description: 'Write a function that takes a number `n` and returns:\n- `"FizzBuzz"` if divisible by both 3 and 5\n- `"Fizz"` if divisible by 3\n- `"Buzz"` if divisible by 5\n- The number itself (as string) otherwise\n\n**Examples:**\n```\nsolution(15)  // "FizzBuzz"\nsolution(9)   // "Fizz"\nsolution(10)  // "Buzz"\nsolution(7)   // "7"\n```', difficulty: 'medium', starter_code: 'function solution(n) {\n  // your code here\n}', solution_code: 'function solution(n) {\n  if (n % 15 === 0) return "FizzBuzz";\n  if (n % 3 === 0) return "Fizz";\n  if (n % 5 === 0) return "Buzz";\n  return String(n);\n}', hints: ['Check divisibility by 15 first (both 3 and 5).', 'Use the % operator to check divisibility.', 'Use String(n) to convert the number to a string.'], order_index: 4 })
  if (ch24) await upsertTestCases(ch24, [
    { description: '15 → FizzBuzz', function_call: 'solution(15)', expected_output: '"FizzBuzz"', is_hidden: false, order_index: 1 },
    { description: '9 → Fizz', function_call: 'solution(9)', expected_output: '"Fizz"', is_hidden: false, order_index: 2 },
    { description: '10 → Buzz', function_call: 'solution(10)', expected_output: '"Buzz"', is_hidden: false, order_index: 3 },
    { description: '7 → "7"', function_call: 'solution(7)', expected_output: '"7"', is_hidden: false, order_index: 4 },
    { description: '30 → FizzBuzz', function_call: 'solution(30)', expected_output: '"FizzBuzz"', is_hidden: true, order_index: 5 },
  ])

  // ── Course: Functions I ────────────────────────────────────────────────────
  const cFunctions1 = await upsertCourse({ section_id: s1, slug: 'functions-i', title: 'Functions I', description: 'Learn how to define, call, and pass arguments to functions.', order_index: 6 })

  const lFn1 = await upsertLesson({ course_id: cFunctions1, slug: 'intro', title: 'Defining functions', order_index: 1, content: [
    { type: 'text', content: 'A **function** is a reusable block of code that performs a specific task. You define it once and call it many times. Functions can receive **parameters** and **return** a value.' },
    { type: 'code', language: 'javascript', content: `// Function declaration\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\n// Function expression\nconst double = function(n) {\n  return n * 2;\n};\n\n// Arrow function\nconst square = (n) => n * n;\n\nconsole.log(greet("Alice")); // "Hello, Alice!"\nconsole.log(double(5));      // 10\nconsole.log(square(4));      // 16` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lFn1, question: 'What does a function return if there is no return statement?', options: ['0', 'null', 'false', 'undefined'], correct_option_index: 3, explanation: 'Functions without a return statement (or with a bare `return`) return `undefined` by default.', order_index: 1 })

  const ch25 = await upsertChallenge({ course_id: cFunctions1, slug: 'greet', title: 'Greet a person', description: 'Write a function that takes a `name` and returns the string `"Hello, {name}!"`.\n\n**Examples:**\n```\nsolution("Alice") // "Hello, Alice!"\nsolution("World") // "Hello, World!"\n```', difficulty: 'easy', starter_code: 'function solution(name) {\n  // your code here\n}', solution_code: 'function solution(name) {\n  return `Hello, ${name}!`;\n}', hints: ['Use a template literal: `Hello, ${name}!`'], order_index: 1 })
  if (ch25) await upsertTestCases(ch25, [
    { description: 'Hello, Alice!', function_call: 'solution("Alice")', expected_output: '"Hello, Alice!"', is_hidden: false, order_index: 1 },
    { description: 'Hello, World!', function_call: 'solution("World")', expected_output: '"Hello, World!"', is_hidden: false, order_index: 2 },
  ])

  const ch26 = await upsertChallenge({ course_id: cFunctions1, slug: 'default-param', title: 'Default parameter', description: 'Write a function that takes a `name` with a default value of `"stranger"` and returns `"Hello, {name}!"`.\n\n**Examples:**\n```\nsolution("Bob") // "Hello, Bob!"\nsolution()      // "Hello, stranger!"\n```', difficulty: 'easy', starter_code: 'function solution(name) {\n  // your code here\n}', solution_code: 'function solution(name = "stranger") {\n  return `Hello, ${name}!`;\n}', hints: ['Use a default parameter: function solution(name = "stranger") { ... }'], order_index: 2 })
  if (ch26) await upsertTestCases(ch26, [
    { description: 'with name', function_call: 'solution("Bob")', expected_output: '"Hello, Bob!"', is_hidden: false, order_index: 1 },
    { description: 'no argument', function_call: 'solution()', expected_output: '"Hello, stranger!"', is_hidden: false, order_index: 2 },
  ])

  const ch27 = await upsertChallenge({ course_id: cFunctions1, slug: 'multiply-fn', title: 'Multiply function', description: 'Write a function that takes two numbers and returns their product. If only one number is provided, return that number multiplied by itself.\n\n**Examples:**\n```\nsolution(3, 4)  // 12\nsolution(5)     // 25\n```', difficulty: 'medium', starter_code: 'function solution(a, b) {\n  // your code here\n}', solution_code: 'function solution(a, b = a) {\n  return a * b;\n}', hints: ['Use a default parameter for b.', 'Set the default of b to be a itself: function solution(a, b = a)'], order_index: 3 })
  if (ch27) await upsertTestCases(ch27, [
    { description: 'two args', function_call: 'solution(3, 4)', expected_output: '12', is_hidden: false, order_index: 1 },
    { description: 'one arg squares it', function_call: 'solution(5)', expected_output: '25', is_hidden: false, order_index: 2 },
    { description: 'solution(2,3) = 6', function_call: 'solution(2, 3)', expected_output: '6', is_hidden: true, order_index: 3 },
  ])

  // ── Course: Arrays ─────────────────────────────────────────────────────────
  const cArrays = await upsertCourse({ section_id: s1, slug: 'arrays', title: 'Arrays', description: 'The basics of working with arrays in JavaScript.', order_index: 7 })

  const lArr1 = await upsertLesson({ course_id: cArrays, slug: 'intro', title: 'Array basics', order_index: 1, content: [
    { type: 'text', content: 'An **array** is an ordered list of values. Arrays can hold any type of value — numbers, strings, booleans, objects, even other arrays.' },
    { type: 'code', language: 'javascript', content: `const fruits = ["apple", "banana", "cherry"];\n\nconsole.log(fruits[0]);      // "apple" (0-indexed)\nconsole.log(fruits.length);  // 3\nfruits.push("date");         // add to end\nfruits.pop();                // remove from end\nconsole.log(fruits);         // ["apple", "banana", "cherry"]` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lArr1, question: 'What is the index of the first element in an array?', options: ['1', '-1', '0', 'first'], correct_option_index: 2, explanation: 'Arrays in JavaScript are zero-indexed. The first element is always at index 0.', order_index: 1 })

  const ch28 = await upsertChallenge({ course_id: cArrays, slug: 'first-element', title: 'Get first element', description: 'Write a function that takes an array and returns its first element.\n\n**Examples:**\n```\nsolution([1, 2, 3])        // 1\nsolution(["a", "b", "c"])  // "a"\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr[0];\n}', hints: ['Arrays are zero-indexed. The first element is at index 0.'], order_index: 1 })
  if (ch28) await upsertTestCases(ch28, [
    { description: 'first of numbers', function_call: 'solution([1, 2, 3])', expected_output: '1', is_hidden: false, order_index: 1 },
    { description: 'first of strings', function_call: 'solution(["a", "b", "c"])', expected_output: '"a"', is_hidden: false, order_index: 2 },
  ])

  const ch29 = await upsertChallenge({ course_id: cArrays, slug: 'last-element', title: 'Get last element', description: 'Write a function that takes an array and returns its last element.\n\n**Examples:**\n```\nsolution([1, 2, 3])  // 3\nsolution(["x"])      // "x"\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr[arr.length - 1];\n}', hints: ['The last index is arr.length - 1.'], order_index: 2 })
  if (ch29) await upsertTestCases(ch29, [
    { description: 'last of 3', function_call: 'solution([1, 2, 3])', expected_output: '3', is_hidden: false, order_index: 1 },
    { description: 'single element', function_call: 'solution(["x"])', expected_output: '"x"', is_hidden: false, order_index: 2 },
  ])

  const ch30 = await upsertChallenge({ course_id: cArrays, slug: 'array-sum', title: 'Sum of array', description: 'Write a function that takes an array of numbers and returns their sum.\n\n**Examples:**\n```\nsolution([1, 2, 3, 4])  // 10\nsolution([10, -5, 3])   // 8\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  let sum = 0;\n  for (const n of arr) sum += n;\n  return sum;\n}', hints: ['Use a loop to iterate over the array.', 'Accumulate the sum in a variable starting at 0.', 'Or use arr.reduce((acc, n) => acc + n, 0)'], order_index: 3 })
  if (ch30) await upsertTestCases(ch30, [
    { description: 'sum of positives', function_call: 'solution([1, 2, 3, 4])', expected_output: '10', is_hidden: false, order_index: 1 },
    { description: 'sum with negative', function_call: 'solution([10, -5, 3])', expected_output: '8', is_hidden: false, order_index: 2 },
    { description: 'empty array', function_call: 'solution([])', expected_output: '0', is_hidden: true, order_index: 3 },
  ])

  const ch31 = await upsertChallenge({ course_id: cArrays, slug: 'array-contains', title: 'Array contains value', description: 'Write a function that takes an array and a value, and returns `true` if the array contains that value.\n\n**Examples:**\n```\nsolution([1, 2, 3], 2)       // true\nsolution(["a", "b"], "c")    // false\n```', difficulty: 'easy', starter_code: 'function solution(arr, value) {\n  // your code here\n}', solution_code: 'function solution(arr, value) {\n  return arr.includes(value);\n}', hints: ['Use the .includes() array method.'], order_index: 4 })
  if (ch31) await upsertTestCases(ch31, [
    { description: 'contains 2', function_call: 'solution([1, 2, 3], 2)', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'does not contain c', function_call: 'solution(["a", "b"], "c")', expected_output: 'false', is_hidden: false, order_index: 2 },
  ])

  const ch32 = await upsertChallenge({ course_id: cArrays, slug: 'remove-duplicates', title: 'Remove duplicates', description: 'Write a function that takes an array and returns a new array with all duplicate values removed.\n\n**Examples:**\n```\nsolution([1, 2, 2, 3, 3, 3])  // [1, 2, 3]\nsolution(["a", "a", "b"])      // ["a", "b"]\n```', difficulty: 'medium', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return [...new Set(arr)];\n}', hints: ['A Set automatically removes duplicates.', 'Use the spread operator to convert the Set back to an array: [...new Set(arr)]'], order_index: 5 })
  if (ch32) await upsertTestCases(ch32, [
    { description: 'remove number duplicates', function_call: 'solution([1, 2, 2, 3, 3, 3])', expected_output: '[1,2,3]', is_hidden: false, order_index: 1 },
    { description: 'remove string duplicates', function_call: 'solution(["a", "a", "b"])', expected_output: '["a","b"]', is_hidden: false, order_index: 2 },
  ])

  // ── Course: Objects ────────────────────────────────────────────────────────
  const cObjects = await upsertCourse({ section_id: s1, slug: 'objects', title: 'Objects', description: 'Learn how to work with objects, properties and methods in JavaScript.', order_index: 8 })

  const lObj1 = await upsertLesson({ course_id: cObjects, slug: 'intro', title: 'Object basics', order_index: 1, content: [
    { type: 'text', content: 'An **object** is a collection of key-value pairs. Keys are strings (or Symbols) and values can be any type. Objects are the foundation of most JavaScript data structures.' },
    { type: 'code', language: 'javascript', content: `const person = {\n  name: "Alice",\n  age: 30,\n  isAdmin: false,\n};\n\nconsole.log(person.name);      // "Alice" (dot notation)\nconsole.log(person["age"]);    // 30 (bracket notation)\n\nperson.email = "a@b.com";      // add property\ndelete person.isAdmin;          // remove property` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lObj1, question: 'Which notation lets you access a property with a dynamic key stored in a variable?', options: ['dot notation (obj.key)', 'bracket notation (obj[key])', 'Both work the same', 'Neither'], correct_option_index: 1, explanation: 'Bracket notation (obj[key]) evaluates the expression inside the brackets, so you can use variables. Dot notation requires the literal property name.', order_index: 1 })

  const ch33 = await upsertChallenge({ course_id: cObjects, slug: 'get-property', title: 'Get object property', description: 'Write a function that takes an object `person` with a `name` property, and returns the value of `name`.\n\n**Examples:**\n```\nsolution({ name: "Alice", age: 30 })  // "Alice"\nsolution({ name: "Bob" })             // "Bob"\n```', difficulty: 'easy', starter_code: 'function solution(person) {\n  // your code here\n}', solution_code: 'function solution(person) {\n  return person.name;\n}', hints: ['Use dot notation: person.name'], order_index: 1 })
  if (ch33) await upsertTestCases(ch33, [
    { description: 'get Alice', function_call: 'solution({ name: "Alice", age: 30 })', expected_output: '"Alice"', is_hidden: false, order_index: 1 },
    { description: 'get Bob', function_call: 'solution({ name: "Bob" })', expected_output: '"Bob"', is_hidden: false, order_index: 2 },
  ])

  const ch34 = await upsertChallenge({ course_id: cObjects, slug: 'add-property', title: 'Add a property', description: 'Write a function that takes an object and adds a property `createdAt` with the value `"2024-01-01"`. Return the modified object.\n\n**Example:**\n```\nsolution({ name: "Alice" })\n// { name: "Alice", createdAt: "2024-01-01" }\n```', difficulty: 'easy', starter_code: 'function solution(obj) {\n  // your code here\n}', solution_code: 'function solution(obj) {\n  obj.createdAt = "2024-01-01";\n  return obj;\n}', hints: ['Assign a new property using dot notation: obj.createdAt = ...'], order_index: 2 })
  if (ch34) await upsertTestCases(ch34, [
    { description: 'adds createdAt', function_call: 'solution({ name: "Alice" })', expected_output: '{"name":"Alice","createdAt":"2024-01-01"}', is_hidden: false, order_index: 1 },
  ])

  const ch35 = await upsertChallenge({ course_id: cObjects, slug: 'object-keys', title: 'Get object keys', description: 'Write a function that takes an object and returns an array of its keys.\n\n**Examples:**\n```\nsolution({ a: 1, b: 2, c: 3 })  // ["a", "b", "c"]\nsolution({ name: "Alice" })      // ["name"]\n```', difficulty: 'easy', starter_code: 'function solution(obj) {\n  // your code here\n}', solution_code: 'function solution(obj) {\n  return Object.keys(obj);\n}', hints: ['Use Object.keys(obj) to get an array of all keys.'], order_index: 3 })
  if (ch35) await upsertTestCases(ch35, [
    { description: 'three keys', function_call: 'solution({ a: 1, b: 2, c: 3 })', expected_output: '["a","b","c"]', is_hidden: false, order_index: 1 },
    { description: 'one key', function_call: 'solution({ name: "Alice" })', expected_output: '["name"]', is_hidden: false, order_index: 2 },
  ])

  const ch36 = await upsertChallenge({ course_id: cObjects, slug: 'merge-objects', title: 'Merge two objects', description: 'Write a function that takes two objects and returns a new object that contains all properties from both. If a key exists in both, the second object\'s value should win.\n\n**Example:**\n```\nsolution({ a: 1 }, { b: 2 })      // { a: 1, b: 2 }\nsolution({ a: 1 }, { a: 9, b: 2 }) // { a: 9, b: 2 }\n```', difficulty: 'medium', starter_code: 'function solution(obj1, obj2) {\n  // your code here\n}', solution_code: 'function solution(obj1, obj2) {\n  return { ...obj1, ...obj2 };\n}', hints: ['Use the spread operator: { ...obj1, ...obj2 }', 'Properties spread later override earlier ones.'], order_index: 4 })
  if (ch36) await upsertTestCases(ch36, [
    { description: 'merge distinct keys', function_call: 'solution({ a: 1 }, { b: 2 })', expected_output: '{"a":1,"b":2}', is_hidden: false, order_index: 1 },
    { description: 'second wins on conflict', function_call: 'solution({ a: 1 }, { a: 9, b: 2 })', expected_output: '{"a":9,"b":2}', is_hidden: false, order_index: 2 },
  ])

  // ── Course: Loops ──────────────────────────────────────────────────────────
  const cLoops = await upsertCourse({ section_id: s1, slug: 'loops', title: 'Loops', description: 'Master for, while, and for...of loops to iterate over data.', order_index: 9 })

  const lLoop1 = await upsertLesson({ course_id: cLoops, slug: 'for-loop', title: 'The for loop', order_index: 1, content: [
    { type: 'text', content: 'A **for loop** repeats a block of code a specific number of times. It has three parts: initialization, condition, and increment.' },
    { type: 'code', language: 'javascript', content: `for (let i = 0; i < 5; i++) {\n  console.log(i); // 0, 1, 2, 3, 4\n}\n\n// for...of: iterate over array values\nconst fruits = ["apple", "banana"];\nfor (const fruit of fruits) {\n  console.log(fruit);\n}` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lLoop1, question: 'How many times does this loop run?\n\nfor (let i = 0; i < 3; i++) { }', options: ['2', '3', '4', 'infinite'], correct_option_index: 1, explanation: 'The loop starts at i=0 and runs while i < 3. It runs for i=0, i=1, i=2 — that is 3 times.', order_index: 1 })

  const ch37 = await upsertChallenge({ course_id: cLoops, slug: 'count-to-n', title: 'Count to N', description: 'Write a function that takes a number `n` and returns an array containing all integers from 1 to `n` (inclusive).\n\n**Examples:**\n```\nsolution(5)  // [1, 2, 3, 4, 5]\nsolution(3)  // [1, 2, 3]\n```', difficulty: 'easy', starter_code: 'function solution(n) {\n  // your code here\n}', solution_code: 'function solution(n) {\n  const result = [];\n  for (let i = 1; i <= n; i++) result.push(i);\n  return result;\n}', hints: ['Start a loop from 1 up to and including n.', 'Push each value into a result array.'], order_index: 1 })
  if (ch37) await upsertTestCases(ch37, [
    { description: 'count to 5', function_call: 'solution(5)', expected_output: '[1,2,3,4,5]', is_hidden: false, order_index: 1 },
    { description: 'count to 3', function_call: 'solution(3)', expected_output: '[1,2,3]', is_hidden: false, order_index: 2 },
    { description: 'count to 1', function_call: 'solution(1)', expected_output: '[1]', is_hidden: true, order_index: 3 },
  ])

  const ch38 = await upsertChallenge({ course_id: cLoops, slug: 'sum-up-to', title: 'Sum up to N', description: 'Write a function that takes a number `n` and returns the sum of all integers from 1 to `n`.\n\n**Examples:**\n```\nsolution(5)   // 15  (1+2+3+4+5)\nsolution(10)  // 55\n```', difficulty: 'easy', starter_code: 'function solution(n) {\n  // your code here\n}', solution_code: 'function solution(n) {\n  let sum = 0;\n  for (let i = 1; i <= n; i++) sum += i;\n  return sum;\n}', hints: ['Use a loop that goes from 1 to n.', 'Add each value to a running total.'], order_index: 2 })
  if (ch38) await upsertTestCases(ch38, [
    { description: 'sum to 5 = 15', function_call: 'solution(5)', expected_output: '15', is_hidden: false, order_index: 1 },
    { description: 'sum to 10 = 55', function_call: 'solution(10)', expected_output: '55', is_hidden: false, order_index: 2 },
  ])

  const ch39 = await upsertChallenge({ course_id: cLoops, slug: 'evens-only', title: 'Even numbers only', description: 'Write a function that takes an array of numbers and returns a new array containing only the even numbers.\n\n**Examples:**\n```\nsolution([1, 2, 3, 4, 5, 6])  // [2, 4, 6]\nsolution([1, 3, 5])            // []\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  const result = [];\n  for (const n of arr) {\n    if (n % 2 === 0) result.push(n);\n  }\n  return result;\n}', hints: ['Use a for...of loop.', 'Check if each number is even using n % 2 === 0.'], order_index: 3 })
  if (ch39) await upsertTestCases(ch39, [
    { description: 'filter evens', function_call: 'solution([1, 2, 3, 4, 5, 6])', expected_output: '[2,4,6]', is_hidden: false, order_index: 1 },
    { description: 'no evens', function_call: 'solution([1, 3, 5])', expected_output: '[]', is_hidden: false, order_index: 2 },
  ])

  const ch40 = await upsertChallenge({ course_id: cLoops, slug: 'factorial', title: 'Factorial', description: 'Write a function that takes a non-negative integer `n` and returns `n!` (n factorial).\n\n- `5! = 5 × 4 × 3 × 2 × 1 = 120`\n- `0! = 1`\n\n**Examples:**\n```\nsolution(5)  // 120\nsolution(0)  // 1\nsolution(3)  // 6\n```', difficulty: 'medium', starter_code: 'function solution(n) {\n  // your code here\n}', solution_code: 'function solution(n) {\n  let result = 1;\n  for (let i = 2; i <= n; i++) result *= i;\n  return result;\n}', hints: ['Start with result = 1.', 'Multiply result by each number from 2 up to n.', '0! is 1 by definition — your loop handles this automatically since it never runs.'], order_index: 4 })
  if (ch40) await upsertTestCases(ch40, [
    { description: '5! = 120', function_call: 'solution(5)', expected_output: '120', is_hidden: false, order_index: 1 },
    { description: '0! = 1', function_call: 'solution(0)', expected_output: '1', is_hidden: false, order_index: 2 },
    { description: '3! = 6', function_call: 'solution(3)', expected_output: '6', is_hidden: false, order_index: 3 },
  ])

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — Intermediate JavaScript
  // ════════════════════════════════════════════════════════════════════════════
  const s2 = await upsertSection({ slug: 'intermediate-javascript', title: 'Intermediate JavaScript', description: 'Level up with advanced array methods, scope, closures, and async programming.', order_index: 2 })

  // ── Course: Array Methods ──────────────────────────────────────────────────
  const cArrayMethods = await upsertCourse({ section_id: s2, slug: 'array-methods', title: 'Array Methods', description: 'Master map, filter, reduce, and other powerful array methods.', order_index: 1 })

  const lAm1 = await upsertLesson({ course_id: cArrayMethods, slug: 'map-filter', title: 'map and filter', order_index: 1, content: [
    { type: 'text', content: '**`map()`** creates a new array by transforming every element. **`filter()`** creates a new array containing only elements that pass a test. Both return new arrays — they never modify the original.' },
    { type: 'code', language: 'javascript', content: `const nums = [1, 2, 3, 4, 5];\n\nconst doubled = nums.map(n => n * 2);\n// [2, 4, 6, 8, 10]\n\nconst evens = nums.filter(n => n % 2 === 0);\n// [2, 4]` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lAm1, question: 'What does [1,2,3].map(n => n * 2) return?', options: ['[1,2,3]', '[2,4,6]', '6', 'undefined'], correct_option_index: 1, explanation: 'map() applies the callback to each element and returns a new array with the results. Each element is doubled.', order_index: 1 })

  const lAm2 = await upsertLesson({ course_id: cArrayMethods, slug: 'reduce', title: 'reduce', order_index: 2, content: [
    { type: 'text', content: '**`reduce()`** processes each element of an array and accumulates a single result. It takes a callback with an **accumulator** and the **current value**, plus an initial value for the accumulator.' },
    { type: 'code', language: 'javascript', content: `const nums = [1, 2, 3, 4, 5];\n\nconst sum = nums.reduce((acc, n) => acc + n, 0);\n// 15\n\nconst product = nums.reduce((acc, n) => acc * n, 1);\n// 120` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lAm2, question: 'In reduce((acc, n) => acc + n, 0), what is the 0?', options: ['The last element', 'The initial value of the accumulator', 'The index', 'The array length'], correct_option_index: 1, explanation: 'The second argument to reduce() is the initial value of the accumulator. Here, acc starts at 0 before the first iteration.', order_index: 1 })

  const ch41 = await upsertChallenge({ course_id: cArrayMethods, slug: 'double-array', title: 'Double every element', description: 'Write a function that takes an array of numbers and returns a new array where every element is doubled.\n\n**Examples:**\n```\nsolution([1, 2, 3])     // [2, 4, 6]\nsolution([10, 20, 30])  // [20, 40, 60]\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr.map(n => n * 2);\n}', hints: ['Use .map() to transform each element.'], order_index: 1 })
  if (ch41) await upsertTestCases(ch41, [
    { description: 'double [1,2,3]', function_call: 'solution([1, 2, 3])', expected_output: '[2,4,6]', is_hidden: false, order_index: 1 },
    { description: 'double [10,20,30]', function_call: 'solution([10, 20, 30])', expected_output: '[20,40,60]', is_hidden: false, order_index: 2 },
  ])

  const ch42 = await upsertChallenge({ course_id: cArrayMethods, slug: 'filter-positives', title: 'Filter positive numbers', description: 'Write a function that takes an array of numbers and returns only the positive ones (greater than 0).\n\n**Examples:**\n```\nsolution([1, -2, 3, -4, 0])  // [1, 3]\nsolution([-1, -2, -3])        // []\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr.filter(n => n > 0);\n}', hints: ['Use .filter() with the condition n > 0.'], order_index: 2 })
  if (ch42) await upsertTestCases(ch42, [
    { description: 'filter positives', function_call: 'solution([1, -2, 3, -4, 0])', expected_output: '[1,3]', is_hidden: false, order_index: 1 },
    { description: 'no positives', function_call: 'solution([-1, -2, -3])', expected_output: '[]', is_hidden: false, order_index: 2 },
  ])

  const ch43 = await upsertChallenge({ course_id: cArrayMethods, slug: 'reduce-sum', title: 'Sum with reduce', description: 'Write a function that takes an array of numbers and returns their sum using `reduce()`.\n\n**Examples:**\n```\nsolution([1, 2, 3, 4, 5])  // 15\nsolution([10, -5])          // 5\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr.reduce((acc, n) => acc + n, 0);\n}', hints: ['Use .reduce() with an initial value of 0.', 'The accumulator starts at 0 and adds each element.'], order_index: 3 })
  if (ch43) await upsertTestCases(ch43, [
    { description: 'sum 1..5 = 15', function_call: 'solution([1, 2, 3, 4, 5])', expected_output: '15', is_hidden: false, order_index: 1 },
    { description: 'sum with negative', function_call: 'solution([10, -5])', expected_output: '5', is_hidden: false, order_index: 2 },
  ])

  const ch44 = await upsertChallenge({ course_id: cArrayMethods, slug: 'find-first', title: 'Find first match', description: 'Write a function that takes an array of numbers and a threshold, and returns the **first** number greater than the threshold. Return `undefined` if none found.\n\n**Examples:**\n```\nsolution([1, 5, 3, 8], 4)   // 5\nsolution([1, 2, 3], 10)      // undefined\n```', difficulty: 'medium', starter_code: 'function solution(arr, threshold) {\n  // your code here\n}', solution_code: 'function solution(arr, threshold) {\n  return arr.find(n => n > threshold);\n}', hints: ['Use .find() — it returns the first element that satisfies the condition, or undefined.'], order_index: 4 })
  if (ch44) await upsertTestCases(ch44, [
    { description: 'find first > 4', function_call: 'solution([1, 5, 3, 8], 4)', expected_output: '5', is_hidden: false, order_index: 1 },
    { description: 'none found', function_call: 'solution([1, 2, 3], 10)', expected_output: 'undefined', is_hidden: false, order_index: 2 },
  ])

  const ch45 = await upsertChallenge({ course_id: cArrayMethods, slug: 'flat-map', title: 'Flatten and double', description: 'Write a function that takes an array of arrays of numbers, flattens it, and doubles every number.\n\n**Examples:**\n```\nsolution([[1, 2], [3, 4]])  // [2, 4, 6, 8]\nsolution([[5], [10, 15]])   // [10, 20, 30]\n```', difficulty: 'hard', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr.flatMap(subArr => subArr.map(n => n * 2));\n}', hints: ['Use .flatMap() which maps and then flattens one level.', 'Or use .flat() followed by .map().'], order_index: 5 })
  if (ch45) await upsertTestCases(ch45, [
    { description: 'flatten and double', function_call: 'solution([[1, 2], [3, 4]])', expected_output: '[2,4,6,8]', is_hidden: false, order_index: 1 },
    { description: 'flatten and double 2', function_call: 'solution([[5], [10, 15]])', expected_output: '[10,20,30]', is_hidden: false, order_index: 2 },
  ])

  // ── Course: Functions II ───────────────────────────────────────────────────
  const cFunctions2 = await upsertCourse({ section_id: s2, slug: 'functions-ii', title: 'Functions II', description: 'Explore closures, higher-order functions, and arrow functions.', order_index: 2 })

  const lFn2 = await upsertLesson({ course_id: cFunctions2, slug: 'closures', title: 'Closures', order_index: 1, content: [
    { type: 'text', content: 'A **closure** is a function that remembers the variables from the scope where it was created, even after that scope has finished executing. Closures are one of the most powerful features of JavaScript.' },
    { type: 'code', language: 'javascript', content: `function makeCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\nconsole.log(counter()); // 3` },
    { type: 'callout', calloutType: 'info', content: 'Each call to `makeCounter()` creates a **new closure** with its own `count` variable. Two counters created by `makeCounter()` are completely independent.' },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lFn2, question: 'What does a closure "close over"?', options: ['The function\'s return value', 'The variables in its outer scope', 'Global variables only', 'The function\'s parameters only'], correct_option_index: 1, explanation: 'A closure closes over the variables in its outer (enclosing) scope — it maintains a reference to them even after the outer function has returned.', order_index: 1 })

  const ch46 = await upsertChallenge({ course_id: cFunctions2, slug: 'make-adder', title: 'Make an adder', description: 'Write a function `makeAdder(x)` that returns a new function. The returned function should take a number `y` and return `x + y`.\n\n**Examples:**\n```\nconst add5 = solution(5);\nadd5(3)  // 8\nadd5(10) // 15\n\nconst add10 = solution(10);\nadd10(1) // 11\n```', difficulty: 'medium', starter_code: 'function solution(x) {\n  // your code here\n}', solution_code: 'function solution(x) {\n  return function(y) {\n    return x + y;\n  };\n}', hints: ['Return a function from inside solution.', 'The inner function can access x from the outer scope — that\'s a closure.'], order_index: 1 })
  if (ch46) await upsertTestCases(ch46, [
    { description: 'add5(3) = 8', function_call: 'solution(5)(3)', expected_output: '8', is_hidden: false, order_index: 1 },
    { description: 'add5(10) = 15', function_call: 'solution(5)(10)', expected_output: '15', is_hidden: false, order_index: 2 },
    { description: 'add10(1) = 11', function_call: 'solution(10)(1)', expected_output: '11', is_hidden: false, order_index: 3 },
  ])

  const ch47 = await upsertChallenge({ course_id: cFunctions2, slug: 'once', title: 'Call once', description: 'Write a function `once(fn)` that takes a function `fn` and returns a new function that calls `fn` only on the **first** invocation. Subsequent calls return the result of the first call.\n\n**Example:**\n```\nconst init = solution(() => 42);\ninit() // 42\ninit() // 42 (same result, fn not called again)\n```', difficulty: 'hard', starter_code: 'function solution(fn) {\n  // your code here\n}', solution_code: 'function solution(fn) {\n  let called = false;\n  let result;\n  return function(...args) {\n    if (!called) {\n      called = true;\n      result = fn(...args);\n    }\n    return result;\n  };\n}', hints: ['Use a closure to track whether fn has been called.', 'Store the result of the first call and return it on subsequent calls.'], order_index: 2 })
  if (ch47) await upsertTestCases(ch47, [
    { description: 'first call runs fn', function_call: 'solution(() => 42)()', expected_output: '42', is_hidden: false, order_index: 1 },
  ])

  // ── Course: Scope ──────────────────────────────────────────────────────────
  const cScope = await upsertCourse({ section_id: s2, slug: 'scope', title: 'Scope', description: 'Understand function scope, block scope, and the scope chain.', order_index: 3 })

  const lScope1 = await upsertLesson({ course_id: cScope, slug: 'intro', title: 'What is scope?', order_index: 1, content: [
    { type: 'text', content: '**Scope** determines where a variable is accessible in your code. JavaScript has three types of scope: **global**, **function**, and **block**.' },
    { type: 'code', language: 'javascript', content: `let global = "I am global"; // accessible everywhere\n\nfunction myFn() {\n  let local = "I am local"; // only inside myFn\n  console.log(global);      // ✅ accessible\n  console.log(local);       // ✅ accessible\n}\n\nconsole.log(global); // ✅\nconsole.log(local);  // ❌ ReferenceError` },
    { type: 'callout', calloutType: 'info', content: '`let` and `const` are **block-scoped** — they only exist inside the `{}` block where they are declared. `var` is function-scoped and ignores block boundaries (one more reason to avoid it).' },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lScope1, question: 'What happens when you access a `let` variable outside the block where it was declared?', options: ['Returns undefined', 'Returns null', 'Throws a ReferenceError', 'Returns the variable from the outer scope'], correct_option_index: 2, explanation: '`let` (and `const`) are block-scoped. Accessing them outside their block throws a ReferenceError.', order_index: 1 })

  const ch48 = await upsertChallenge({ course_id: cScope, slug: 'scope-quiz-fn', title: 'Scope in functions', description: 'Write a function that declares a variable `x = 10` inside it, then returns `x * 2`. The variable should NOT be accessible outside.\n\n**Example:**\n```\nsolution()  // 20\n```', difficulty: 'easy', starter_code: 'function solution() {\n  // your code here\n}', solution_code: 'function solution() {\n  const x = 10;\n  return x * 2;\n}', hints: ['Declare x with const inside the function.', 'Return x * 2.'], order_index: 1 })
  if (ch48) await upsertTestCases(ch48, [{ description: 'returns 20', function_call: 'solution()', expected_output: '20', is_hidden: false, order_index: 1 }])

  // ── Course: Async JavaScript ───────────────────────────────────────────────
  const cAsync = await upsertCourse({ section_id: s2, slug: 'asynchronous-javascript', title: 'Asynchronous JavaScript', description: 'Master promises and async/await for handling time-consuming operations.', order_index: 4 })

  const lAsync1 = await upsertLesson({ course_id: cAsync, slug: 'promises', title: 'Promises', order_index: 1, content: [
    { type: 'text', content: 'A **Promise** represents a value that will be available in the future — it is either fulfilled (resolved) or rejected. Use `.then()` to handle the resolved value and `.catch()` for errors.' },
    { type: 'code', language: 'javascript', content: `const p = new Promise((resolve, reject) => {\n  setTimeout(() => resolve("done!"), 1000);\n});\n\np.then(value => console.log(value)) // "done!" after 1s\n .catch(err => console.error(err));` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lAsync1, question: 'What method handles a resolved Promise value?', options: ['.catch()', '.finally()', '.then()', '.resolve()'], correct_option_index: 2, explanation: '.then() is called when a Promise resolves successfully. .catch() handles rejections. .finally() runs regardless.', order_index: 1 })

  const lAsync2 = await upsertLesson({ course_id: cAsync, slug: 'async-await', title: 'async / await', order_index: 2, content: [
    { type: 'text', content: '**async/await** is syntactic sugar over Promises. An `async` function always returns a Promise. Inside it, you can `await` any Promise, which pauses execution until it resolves.' },
    { type: 'code', language: 'javascript', content: `async function fetchUser(id) {\n  try {\n    const response = await fetch(\`/api/users/\${id}\`);\n    const user = await response.json();\n    return user;\n  } catch (error) {\n    console.error("Failed:", error);\n  }\n}` },
    { type: 'callout', calloutType: 'tip', content: 'Always wrap `await` calls in a **try/catch** block to handle errors gracefully.' },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lAsync2, question: 'What does an async function always return?', options: ['undefined', 'The return value directly', 'A Promise', 'A callback'], correct_option_index: 2, explanation: 'async functions always return a Promise. If you return a value, it is wrapped in a resolved Promise. If you throw, it returns a rejected Promise.', order_index: 1 })

  const ch49 = await upsertChallenge({ course_id: cAsync, slug: 'resolve-promise', title: 'Create a resolved promise', description: 'Write a function that takes a value and returns a **resolved** Promise with that value.\n\n**Example:**\n```\nsolution(42) // Promise that resolves to 42\n```', difficulty: 'easy', starter_code: 'function solution(value) {\n  // your code here\n}', solution_code: 'function solution(value) {\n  return Promise.resolve(value);\n}', hints: ['Use Promise.resolve(value) to create an already-resolved promise.'], order_index: 1 })
  if (ch49) await upsertTestCases(ch49, [
    { description: 'resolves to 42', function_call: 'solution(42)', expected_output: '{}', is_hidden: false, order_index: 1 },
  ])

  const ch50 = await upsertChallenge({ course_id: cAsync, slug: 'async-double', title: 'Async double', description: 'Write an `async` function that takes a number and returns a Promise that resolves to that number doubled.\n\n**Example:**\n```\nawait solution(5)   // 10\nawait solution(21)  // 42\n```', difficulty: 'easy', starter_code: 'async function solution(n) {\n  // your code here\n}', solution_code: 'async function solution(n) {\n  return n * 2;\n}', hints: ['An async function automatically wraps your return value in a Promise.', 'Just return n * 2 inside the async function.'], order_index: 2 })
  if (ch50) await upsertTestCases(ch50, [
    { description: 'async double 5 = 10', function_call: 'solution(5)', expected_output: '{}', is_hidden: false, order_index: 1 },
  ])

  // ── Course: Classes ────────────────────────────────────────────────────────
  const cClasses = await upsertCourse({ section_id: s2, slug: 'classes', title: 'Classes', description: 'Create reusable blueprints for objects with JavaScript classes.', order_index: 5 })

  const lClass1 = await upsertLesson({ course_id: cClasses, slug: 'intro', title: 'Class basics', order_index: 1, content: [
    { type: 'text', content: 'A **class** is a blueprint for creating objects. It defines properties and methods that all instances will share. Use `new` to create an instance.' },
    { type: 'code', language: 'javascript', content: `class Animal {\n  constructor(name, sound) {\n    this.name = name;\n    this.sound = sound;\n  }\n\n  speak() {\n    return \`\${this.name} says \${this.sound}!\`;\n  }\n}\n\nconst dog = new Animal("Rex", "woof");\nconsole.log(dog.speak()); // "Rex says woof!"` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lClass1, question: 'What is the purpose of the constructor method?', options: ['To define static methods', 'To initialize instance properties when creating an object', 'To inherit from a parent class', 'To return the class itself'], correct_option_index: 1, explanation: 'The constructor runs automatically when you use `new ClassName()`. It sets up the initial state of the new instance.', order_index: 1 })

  const ch51 = await upsertChallenge({ course_id: cClasses, slug: 'create-class', title: 'Create a Rectangle class', description: 'Create a `Rectangle` class with a constructor that takes `width` and `height`. Add an `area()` method that returns the area, and a `perimeter()` method that returns the perimeter.\n\nYour `solution` function should return a new Rectangle instance.\n\n**Example:**\n```\nconst rect = solution(5, 3);\nrect.area()       // 15\nrect.perimeter()  // 16\n```', difficulty: 'medium', starter_code: 'function solution(width, height) {\n  class Rectangle {\n    // your code here\n  }\n  return new Rectangle(width, height);\n}', solution_code: 'function solution(width, height) {\n  class Rectangle {\n    constructor(w, h) {\n      this.width = w;\n      this.height = h;\n    }\n    area() { return this.width * this.height; }\n    perimeter() { return 2 * (this.width + this.height); }\n  }\n  return new Rectangle(width, height);\n}', hints: ['Define constructor(w, h) and assign this.width and this.height.', 'area() = width * height', 'perimeter() = 2 * (width + height)'], order_index: 1 })
  if (ch51) await upsertTestCases(ch51, [
    { description: 'area of 5x3 = 15', function_call: 'solution(5, 3).area()', expected_output: '15', is_hidden: false, order_index: 1 },
    { description: 'perimeter of 5x3 = 16', function_call: 'solution(5, 3).perimeter()', expected_output: '16', is_hidden: false, order_index: 2 },
    { description: 'area of 4x4 = 16', function_call: 'solution(4, 4).area()', expected_output: '16', is_hidden: true, order_index: 3 },
  ])

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — JavaScript Practice
  // ════════════════════════════════════════════════════════════════════════════
  const s3 = await upsertSection({ slug: 'javascript-practice', title: 'JavaScript Practice', description: 'Real-world challenges to solidify your JavaScript knowledge.', order_index: 3 })

  // ── Course: JS Fundamentals Practice ──────────────────────────────────────
  const cPractice1 = await upsertCourse({ section_id: s3, slug: 'javascript-fundamentals', title: 'JavaScript Fundamentals', description: 'Mixed challenges covering variables, strings, operators, and logic.', order_index: 1 })

  const ch52 = await upsertChallenge({ course_id: cPractice1, slug: 'palindrome', title: 'Palindrome check', description: 'Write a function that takes a string and returns `true` if it is a palindrome (reads the same forwards and backwards), ignoring case.\n\n**Examples:**\n```\nsolution("racecar")  // true\nsolution("hello")    // false\nsolution("Level")    // true\n```', difficulty: 'medium', starter_code: 'function solution(str) {\n  // your code here\n}', solution_code: 'function solution(str) {\n  const clean = str.toLowerCase();\n  return clean === clean.split("").reverse().join("");\n}', hints: ['Convert to lowercase first to ignore case.', 'Reverse the string and check if it equals the original.'], order_index: 1 })
  if (ch52) await upsertTestCases(ch52, [
    { description: 'racecar is palindrome', function_call: 'solution("racecar")', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'hello is not', function_call: 'solution("hello")', expected_output: 'false', is_hidden: false, order_index: 2 },
    { description: 'Level is palindrome (case insensitive)', function_call: 'solution("Level")', expected_output: 'true', is_hidden: false, order_index: 3 },
  ])

  const ch53 = await upsertChallenge({ course_id: cPractice1, slug: 'count-vowels', title: 'Count vowels', description: 'Write a function that takes a string and returns the number of vowels (a, e, i, o, u) in it. Case-insensitive.\n\n**Examples:**\n```\nsolution("hello")       // 2\nsolution("JavaScript")  // 3\nsolution("rhythm")      // 0\n```', difficulty: 'easy', starter_code: 'function solution(str) {\n  // your code here\n}', solution_code: 'function solution(str) {\n  return (str.toLowerCase().match(/[aeiou]/g) || []).length;\n}', hints: ['Convert to lowercase first.', 'Use a regular expression to match vowels: /[aeiou]/g', 'The match() method returns null if no matches — use || [] to default to empty array.'], order_index: 2 })
  if (ch53) await upsertTestCases(ch53, [
    { description: 'hello has 2 vowels', function_call: 'solution("hello")', expected_output: '2', is_hidden: false, order_index: 1 },
    { description: 'JavaScript has 3', function_call: 'solution("JavaScript")', expected_output: '3', is_hidden: false, order_index: 2 },
    { description: 'rhythm has 0', function_call: 'solution("rhythm")', expected_output: '0', is_hidden: false, order_index: 3 },
  ])

  const ch54 = await upsertChallenge({ course_id: cPractice1, slug: 'capitalize-words', title: 'Capitalize each word', description: 'Write a function that takes a string and returns it with the first letter of each word capitalized.\n\n**Examples:**\n```\nsolution("hello world")     // "Hello World"\nsolution("the quick brown") // "The Quick Brown"\n```', difficulty: 'medium', starter_code: 'function solution(str) {\n  // your code here\n}', solution_code: 'function solution(str) {\n  return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");\n}', hints: ['Split the string by spaces.', 'For each word, capitalize the first character and concatenate the rest.', 'Use .charAt(0).toUpperCase() + word.slice(1)'], order_index: 3 })
  if (ch54) await upsertTestCases(ch54, [
    { description: 'capitalize hello world', function_call: 'solution("hello world")', expected_output: '"Hello World"', is_hidden: false, order_index: 1 },
    { description: 'capitalize three words', function_call: 'solution("the quick brown")', expected_output: '"The Quick Brown"', is_hidden: false, order_index: 2 },
  ])

  // ── Course: Arrays Practice ────────────────────────────────────────────────
  const cPractice2 = await upsertCourse({ section_id: s3, slug: 'javascript-arrays', title: 'JavaScript Arrays', description: 'Advanced array challenges to test your knowledge.', order_index: 2 })

  const ch55 = await upsertChallenge({ course_id: cPractice2, slug: 'flatten-array', title: 'Flatten an array', description: 'Write a function that takes a nested array (one level deep) and returns a flat array.\n\n**Examples:**\n```\nsolution([[1, 2], [3, 4], [5]])  // [1, 2, 3, 4, 5]\nsolution([[\"a\"], [\"b\", \"c\"]])    // [\"a\", \"b\", \"c\"]\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr.flat();\n}', hints: ['Use the .flat() method to flatten one level.'], order_index: 1 })
  if (ch55) await upsertTestCases(ch55, [
    { description: 'flatten numbers', function_call: 'solution([[1, 2], [3, 4], [5]])', expected_output: '[1,2,3,4,5]', is_hidden: false, order_index: 1 },
    { description: 'flatten strings', function_call: 'solution([["a"], ["b", "c"]])', expected_output: '["a","b","c"]', is_hidden: false, order_index: 2 },
  ])

  const ch56 = await upsertChallenge({ course_id: cPractice2, slug: 'chunk-array', title: 'Chunk an array', description: 'Write a function that takes an array and a chunk size `n`, and returns the array split into groups of `n` elements.\n\n**Examples:**\n```\nsolution([1,2,3,4,5], 2)  // [[1,2],[3,4],[5]]\nsolution([1,2,3,4], 4)    // [[1,2,3,4]]\n```', difficulty: 'hard', starter_code: 'function solution(arr, n) {\n  // your code here\n}', solution_code: 'function solution(arr, n) {\n  const result = [];\n  for (let i = 0; i < arr.length; i += n) {\n    result.push(arr.slice(i, i + n));\n  }\n  return result;\n}', hints: ['Loop through the array in steps of n.', 'Use .slice(i, i + n) to extract each chunk.'], order_index: 2 })
  if (ch56) await upsertTestCases(ch56, [
    { description: 'chunk by 2', function_call: 'solution([1,2,3,4,5], 2)', expected_output: '[[1,2],[3,4],[5]]', is_hidden: false, order_index: 1 },
    { description: 'chunk all together', function_call: 'solution([1,2,3,4], 4)', expected_output: '[[1,2,3,4]]', is_hidden: false, order_index: 2 },
  ])

  const ch57 = await upsertChallenge({ course_id: cPractice2, slug: 'group-by', title: 'Group by property', description: 'Write a function that takes an array of objects and a `key`, and groups the objects by the value of that key. Return an object where each key maps to an array of matching objects.\n\n**Example:**\n```\nsolution([\n  { name: "Alice", role: "admin" },\n  { name: "Bob", role: "user" },\n  { name: "Carol", role: "admin" }\n], "role")\n// {\n//   admin: [{ name: "Alice", role: "admin" }, { name: "Carol", role: "admin" }],\n//   user:  [{ name: "Bob", role: "user" }]\n// }\n```', difficulty: 'hard', starter_code: 'function solution(arr, key) {\n  // your code here\n}', solution_code: 'function solution(arr, key) {\n  return arr.reduce((groups, item) => {\n    const group = item[key];\n    if (!groups[group]) groups[group] = [];\n    groups[group].push(item);\n    return groups;\n  }, {});\n}', hints: ['Use reduce() with an empty object {} as initial value.', 'For each item, get its key value and push it into the appropriate group array.'], order_index: 3 })
  if (ch57) await upsertTestCases(ch57, [
    { description: 'group by role', function_call: 'solution([{ name: "Alice", role: "admin" }, { name: "Bob", role: "user" }, { name: "Carol", role: "admin" }], "role")', expected_output: '{"admin":[{"name":"Alice","role":"admin"},{"name":"Carol","role":"admin"}],"user":[{"name":"Bob","role":"user"}]}', is_hidden: false, order_index: 1 },
  ])

  // ── Course: Objects Practice ───────────────────────────────────────────────
  const cPractice3 = await upsertCourse({ section_id: s3, slug: 'javascript-objects', title: 'JavaScript Objects', description: 'Challenging object manipulation exercises.', order_index: 3 })

  const ch58 = await upsertChallenge({ course_id: cPractice3, slug: 'deep-get', title: 'Safe property access', description: 'Write a function that takes an object and a dot-separated path string, and returns the value at that path. Return `undefined` if the path does not exist.\n\n**Examples:**\n```\nsolution({ a: { b: { c: 42 } } }, "a.b.c")  // 42\nsolution({ a: 1 }, "a.b.c")                  // undefined\n```', difficulty: 'hard', starter_code: 'function solution(obj, path) {\n  // your code here\n}', solution_code: 'function solution(obj, path) {\n  return path.split(".").reduce((acc, key) => acc?.[key], obj);\n}', hints: ['Split the path by ".".', 'Use reduce() to traverse the object step by step.', 'Use optional chaining (?.) to safely handle missing keys.'], order_index: 1 })
  if (ch58) await upsertTestCases(ch58, [
    { description: 'deep access', function_call: 'solution({ a: { b: { c: 42 } } }, "a.b.c")', expected_output: '42', is_hidden: false, order_index: 1 },
    { description: 'missing path', function_call: 'solution({ a: 1 }, "a.b.c")', expected_output: 'undefined', is_hidden: false, order_index: 2 },
  ])

  const ch59 = await upsertChallenge({ course_id: cPractice3, slug: 'invert-object', title: 'Invert an object', description: 'Write a function that takes an object and returns a new object with keys and values swapped.\n\n**Examples:**\n```\nsolution({ a: 1, b: 2, c: 3 })  // { "1": "a", "2": "b", "3": "c" }\n```', difficulty: 'medium', starter_code: 'function solution(obj) {\n  // your code here\n}', solution_code: 'function solution(obj) {\n  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));\n}', hints: ['Use Object.entries() to get [key, value] pairs.', 'Swap each pair to [value, key].', 'Use Object.fromEntries() to convert back to an object.'], order_index: 2 })
  if (ch59) await upsertTestCases(ch59, [
    { description: 'invert {a:1,b:2,c:3}', function_call: 'solution({ a: 1, b: 2, c: 3 })', expected_output: '{"1":"a","2":"b","3":"c"}', is_hidden: false, order_index: 1 },
  ])

  // ── Course: Dates Practice ─────────────────────────────────────────────────
  const cDates = await upsertCourse({ section_id: s3, slug: 'javascript-dates', title: 'JavaScript Dates', description: 'Work with Date objects, formatting, and time calculations.', order_index: 4 })

  const lDate1 = await upsertLesson({ course_id: cDates, slug: 'intro', title: 'Date basics', order_index: 1, content: [
    { type: 'text', content: 'The `Date` object represents a single moment in time. You can create one with `new Date()` for the current time, or pass a string/timestamp.' },
    { type: 'code', language: 'javascript', content: `const now = new Date();\nconsole.log(now.getFullYear());  // current year\nconsole.log(now.getMonth());     // 0-indexed! Jan = 0\nconsole.log(now.getDate());      // day of month\nconsole.log(now.getDay());       // 0 = Sunday, 6 = Saturday` },
    { type: 'callout', calloutType: 'warning', content: '`getMonth()` is 0-indexed — January is 0, December is 11. Always add 1 when displaying months to users.' },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lDate1, question: 'What does new Date().getMonth() return for January?', options: ['1', '0', '01', '"January"'], correct_option_index: 1, explanation: 'getMonth() returns 0 for January. Months are 0-indexed in JavaScript: 0 = January, 11 = December.', order_index: 1 })

  const ch60 = await upsertChallenge({ course_id: cDates, slug: 'get-year', title: 'Get current year', description: 'Write a function that returns the current year as a number.\n\n**Example:**\n```\nsolution()  // 2024 (or whatever the current year is)\n```', difficulty: 'easy', starter_code: 'function solution() {\n  // your code here\n}', solution_code: 'function solution() {\n  return new Date().getFullYear();\n}', hints: ['Create a new Date object and use .getFullYear()'], order_index: 1 })
  if (ch60) await upsertTestCases(ch60, [
    { description: 'returns a number', function_call: 'typeof solution()', expected_output: '"number"', is_hidden: false, order_index: 1 },
  ])

  const ch61 = await upsertChallenge({ course_id: cDates, slug: 'days-between', title: 'Days between two dates', description: 'Write a function that takes two date strings and returns the number of **full days** between them (absolute value).\n\n**Examples:**\n```\nsolution("2024-01-01", "2024-01-08")  // 7\nsolution("2024-03-10", "2024-03-01")  // 9\n```', difficulty: 'medium', starter_code: 'function solution(date1, date2) {\n  // your code here\n}', solution_code: 'function solution(date1, date2) {\n  const d1 = new Date(date1);\n  const d2 = new Date(date2);\n  const diffMs = Math.abs(d2 - d1);\n  return Math.floor(diffMs / (1000 * 60 * 60 * 24));\n}', hints: ['Subtract two Date objects to get the difference in milliseconds.', 'Use Math.abs() to always get a positive number.', 'Divide by (1000 * 60 * 60 * 24) to convert milliseconds to days.'], order_index: 2 })
  if (ch61) await upsertTestCases(ch61, [
    { description: '7 days apart', function_call: 'solution("2024-01-01", "2024-01-08")', expected_output: '7', is_hidden: false, order_index: 1 },
    { description: '9 days apart reversed', function_call: 'solution("2024-03-10", "2024-03-01")', expected_output: '9', is_hidden: false, order_index: 2 },
  ])

  // ── Course: Sets Practice ──────────────────────────────────────────────────
  const cSets = await upsertCourse({ section_id: s3, slug: 'javascript-sets', title: 'JavaScript Sets', description: 'Work with Sets for unique values and set operations.', order_index: 5 })

  const lSet1 = await upsertLesson({ course_id: cSets, slug: 'intro', title: 'Set basics', order_index: 1, content: [
    { type: 'text', content: 'A **Set** is a collection of **unique** values. Unlike arrays, Sets do not allow duplicates and do not have indexes. They are great for membership checks and deduplication.' },
    { type: 'code', language: 'javascript', content: `const s = new Set([1, 2, 2, 3, 3, 3]);\nconsole.log(s.size);       // 3\nconsole.log(s.has(2));     // true\n\ns.add(4);\ns.delete(1);\n\nconsole.log([...s]);       // [2, 3, 4]` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lSet1, question: 'What is the size of new Set([1, 1, 2, 2, 3])?', options: ['5', '4', '3', '1'], correct_option_index: 2, explanation: 'A Set only keeps unique values. [1, 1, 2, 2, 3] has 3 unique values: 1, 2, and 3.', order_index: 1 })

  const ch62 = await upsertChallenge({ course_id: cSets, slug: 'set-intersection', title: 'Set intersection', description: 'Write a function that takes two arrays and returns a new array containing only the values that appear in **both** arrays (no duplicates).\n\n**Examples:**\n```\nsolution([1,2,3,4], [3,4,5,6])  // [3,4]\nsolution([1,2], [3,4])           // []\n```', difficulty: 'medium', starter_code: 'function solution(arr1, arr2) {\n  // your code here\n}', solution_code: 'function solution(arr1, arr2) {\n  const set2 = new Set(arr2);\n  return [...new Set(arr1)].filter(x => set2.has(x));\n}', hints: ['Convert arr2 to a Set for O(1) lookups.', 'Filter arr1 to only keep elements that exist in the Set.'], order_index: 1 })
  if (ch62) await upsertTestCases(ch62, [
    { description: 'intersection [3,4]', function_call: 'solution([1,2,3,4], [3,4,5,6])', expected_output: '[3,4]', is_hidden: false, order_index: 1 },
    { description: 'no intersection', function_call: 'solution([1,2], [3,4])', expected_output: '[]', is_hidden: false, order_index: 2 },
  ])

  const ch63 = await upsertChallenge({ course_id: cSets, slug: 'set-union', title: 'Set union', description: 'Write a function that takes two arrays and returns a new array containing all unique values from both.\n\n**Examples:**\n```\nsolution([1,2,3], [3,4,5])   // [1,2,3,4,5]\nsolution([1,1,2], [2,3,3])   // [1,2,3]\n```', difficulty: 'easy', starter_code: 'function solution(arr1, arr2) {\n  // your code here\n}', solution_code: 'function solution(arr1, arr2) {\n  return [...new Set([...arr1, ...arr2])];\n}', hints: ['Combine both arrays with spread: [...arr1, ...arr2]', 'Wrap in a Set to remove duplicates, then spread back to array.'], order_index: 2 })
  if (ch63) await upsertTestCases(ch63, [
    { description: 'union of two arrays', function_call: 'solution([1,2,3], [3,4,5])', expected_output: '[1,2,3,4,5]', is_hidden: false, order_index: 1 },
    { description: 'union removes duplicates', function_call: 'solution([1,1,2], [2,3,3])', expected_output: '[1,2,3]', is_hidden: false, order_index: 2 },
  ])

  // ════════════════════════════════════════════════════════════════════════════
  // EXTRA CHALLENGES — bulking up thin courses
  // ════════════════════════════════════════════════════════════════════════════

  // ── More: Scope ────────────────────────────────────────────────────────────
  const ch64 = await upsertChallenge({ course_id: cScope, slug: 'counter-closure', title: 'Counter with closure', description: 'Write a function that returns an object with two methods: `increment()` which adds 1 to an internal counter, and `getCount()` which returns the current count. The counter starts at 0.\n\n**Example:**\n```\nconst c = solution();\nc.increment();\nc.increment();\nc.getCount() // 2\n```', difficulty: 'medium', starter_code: 'function solution() {\n  // your code here\n}', solution_code: 'function solution() {\n  let count = 0;\n  return {\n    increment() { count++; },\n    getCount() { return count; },\n  };\n}', hints: ['Use a closure: declare count inside solution.', 'Return an object with two methods that both reference count.'], order_index: 2 })
  if (ch64) await upsertTestCases(ch64, [
    { description: 'starts at 0', function_call: 'solution().getCount()', expected_output: '0', is_hidden: false, order_index: 1 },
    { description: 'increments correctly', function_call: '(() => { const c = solution(); c.increment(); c.increment(); return c.getCount(); })()', expected_output: '2', is_hidden: false, order_index: 2 },
  ])

  const ch65 = await upsertChallenge({ course_id: cScope, slug: 'block-scope', title: 'Block scope with let', description: 'Write a function that creates a variable `x = 5` inside an `if` block using `let`, then returns `x * 3` from **inside** that same block.\n\n**Example:**\n```\nsolution() // 15\n```', difficulty: 'easy', starter_code: 'function solution() {\n  // your code here\n}', solution_code: 'function solution() {\n  if (true) {\n    let x = 5;\n    return x * 3;\n  }\n}', hints: ['Declare x with let inside an if (true) block.', 'Return x * 3 from inside the same block.'], order_index: 3 })
  if (ch65) await upsertTestCases(ch65, [
    { description: 'returns 15', function_call: 'solution()', expected_output: '15', is_hidden: false, order_index: 1 },
  ])

  // ── More: Classes ──────────────────────────────────────────────────────────
  const ch66 = await upsertChallenge({ course_id: cClasses, slug: 'stack-class', title: 'Stack class', description: 'Create a `Stack` class with:\n- `push(value)` — adds value to the top\n- `pop()` — removes and returns the top value\n- `peek()` — returns the top value without removing it\n- `isEmpty()` — returns `true` if the stack is empty\n\nYour `solution` function should return a new Stack instance.\n\n**Example:**\n```\nconst s = solution();\ns.push(1); s.push(2);\ns.peek()    // 2\ns.pop()     // 2\ns.isEmpty() // false\n```', difficulty: 'medium', starter_code: 'function solution() {\n  class Stack {\n    // your code here\n  }\n  return new Stack();\n}', solution_code: 'function solution() {\n  class Stack {\n    constructor() { this.items = []; }\n    push(v) { this.items.push(v); }\n    pop() { return this.items.pop(); }\n    peek() { return this.items[this.items.length - 1]; }\n    isEmpty() { return this.items.length === 0; }\n  }\n  return new Stack();\n}', hints: ['Use an array internally to store items.', 'push → array.push, pop → array.pop, peek → last element.'], order_index: 2 })
  if (ch66) await upsertTestCases(ch66, [
    { description: 'isEmpty on new stack', function_call: 'solution().isEmpty()', expected_output: 'true', is_hidden: false, order_index: 1 },
    { description: 'peek after pushes', function_call: '(() => { const s = solution(); s.push(1); s.push(2); return s.peek(); })()', expected_output: '2', is_hidden: false, order_index: 2 },
    { description: 'pop returns top', function_call: '(() => { const s = solution(); s.push(10); return s.pop(); })()', expected_output: '10', is_hidden: false, order_index: 3 },
  ])

  const ch67 = await upsertChallenge({ course_id: cClasses, slug: 'inheritance', title: 'Class inheritance', description: 'Create an `Animal` class with a `name` property and a `speak()` method that returns `"{name} makes a sound."`. Then create a `Dog` class that extends `Animal` and overrides `speak()` to return `"{name} barks."`\n\nYour solution should return a new Dog instance.\n\n**Example:**\n```\nconst d = solution("Rex");\nd.speak() // "Rex barks."\n```', difficulty: 'medium', starter_code: 'function solution(name) {\n  class Animal {\n    // your code here\n  }\n  class Dog extends Animal {\n    // your code here\n  }\n  return new Dog(name);\n}', solution_code: 'function solution(name) {\n  class Animal {\n    constructor(name) { this.name = name; }\n    speak() { return `${this.name} makes a sound.`; }\n  }\n  class Dog extends Animal {\n    speak() { return `${this.name} barks.`; }\n  }\n  return new Dog(name);\n}', hints: ['Use extends to inherit from Animal.', 'Override speak() in Dog without calling super.speak().', 'this.name is inherited from Animal\'s constructor.'], order_index: 3 })
  if (ch67) await upsertTestCases(ch67, [
    { description: 'dog speaks', function_call: 'solution("Rex").speak()', expected_output: '"Rex barks."', is_hidden: false, order_index: 1 },
    { description: 'different name', function_call: 'solution("Buddy").speak()', expected_output: '"Buddy barks."', is_hidden: false, order_index: 2 },
  ])

  // ── More: Functions II ─────────────────────────────────────────────────────
  const ch68 = await upsertChallenge({ course_id: cFunctions2, slug: 'memoize', title: 'Memoize a function', description: 'Write a `memoize` function that takes a function `fn` and returns a new version that caches results. If the same argument is passed again, return the cached result without calling `fn` again.\n\n**Example:**\n```\nlet calls = 0;\nconst fn = (n) => { calls++; return n * 2; };\nconst memo = solution(fn);\nmemo(5) // 10\nmemo(5) // 10 (from cache, fn not called again)\ncalls   // 1\n```', difficulty: 'hard', starter_code: 'function solution(fn) {\n  // your code here\n}', solution_code: 'function solution(fn) {\n  const cache = new Map();\n  return function(arg) {\n    if (cache.has(arg)) return cache.get(arg);\n    const result = fn(arg);\n    cache.set(arg, result);\n    return result;\n  };\n}', hints: ['Use a Map to store cached results.', 'Check if the argument is already in the cache before calling fn.'], order_index: 3 })
  if (ch68) await upsertTestCases(ch68, [
    { description: 'returns correct value', function_call: 'solution(n => n * 2)(5)', expected_output: '10', is_hidden: false, order_index: 1 },
    { description: 'caches result', function_call: '(() => { let calls = 0; const memo = solution(n => { calls++; return n * 2; }); memo(3); memo(3); return calls; })()', expected_output: '1', is_hidden: false, order_index: 2 },
  ])

  const ch69 = await upsertChallenge({ course_id: cFunctions2, slug: 'pipe', title: 'Function pipe', description: 'Write a `pipe` function that takes any number of functions and returns a new function. When called with a value, it passes that value through each function from left to right.\n\n**Example:**\n```\nconst double = x => x * 2;\nconst addOne = x => x + 1;\nconst square = x => x * x;\n\nconst transform = solution(double, addOne, square);\ntransform(3) // ((3*2)+1)^2 = 49\n```', difficulty: 'hard', starter_code: 'function solution(...fns) {\n  // your code here\n}', solution_code: 'function solution(...fns) {\n  return function(value) {\n    return fns.reduce((acc, fn) => fn(acc), value);\n  };\n}', hints: ['Use rest parameters (...fns) to collect all functions.', 'Use reduce() to apply each function in sequence.', 'The accumulator starts as the initial value.'], order_index: 4 })
  if (ch69) await upsertTestCases(ch69, [
    { description: 'pipe double → addOne → square', function_call: 'solution(x => x * 2, x => x + 1, x => x * x)(3)', expected_output: '49', is_hidden: false, order_index: 1 },
    { description: 'pipe single fn', function_call: 'solution(x => x + 10)(5)', expected_output: '15', is_hidden: false, order_index: 2 },
  ])

  // ── More: Async JavaScript ─────────────────────────────────────────────────
  const ch70 = await upsertChallenge({ course_id: cAsync, slug: 'promise-all', title: 'Run promises in parallel', description: 'Write a function that takes an array of values, wraps each in `Promise.resolve()`, and returns a Promise that resolves to an array of all values using `Promise.all()`.\n\n**Example:**\n```\nawait solution([1, 2, 3])  // [1, 2, 3]\n```', difficulty: 'medium', starter_code: 'async function solution(values) {\n  // your code here\n}', solution_code: 'async function solution(values) {\n  return Promise.all(values.map(v => Promise.resolve(v)));\n}', hints: ['Use .map() to wrap each value in Promise.resolve().', 'Use Promise.all() to wait for all of them.'], order_index: 3 })
  if (ch70) await upsertTestCases(ch70, [
    { description: 'resolves all values', function_call: 'solution([1, 2, 3])', expected_output: '{}', is_hidden: false, order_index: 1 },
  ])

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — Objects II (Intermediate)
  // ════════════════════════════════════════════════════════════════════════════

  const cObjects2 = await upsertCourse({ section_id: s2, slug: 'objects-ii', title: 'Objects II', description: 'Advanced object features: dynamic keys, looping, destructuring, and built-in utilities.', order_index: 6 })

  const lObj2_1 = await upsertLesson({ course_id: cObjects2, slug: 'destructuring', title: 'Object destructuring', order_index: 1, content: [
    { type: 'text', content: '**Destructuring** lets you extract values from objects into variables in a concise way. You can also rename variables and provide default values.' },
    { type: 'code', language: 'javascript', content: `const person = { name: "Alice", age: 30, city: "NYC" };\n\n// Basic destructuring\nconst { name, age } = person;\nconsole.log(name); // "Alice"\n\n// Rename while destructuring\nconst { name: fullName } = person;\nconsole.log(fullName); // "Alice"\n\n// Default value\nconst { country = "Unknown" } = person;\nconsole.log(country); // "Unknown"` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lObj2_1, question: 'What does const { x = 10 } = {} give you?', options: ['x = undefined', 'x = null', 'x = 10', 'SyntaxError'], correct_option_index: 2, explanation: 'When destructuring, if the property does not exist in the object, the default value is used. Since {} has no x, x defaults to 10.', order_index: 1 })

  const lObj2_2 = await upsertLesson({ course_id: cObjects2, slug: 'dynamic-keys', title: 'Dynamic property access', order_index: 2, content: [
    { type: 'text', content: 'You can access object properties dynamically using bracket notation with a variable. This is useful when the property name is not known at coding time.' },
    { type: 'code', language: 'javascript', content: `const user = { name: "Bob", age: 25, role: "admin" };\n\nconst key = "role";\nconsole.log(user[key]); // "admin"\n\n// Computed property names in object literals\nconst field = "score";\nconst obj = { [field]: 100 };\nconsole.log(obj); // { score: 100 }` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lObj2_2, question: 'What does obj["key"] do that obj.key cannot?', options: ['Nothing different', 'Access inherited properties', 'Use a variable as the property name', 'Access nested objects'], correct_option_index: 2, explanation: 'Bracket notation evaluates the expression inside, so you can use variables, function calls, or any expression as a key. Dot notation requires a literal identifier.', order_index: 1 })

  const lObj2_3 = await upsertLesson({ course_id: cObjects2, slug: 'looping-objects', title: 'Looping over objects', order_index: 3, content: [
    { type: 'text', content: 'You cannot use `for...of` directly on objects, but JavaScript gives you `Object.keys()`, `Object.values()`, and `Object.entries()` to iterate over them.' },
    { type: 'code', language: 'javascript', content: `const scores = { alice: 95, bob: 80, carol: 88 };\n\nfor (const key of Object.keys(scores)) {\n  console.log(key); // "alice", "bob", "carol"\n}\n\nfor (const [name, score] of Object.entries(scores)) {\n  console.log(\`\${name}: \${score}\`);\n}` },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})
  await upsertQuiz({ lesson_id: lObj2_3, question: 'What does Object.entries({ a: 1, b: 2 }) return?', options: ['["a", "b"]', '[1, 2]', '[["a", 1], ["b", 2]]', '{ a: 1, b: 2 }'], correct_option_index: 2, explanation: 'Object.entries() returns an array of [key, value] pairs. Each pair is itself an array.', order_index: 1 })

  // Challenges: Objects II
  const ch71 = await upsertChallenge({ course_id: cObjects2, slug: 'destructure-rename', title: 'Destructure and rename', description: 'Write a function that takes an object with a `firstName` property and returns the value, but extracted via destructuring and renamed to `name`.\n\n**Examples:**\n```\nsolution({ firstName: "Alice" })  // "Alice"\nsolution({ firstName: "Bob" })    // "Bob"\n```', difficulty: 'easy', starter_code: 'function solution(obj) {\n  // your code here\n  // Hint: destructure firstName as name\n}', solution_code: 'function solution(obj) {\n  const { firstName: name } = obj;\n  return name;\n}', hints: ['Use destructuring with rename: const { firstName: name } = obj'], order_index: 1 })
  if (ch71) await upsertTestCases(ch71, [
    { description: 'destructure Alice', function_call: 'solution({ firstName: "Alice" })', expected_output: '"Alice"', is_hidden: false, order_index: 1 },
    { description: 'destructure Bob', function_call: 'solution({ firstName: "Bob" })', expected_output: '"Bob"', is_hidden: false, order_index: 2 },
  ])

  const ch72 = await upsertChallenge({ course_id: cObjects2, slug: 'dynamic-key-access', title: 'Dynamic key access', description: 'Write a function that takes an object `obj` and a string `key`, and returns the value at that key.\n\n**Examples:**\n```\nsolution({ name: "Alice", age: 30 }, "name")  // "Alice"\nsolution({ x: 10, y: 20 }, "y")               // 20\n```', difficulty: 'easy', starter_code: 'function solution(obj, key) {\n  // your code here\n}', solution_code: 'function solution(obj, key) {\n  return obj[key];\n}', hints: ['Use bracket notation: obj[key]'], order_index: 2 })
  if (ch72) await upsertTestCases(ch72, [
    { description: 'access name', function_call: 'solution({ name: "Alice", age: 30 }, "name")', expected_output: '"Alice"', is_hidden: false, order_index: 1 },
    { description: 'access y', function_call: 'solution({ x: 10, y: 20 }, "y")', expected_output: '20', is_hidden: false, order_index: 2 },
  ])

  const ch73 = await upsertChallenge({ course_id: cObjects2, slug: 'sum-object-values', title: 'Sum object values', description: 'Write a function that takes an object where all values are numbers, and returns the sum of all values.\n\n**Examples:**\n```\nsolution({ a: 1, b: 2, c: 3 })   // 6\nsolution({ x: 10, y: 20 })        // 30\n```', difficulty: 'easy', starter_code: 'function solution(obj) {\n  // your code here\n}', solution_code: 'function solution(obj) {\n  return Object.values(obj).reduce((sum, v) => sum + v, 0);\n}', hints: ['Use Object.values() to get all values as an array.', 'Then use .reduce() to sum them.'], order_index: 3 })
  if (ch73) await upsertTestCases(ch73, [
    { description: 'sum {a:1,b:2,c:3} = 6', function_call: 'solution({ a: 1, b: 2, c: 3 })', expected_output: '6', is_hidden: false, order_index: 1 },
    { description: 'sum {x:10,y:20} = 30', function_call: 'solution({ x: 10, y: 20 })', expected_output: '30', is_hidden: false, order_index: 2 },
  ])

  const ch74 = await upsertChallenge({ course_id: cObjects2, slug: 'filter-object-by-value', title: 'Filter object by value', description: 'Write a function that takes an object and a minimum value, and returns a new object containing only the entries where the value is greater than or equal to the minimum.\n\n**Examples:**\n```\nsolution({ a: 1, b: 5, c: 3 }, 3)  // { b: 5, c: 3 }\nsolution({ x: 10, y: 2 }, 5)        // { x: 10 }\n```', difficulty: 'medium', starter_code: 'function solution(obj, min) {\n  // your code here\n}', solution_code: 'function solution(obj, min) {\n  return Object.fromEntries(\n    Object.entries(obj).filter(([, v]) => v >= min)\n  );\n}', hints: ['Use Object.entries() to get [key, value] pairs.', 'Filter by value >= min.', 'Use Object.fromEntries() to convert back to an object.'], order_index: 4 })
  if (ch74) await upsertTestCases(ch74, [
    { description: 'filter >= 3', function_call: 'solution({ a: 1, b: 5, c: 3 }, 3)', expected_output: '{"b":5,"c":3}', is_hidden: false, order_index: 1 },
    { description: 'filter >= 5', function_call: 'solution({ x: 10, y: 2 }, 5)', expected_output: '{"x":10}', is_hidden: false, order_index: 2 },
  ])

  const ch75 = await upsertChallenge({ course_id: cObjects2, slug: 'map-object-values', title: 'Transform object values', description: 'Write a function that takes an object and a transformer function, and returns a new object with the same keys but with each value transformed.\n\n**Examples:**\n```\nsolution({ a: 1, b: 2, c: 3 }, x => x * 2)  // { a: 2, b: 4, c: 6 }\nsolution({ x: "hi" }, s => s.toUpperCase())   // { x: "HI" }\n```', difficulty: 'medium', starter_code: 'function solution(obj, fn) {\n  // your code here\n}', solution_code: 'function solution(obj, fn) {\n  return Object.fromEntries(\n    Object.entries(obj).map(([k, v]) => [k, fn(v)])\n  );\n}', hints: ['Use Object.entries() to iterate.', 'Map each [key, value] to [key, fn(value)].', 'Use Object.fromEntries() to rebuild the object.'], order_index: 5 })
  if (ch75) await upsertTestCases(ch75, [
    { description: 'double all values', function_call: 'solution({ a: 1, b: 2, c: 3 }, x => x * 2)', expected_output: '{"a":2,"b":4,"c":6}', is_hidden: false, order_index: 1 },
    { description: 'uppercase strings', function_call: 'solution({ x: "hi" }, s => s.toUpperCase())', expected_output: '{"x":"HI"}', is_hidden: false, order_index: 2 },
  ])

  const ch76 = await upsertChallenge({ course_id: cObjects2, slug: 'count-occurrences', title: 'Count occurrences', description: 'Write a function that takes an array of strings and returns an object where each key is a unique string and its value is the number of times it appears.\n\n**Examples:**\n```\nsolution(["a","b","a","c","b","a"])  // { a: 3, b: 2, c: 1 }\nsolution(["yes","no","yes"])          // { yes: 2, no: 1 }\n```', difficulty: 'medium', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return arr.reduce((acc, item) => {\n    acc[item] = (acc[item] || 0) + 1;\n    return acc;\n  }, {});\n}', hints: ['Use reduce() with an empty object {} as the accumulator.', 'For each item, increment acc[item] by 1. Use || 0 in case it does not exist yet.'], order_index: 6 })
  if (ch76) await upsertTestCases(ch76, [
    { description: 'count a,b,c', function_call: 'solution(["a","b","a","c","b","a"])', expected_output: '{"a":3,"b":2,"c":1}', is_hidden: false, order_index: 1 },
    { description: 'count yes/no', function_call: 'solution(["yes","no","yes"])', expected_output: '{"yes":2,"no":1}', is_hidden: false, order_index: 2 },
  ])

  const ch77 = await upsertChallenge({ course_id: cObjects2, slug: 'pick-properties', title: 'Pick properties', description: 'Write a function that takes an object and an array of keys, and returns a new object containing only those keys.\n\n**Examples:**\n```\nsolution({ a: 1, b: 2, c: 3 }, ["a", "c"])  // { a: 1, c: 3 }\nsolution({ x: 10, y: 20, z: 30 }, ["y"])     // { y: 20 }\n```', difficulty: 'medium', starter_code: 'function solution(obj, keys) {\n  // your code here\n}', solution_code: 'function solution(obj, keys) {\n  return Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));\n}', hints: ['Filter keys to only those that exist in obj.', 'Map each key to a [key, value] pair.', 'Use Object.fromEntries() to build the result object.'], order_index: 7 })
  if (ch77) await upsertTestCases(ch77, [
    { description: 'pick a and c', function_call: 'solution({ a: 1, b: 2, c: 3 }, ["a", "c"])', expected_output: '{"a":1,"c":3}', is_hidden: false, order_index: 1 },
    { description: 'pick y', function_call: 'solution({ x: 10, y: 20, z: 30 }, ["y"])', expected_output: '{"y":20}', is_hidden: false, order_index: 2 },
  ])

  const ch78 = await upsertChallenge({ course_id: cObjects2, slug: 'omit-properties', title: 'Omit properties', description: 'Write a function that takes an object and an array of keys to **exclude**, and returns a new object without those keys.\n\n**Examples:**\n```\nsolution({ a: 1, b: 2, c: 3 }, ["b"])      // { a: 1, c: 3 }\nsolution({ x: 1, y: 2 }, ["x", "y"])        // {}\n```', difficulty: 'medium', starter_code: 'function solution(obj, keys) {\n  // your code here\n}', solution_code: 'function solution(obj, keys) {\n  const excluded = new Set(keys);\n  return Object.fromEntries(Object.entries(obj).filter(([k]) => !excluded.has(k)));\n}', hints: ['Convert keys to a Set for O(1) lookups.', 'Use Object.entries() and filter out entries whose key is in the Set.'], order_index: 8 })
  if (ch78) await upsertTestCases(ch78, [
    { description: 'omit b', function_call: 'solution({ a: 1, b: 2, c: 3 }, ["b"])', expected_output: '{"a":1,"c":3}', is_hidden: false, order_index: 1 },
    { description: 'omit all', function_call: 'solution({ x: 1, y: 2 }, ["x", "y"])', expected_output: '{}', is_hidden: false, order_index: 2 },
  ])

  const ch79 = await upsertChallenge({ course_id: cObjects2, slug: 'deep-clone', title: 'Deep clone an object', description: 'Write a function that takes an object and returns a **deep clone** of it — a completely new object with no shared references.\n\n**Example:**\n```\nconst original = { a: 1, b: { c: 2 } };\nconst clone = solution(original);\nclone.b.c = 99;\noriginal.b.c // still 2 — no shared reference\n```', difficulty: 'hard', starter_code: 'function solution(obj) {\n  // your code here\n}', solution_code: 'function solution(obj) {\n  return JSON.parse(JSON.stringify(obj));\n}', hints: ['Use JSON.parse(JSON.stringify(obj)) for a simple deep clone.', 'Note: this only works for plain objects with JSON-serializable values (no functions, undefined, or circular refs).'], order_index: 9 })
  if (ch79) await upsertTestCases(ch79, [
    { description: 'clone has same values', function_call: 'JSON.stringify(solution({ a: 1, b: { c: 2 } }))', expected_output: '"{\\"a\\":1,\\"b\\":{\\"c\\":2}}"', is_hidden: false, order_index: 1 },
    { description: 'clone is independent', function_call: '(() => { const o = { a: { b: 1 } }; const c = solution(o); c.a.b = 99; return o.a.b; })()', expected_output: '1', is_hidden: false, order_index: 2 },
  ])

  // ── More challenges: Arrays Practice ──────────────────────────────────────
  const ch80 = await upsertChallenge({ course_id: cPractice2, slug: 'max-in-array', title: 'Maximum value', description: 'Write a function that takes an array of numbers and returns the largest value.\n\n**Examples:**\n```\nsolution([3, 1, 4, 1, 5, 9, 2])  // 9\nsolution([-5, -1, -3])            // -1\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return Math.max(...arr);\n}', hints: ['Use Math.max() with the spread operator: Math.max(...arr)'], order_index: 4 })
  if (ch80) await upsertTestCases(ch80, [
    { description: 'max of positives', function_call: 'solution([3, 1, 4, 1, 5, 9, 2])', expected_output: '9', is_hidden: false, order_index: 1 },
    { description: 'max of negatives', function_call: 'solution([-5, -1, -3])', expected_output: '-1', is_hidden: false, order_index: 2 },
  ])

  const ch81 = await upsertChallenge({ course_id: cPractice2, slug: 'sort-array', title: 'Sort numbers ascending', description: 'Write a function that takes an array of numbers and returns them sorted in ascending order (smallest to largest). Do not modify the original array.\n\n**Examples:**\n```\nsolution([3, 1, 4, 1, 5])  // [1, 1, 3, 4, 5]\nsolution([10, 2, 8])        // [2, 8, 10]\n```', difficulty: 'easy', starter_code: 'function solution(arr) {\n  // your code here\n}', solution_code: 'function solution(arr) {\n  return [...arr].sort((a, b) => a - b);\n}', hints: ['Use .sort() with a comparator: (a, b) => a - b for ascending.', 'Spread into a new array first so you do not modify the original: [...arr].sort(...)'], order_index: 5 })
  if (ch81) await upsertTestCases(ch81, [
    { description: 'sort ascending', function_call: 'solution([3, 1, 4, 1, 5])', expected_output: '[1,1,3,4,5]', is_hidden: false, order_index: 1 },
    { description: 'sort [10,2,8]', function_call: 'solution([10, 2, 8])', expected_output: '[2,8,10]', is_hidden: false, order_index: 2 },
  ])

  // ── More: Strings ──────────────────────────────────────────────────────────
  const ch82 = await upsertChallenge({ course_id: cStrings, slug: 'trim-and-split', title: 'Trim and split', description: 'Write a function that takes a string with comma-separated values, trims whitespace from each value, and returns them as an array.\n\n**Examples:**\n```\nsolution("a, b, c")        // ["a", "b", "c"]\nsolution("one,  two,three") // ["one", "two", "three"]\n```', difficulty: 'medium', starter_code: 'function solution(str) {\n  // your code here\n}', solution_code: 'function solution(str) {\n  return str.split(",").map(s => s.trim());\n}', hints: ['Split by comma first.', 'Then map each element with .trim() to remove surrounding spaces.'], order_index: 7 })
  if (ch82) await upsertTestCases(ch82, [
    { description: 'trim and split', function_call: 'solution("a, b, c")', expected_output: '["a","b","c"]', is_hidden: false, order_index: 1 },
    { description: 'extra spaces', function_call: 'solution("one,  two,three")', expected_output: '["one","two","three"]', is_hidden: false, order_index: 2 },
  ])

  const ch83 = await upsertChallenge({ course_id: cStrings, slug: 'truncate', title: 'Truncate string', description: 'Write a function that takes a string and a max length `n`. If the string is longer than `n`, return the first `n` characters followed by `"..."`. Otherwise, return the string unchanged.\n\n**Examples:**\n```\nsolution("Hello World", 5)   // "Hello..."\nsolution("Hi", 10)            // "Hi"\n```', difficulty: 'medium', starter_code: 'function solution(str, n) {\n  // your code here\n}', solution_code: 'function solution(str, n) {\n  return str.length > n ? str.slice(0, n) + "..." : str;\n}', hints: ['Use the ternary operator to check if str.length > n.', 'Use .slice(0, n) to get the first n characters.'], order_index: 8 })
  if (ch83) await upsertTestCases(ch83, [
    { description: 'truncate long string', function_call: 'solution("Hello World", 5)', expected_output: '"Hello..."', is_hidden: false, order_index: 1 },
    { description: 'short string unchanged', function_call: 'solution("Hi", 10)', expected_output: '"Hi"', is_hidden: false, order_index: 2 },
  ])

  console.log('\n🎉 Full seed complete! All courses, lessons, and challenges inserted.\n')
  console.log('📊 Summary:')
  console.log('   Sections: 3')
  console.log('   Courses: 15 (+ Objects II)')
  console.log('   Challenges: 83+')
}

seed().catch(console.error)