import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function upsertSection(data: { slug: string; title: string; description: string; order_index: number }) {
  const { data: existing } = await supabase.from('sections').select('id').eq('slug', data.slug).single()
  if (existing) { console.log(`⏭️  Section exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('sections').insert(data).select('id').single()
  if (error) { console.error(error.message); process.exit(1) }
  console.log(`✅ Section: ${data.title}`)
  return row!.id
}

async function upsertCourse(data: { section_id: string; slug: string; title: string; description: string; order_index: number }) {
  const { data: existing } = await supabase.from('courses').select('id').eq('slug', data.slug).single()
  if (existing) { console.log(`  ⏭️  Course exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('courses').insert(data).select('id').single()
  if (error) { console.error(error.message); process.exit(1) }
  console.log(`  ✅ Course: ${data.title}`)
  return row!.id
}

async function upsertLesson(data: { course_id: string; slug: string; title: string; content: unknown[]; order_index: number }) {
  const { data: existing } = await supabase.from('lessons').select('id').eq('course_id', data.course_id).eq('slug', data.slug).single()
  if (existing) { console.log(`    ⏭️  Lesson exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('lessons').insert(data).select('id').single()
  if (error) { console.error(error.message); process.exit(1) }
  console.log(`    ✅ Lesson: ${data.title}`)
  return row!.id
}

async function upsertDomChallenge(data: {
  course_id: string; slug: string; title: string; description: string
  difficulty: string; html_template: string; starter_js: string
  hints: string[]; order_index: number
}) {
  const { data: existing } = await supabase.from('dom_challenges').select('id').eq('course_id', data.course_id).eq('slug', data.slug).single()
  if (existing) { console.log(`    ⏭️  DOM Challenge exists: ${data.title}`); return existing.id }
  const { data: row, error } = await supabase.from('dom_challenges').insert({ ...data, hints: JSON.stringify(data.hints) }).select('id').single()
  if (error) { console.error(error.message); return null }
  console.log(`    ✅ DOM Challenge: ${data.title}`)
  return row!.id
}

async function upsertAssertions(challenge_id: string, assertions: { description: string; assertion: string; order_index: number }[]) {
  const { data: existing } = await supabase.from('dom_assertions').select('id').eq('challenge_id', challenge_id)
  if (existing && existing.length > 0) return
  for (const a of assertions) {
    const { error } = await supabase.from('dom_assertions').insert({ ...a, challenge_id })
    if (error) console.error(error.message)
  }
}

async function seedDom() {
  console.log('\n🌱 Seeding DOM courses...\n')

  const s4 = await upsertSection({ slug: 'javascript-dom', title: 'JavaScript DOM', description: 'Learn to interact with web pages using the Document Object Model.', order_index: 4 })

  // ── Course 1: DOM Selector Methods ────────────────────────────────────────
  const cSelectors = await upsertCourse({ section_id: s4, slug: 'dom-selector-methods', title: 'DOM Selector Methods', description: 'Learn how to access elements in the DOM using JavaScript selector methods.', order_index: 1 })

  await upsertLesson({ course_id: cSelectors, slug: 'intro', title: 'Selecting DOM elements', order_index: 1, content: [
    { type: 'text', content: 'The DOM (Document Object Model) is a programming interface for HTML. JavaScript can access and change all elements, attributes, and styles in a document.' },
    { type: 'code', language: 'javascript', content: "// Select by ID (returns single element)\ndocument.getElementById('title')\n\n// Select by CSS selector (returns first match)\ndocument.querySelector('.card')\ndocument.querySelector('#submit-btn')\n\n// Select all matches (returns NodeList)\ndocument.querySelectorAll('p')\ndocument.querySelectorAll('.item')" },
    { type: 'callout', calloutType: 'tip', content: 'Prefer **querySelector** and **querySelectorAll** — they accept any CSS selector and are more flexible than older methods like getElementById.' },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})

  const dc1 = await upsertDomChallenge({
    course_id: cSelectors,
    slug: 'get-by-id',
    title: 'Select element by ID',
    description: 'Use JavaScript to select the element with the id "title" and change its text content to "Hello DOM!".',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; background: #f9f9f9; } h1 { color: #333; }</style></head>\n<body>\n  <h1 id="title">Original Title</h1>\n</body>\n</html>',
    starter_js: '// Select the element with id "title" and change its text\n',
    hints: ['Use document.getElementById("title") or document.querySelector("#title")', 'Change the text using .textContent = "Hello DOM!"'],
    order_index: 1,
  })
  if (dc1) await upsertAssertions(dc1, [
    { description: 'The #title element exists', assertion: "document.getElementById('title') !== null", order_index: 1 },
    { description: 'The #title text is "Hello DOM!"', assertion: "document.getElementById('title').textContent === 'Hello DOM!'", order_index: 2 },
  ])

  const dc2 = await upsertDomChallenge({
    course_id: cSelectors,
    slug: 'query-selector',
    title: 'Select by class name',
    description: 'Select the element with class "highlight" using querySelector and change its background color to "yellow".',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } p { padding: 10px; border-radius: 4px; }</style></head>\n<body>\n  <p class="highlight">This paragraph should be highlighted.</p>\n  <p>This one should stay the same.</p>\n</body>\n</html>',
    starter_js: '// Select the .highlight element and set its background to yellow\n',
    hints: ['Use document.querySelector(".highlight")', 'Set element.style.backgroundColor = "yellow"'],
    order_index: 2,
  })
  if (dc2) await upsertAssertions(dc2, [
    { description: 'The .highlight element exists', assertion: "document.querySelector('.highlight') !== null", order_index: 1 },
    { description: 'The .highlight background is yellow', assertion: "document.querySelector('.highlight').style.backgroundColor === 'yellow'", order_index: 2 },
  ])

  const dc3 = await upsertDomChallenge({
    course_id: cSelectors,
    slug: 'select-all',
    title: 'Select multiple elements',
    description: 'Select all <li> elements and add the class "done" to each one.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } .done { text-decoration: line-through; color: gray; }</style></head>\n<body>\n  <ul>\n    <li>Buy groceries</li>\n    <li>Walk the dog</li>\n    <li>Read a book</li>\n  </ul>\n</body>\n</html>',
    starter_js: '// Select all li elements and add class "done" to each\n',
    hints: ['Use document.querySelectorAll("li") to get all list items', 'Loop over them with forEach and call .classList.add("done")'],
    order_index: 3,
  })
  if (dc3) await upsertAssertions(dc3, [
    { description: 'All li elements have the "done" class', assertion: "[...document.querySelectorAll('li')].every(el => el.classList.contains('done'))", order_index: 1 },
    { description: 'There are 3 list items', assertion: "document.querySelectorAll('li').length === 3", order_index: 2 },
  ])

  const dc4 = await upsertDomChallenge({
    course_id: cSelectors,
    slug: 'nested-selector',
    title: 'Select nested element',
    description: 'Select the <span> inside the element with id "container" and change its text to "Found it!".',
    difficulty: 'medium',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } #container { border: 1px solid #ccc; padding: 15px; border-radius: 4px; }</style></head>\n<body>\n  <div id="container">\n    <p>Look inside: <span>original text</span></p>\n  </div>\n</body>\n</html>',
    starter_js: '// Select the span inside #container and change its text\n',
    hints: ['Use document.querySelector("#container span") to select a nested element', 'Change .textContent to "Found it!"'],
    order_index: 4,
  })
  if (dc4) await upsertAssertions(dc4, [
    { description: 'The span inside #container says "Found it!"', assertion: "document.querySelector('#container span').textContent === 'Found it!'", order_index: 1 },
  ])

  // ── Course 2: Events and User Interactions ─────────────────────────────────
  const cEvents = await upsertCourse({ section_id: s4, slug: 'dom-events', title: 'Events and User Interactions', description: 'Handle user events like clicks, input changes, and keyboard interactions.', order_index: 2 })

  await upsertLesson({ course_id: cEvents, slug: 'intro', title: 'Event listeners', order_index: 1, content: [
    { type: 'text', content: 'Events are things that happen in the browser — a click, a keypress, a form submission. You can react to events by attaching **event listeners** with `addEventListener`.' },
    { type: 'code', language: 'javascript', content: "const btn = document.querySelector('button');\n\nbtn.addEventListener('click', function(event) {\n  console.log('Button clicked!');\n  console.log(event.target); // the element that was clicked\n});" },
    { type: 'quiz', content: '', quizId: 'q1' },
  ]})

  const dc5 = await upsertDomChallenge({
    course_id: cEvents,
    slug: 'click-counter',
    title: 'Click counter',
    description: 'Add a click event listener to the button. Each time it is clicked, increment the number shown in the <span id="count"> by 1.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 16px; } button { padding: 10px 24px; font-size: 16px; cursor: pointer; border-radius: 6px; border: none; background: #3b82f6; color: white; } #count { font-size: 48px; font-weight: bold; }</style></head>\n<body>\n  <span id="count">0</span>\n  <button id="btn">Click me</button>\n</body>\n</html>',
    starter_js: '// Add a click event listener to #btn\n// Each click should increment the number in #count by 1\n',
    hints: ['Use document.getElementById("btn").addEventListener("click", ...)', 'Read the current count with parseInt(countEl.textContent)', 'Set the new count with countEl.textContent = newCount'],
    order_index: 1,
  })
  if (dc5) await upsertAssertions(dc5, [
    { description: 'Clicking the button increments the counter', assertion: "(() => { document.getElementById('btn').click(); return parseInt(document.getElementById('count').textContent) === 1; })()", order_index: 1 },
    { description: 'Counter reaches 2 after two clicks', assertion: "(() => { document.getElementById('btn').click(); return parseInt(document.getElementById('count').textContent) >= 2; })()", order_index: 2 },
  ])

  const dc6 = await upsertDomChallenge({
    course_id: cEvents,
    slug: 'toggle-visibility',
    title: 'Toggle visibility',
    description: 'When the button is clicked, toggle the visibility of the <div id="box">. If it is visible, hide it. If it is hidden, show it.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; gap: 16px; } #box { width: 150px; height: 150px; background: #3b82f6; border-radius: 8px; } button { width: fit-content; padding: 8px 20px; cursor: pointer; border-radius: 6px; border: 1px solid #ccc; }</style></head>\n<body>\n  <button id="toggle-btn">Toggle Box</button>\n  <div id="box"></div>\n</body>\n</html>',
    starter_js: '// Toggle #box visibility when #toggle-btn is clicked\n',
    hints: ['Use addEventListener("click", ...) on the button', 'Toggle visibility with element.style.display = "none" to hide, "" or "block" to show', 'Or use element.classList.toggle("hidden") if you add a CSS class'],
    order_index: 2,
  })
  if (dc6) await upsertAssertions(dc6, [
    { description: 'Clicking the button hides the box', assertion: "(() => { document.getElementById('toggle-btn').click(); const box = document.getElementById('box'); return box.style.display === 'none' || box.style.visibility === 'hidden'; })()", order_index: 1 },
    { description: 'Clicking again shows the box', assertion: "(() => { document.getElementById('toggle-btn').click(); const box = document.getElementById('box'); return box.style.display !== 'none' && box.style.visibility !== 'hidden'; })()", order_index: 2 },
  ])

  const dc7 = await upsertDomChallenge({
    course_id: cEvents,
    slug: 'input-mirror',
    title: 'Mirror input text',
    description: 'Listen for the "input" event on the text field. Every time the user types, copy the value to the <p id="output"> element.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; gap: 12px; } input { padding: 8px 12px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 250px; } #output { font-size: 18px; color: #333; min-height: 28px; }</style></head>\n<body>\n  <input type="text" id="text-input" placeholder="Type something..." />\n  <p id="output"></p>\n</body>\n</html>',
    starter_js: '// Mirror the input value to #output on every keystroke\n',
    hints: ['Use addEventListener("input", ...) on the input element', 'Access the typed value with event.target.value', 'Set document.getElementById("output").textContent to that value'],
    order_index: 3,
  })
  if (dc7) await upsertAssertions(dc7, [
    { description: 'Typing in the input mirrors text to #output', assertion: "(() => { const input = document.getElementById('text-input'); input.value = 'hello'; input.dispatchEvent(new Event('input')); return document.getElementById('output').textContent === 'hello'; })()", order_index: 1 },
  ])

  const cManipulation = await upsertCourse({ section_id: s4, slug: 'dom-manipulation', title: 'DOM Manipulation', description: 'Create, modify, and remove elements dynamically with JavaScript.', order_index: 3 })

  await upsertLesson({ course_id: cManipulation, slug: 'intro', title: 'Creating and modifying elements', order_index: 1, content: [
    { type: 'text', content: 'You can create new HTML elements with `document.createElement()`, modify their content, and add them to the page with `appendChild()` or `insertAdjacentElement()`.' },
  ]})

  const dc8 = await upsertDomChallenge({
    course_id: cManipulation,
    slug: 'create-element',
    title: 'Create and append element',
    description: 'Create a new <p> element with the text "I was created with JavaScript!" and append it to the <div id="container">.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } #container { border: 2px dashed #ccc; padding: 20px; border-radius: 8px; min-height: 80px; }</style></head>\n<body>\n  <div id="container">\n    <p>Existing paragraph</p>\n  </div>\n</body>\n</html>',
    starter_js: '// Create a <p> with text "I was created with JavaScript!" and append to #container\n',
    hints: ['Use document.createElement("p") to create the element', 'Set its text with .textContent = "..."', 'Append it with document.getElementById("container").appendChild(p)'],
    order_index: 1,
  })
  if (dc8) await upsertAssertions(dc8, [
    { description: '#container has at least 2 paragraphs', assertion: "document.getElementById('container').querySelectorAll('p').length >= 2", order_index: 1 },
    { description: 'One paragraph says "I was created with JavaScript!"', assertion: "[...document.getElementById('container').querySelectorAll('p')].some(p => p.textContent === 'I was created with JavaScript!')", order_index: 2 },
  ])

  const dc9 = await upsertDomChallenge({
    course_id: cManipulation,
    slug: 'remove-element',
    title: 'Remove an element',
    description: 'Remove the element with id "remove-me" from the DOM.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } #remove-me { background: #fee2e2; border: 1px solid #ef4444; padding: 12px; border-radius: 6px; margin-bottom: 12px; } #keep-me { background: #dcfce7; border: 1px solid #22c55e; padding: 12px; border-radius: 6px; }</style></head>\n<body>\n  <div id="remove-me">❌ Remove this element</div>\n  <div id="keep-me">✅ Keep this element</div>\n</body>\n</html>',
    starter_js: '// Remove the element with id "remove-me"\n',
    hints: ['Use document.getElementById("remove-me").remove()', 'Or use parentElement.removeChild(element)'],
    order_index: 2,
  })
  if (dc9) await upsertAssertions(dc9, [
    { description: '#remove-me is no longer in the DOM', assertion: "document.getElementById('remove-me') === null", order_index: 1 },
    { description: '#keep-me is still in the DOM', assertion: "document.getElementById('keep-me') !== null", order_index: 2 },
  ])

  const dc10 = await upsertDomChallenge({
    course_id: cManipulation,
    slug: 'add-list-item',
    title: 'Add list items dynamically',
    description: 'When the button is clicked, read the value from the input and add a new <li> with that text to the <ul id="list">. Then clear the input.',
    difficulty: 'medium',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } .row { display: flex; gap: 8px; margin-bottom: 16px; } input { padding: 8px 12px; border-radius: 6px; border: 1px solid #ccc; flex: 1; font-size: 14px; } button { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; } ul { padding-left: 20px; } li { margin-bottom: 6px; }</style></head>\n<body>\n  <div class="row">\n    <input type="text" id="item-input" placeholder="New item..." />\n    <button id="add-btn">Add</button>\n  </div>\n  <ul id="list"></ul>\n</body>\n</html>',
    starter_js: '// On button click: add input value as new <li> to #list, then clear input\n',
    hints: ['Listen for click on #add-btn', 'Read the value from #item-input', 'Create a <li> element, set its textContent, append to #list', 'Clear the input by setting its value to ""'],
    order_index: 3,
  })
  if (dc10) await upsertAssertions(dc10, [
    { description: 'Clicking add button creates a list item', assertion: "(() => { document.getElementById('item-input').value = 'Test item'; document.getElementById('add-btn').click(); return document.getElementById('list').querySelectorAll('li').length >= 1; })()", order_index: 1 },
    { description: 'The list item has the correct text', assertion: "(() => { return [...document.getElementById('list').querySelectorAll('li')].some(li => li.textContent === 'Test item'); })()", order_index: 2 },
    { description: 'Input is cleared after adding', assertion: "document.getElementById('item-input').value === ''", order_index: 3 },
  ])

  const dc11 = await upsertDomChallenge({
    course_id: cManipulation,
    slug: 'change-attribute',
    title: 'Change an attribute',
    description: 'Change the src attribute of the <img> element to "https://picsum.photos/200" and its alt to "Random image".',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } img { border-radius: 8px; border: 2px solid #ccc; width: 200px; height: 200px; object-fit: cover; }</style></head>\n<body>\n  <img id="photo" src="https://via.placeholder.com/200" alt="Placeholder" />\n</body>\n</html>',
    starter_js: '// Change the img src and alt attributes\n',
    hints: ['Use document.getElementById("photo").setAttribute("src", "...")', 'Or set img.src = "..." and img.alt = "..." directly'],
    order_index: 4,
  })
  if (dc11) await upsertAssertions(dc11, [
    { description: 'img src is "https://picsum.photos/200"', assertion: "document.getElementById('photo').getAttribute('src') === 'https://picsum.photos/200'", order_index: 1 },
    { description: 'img alt is "Random image"', assertion: "document.getElementById('photo').getAttribute('alt') === 'Random image'", order_index: 2 },
  ])

  const cFundamentals = await upsertCourse({ section_id: s4, slug: 'dom-fundamentals', title: 'DOM Fundamentals', description: 'Mixed challenges to practice everything you know about the DOM.', order_index: 4 })

  const dc12 = await upsertDomChallenge({
    course_id: cFundamentals,
    slug: 'dark-mode',
    title: 'Dark mode toggle',
    description: 'When the button is clicked, toggle the class "dark" on the <body> element. The CSS for dark mode is already written.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 30px; background: #fff; color: #111; transition: all 0.3s; } body.dark { background: #111; color: #fff; } button { padding: 10px 20px; cursor: pointer; border-radius: 6px; border: 1px solid currentColor; background: transparent; color: inherit; font-size: 14px; }</style></head>\n<body>\n  <h2>Hello World</h2>\n  <p>Toggle dark mode below.</p>\n  <button id="theme-btn">Toggle Dark Mode</button>\n</body>\n</html>',
    starter_js: '// Toggle the "dark" class on <body> when #theme-btn is clicked\n',
    hints: ['Use document.body.classList.toggle("dark")', 'Add the listener to #theme-btn'],
    order_index: 1,
  })
  if (dc12) await upsertAssertions(dc12, [
    { description: 'Clicking adds "dark" class to body', assertion: "(() => { document.getElementById('theme-btn').click(); return document.body.classList.contains('dark'); })()", order_index: 1 },
    { description: 'Clicking again removes "dark" class', assertion: "(() => { document.getElementById('theme-btn').click(); return !document.body.classList.contains('dark'); })()", order_index: 2 },
  ])

  const dc13 = await upsertDomChallenge({
    course_id: cFundamentals,
    slug: 'character-counter',
    title: 'Character counter',
    description: 'As the user types in the textarea, update the <span id="count"> to show how many characters have been typed.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; } textarea { width: 100%; height: 120px; padding: 10px; font-size: 14px; border-radius: 6px; border: 1px solid #ccc; box-sizing: border-box; resize: none; } .counter { margin-top: 6px; color: #666; font-size: 13px; }</style></head>\n<body>\n  <textarea id="text-area" placeholder="Type something..."></textarea>\n  <p class="counter">Characters: <span id="count">0</span></p>\n</body>\n</html>',
    starter_js: '// Update #count with the number of characters in #text-area on every keystroke\n',
    hints: ['Listen for the "input" event on #text-area', 'Set #count textContent to event.target.value.length'],
    order_index: 2,
  })
  if (dc13) await upsertAssertions(dc13, [
    { description: 'Character count updates as user types', assertion: "(() => { const ta = document.getElementById('text-area'); ta.value = 'hello'; ta.dispatchEvent(new Event('input')); return document.getElementById('count').textContent === '5'; })()", order_index: 1 },
  ])

  const dc14 = await upsertDomChallenge({
    course_id: cFundamentals,
    slug: 'color-changer',
    title: 'Background color picker',
    description: 'When the user selects a color from the <input type="color">, change the background color of <div id="preview"> to that color.',
    difficulty: 'easy',
    html_template: '<!DOCTYPE html>\n<html>\n<head><style>body { font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; } #preview { width: 200px; height: 200px; border-radius: 12px; background: #e5e7eb; border: 1px solid #ccc; transition: background 0.3s; } label { font-size: 14px; color: #555; }</style></head>\n<body>\n  <label>Pick a color: <input type="color" id="color-picker" value="#e5e7eb" /></label>\n  <div id="preview"></div>\n</body>\n</html>',
    starter_js: '// Change #preview background color when #color-picker value changes\n',
    hints: ['Listen for the "input" event on #color-picker', 'Set document.getElementById("preview").style.backgroundColor to event.target.value'],
    order_index: 3,
  })
  if (dc14) await upsertAssertions(dc14, [
    { description: 'Preview color changes when picker changes', assertion: "(() => { const picker = document.getElementById('color-picker'); picker.value = '#ff0000'; picker.dispatchEvent(new Event('input')); return document.getElementById('preview').style.backgroundColor === 'rgb(255, 0, 0)' || document.getElementById('preview').style.backgroundColor === '#ff0000'; })()", order_index: 1 },
  ])

  console.log('\n🎉 DOM seed complete!\n')
}

seedDom().catch(console.error)
