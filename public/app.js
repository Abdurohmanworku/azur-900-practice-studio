/* AZ-900 Practice Studio, FRONTEND (unofficial) */
(function () {
  const app = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let id = localStorage.getItem('az900id');
  if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2)); localStorage.setItem('az900id', id); }
  const get = p => fetch('/api/' + p + (p.includes('?') ? '&' : '?') + 'learner=' + id).then(r => r.json());
  const post = (p, b) => fetch('/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ learner: id }, b)) }).then(r => r.json());

  async function home() {
    const p = await get('progress'), R = p.readiness, C = 2 * Math.PI * 54;
    const verdict = R >= 80 ? 'Ready to book the exam' : R >= 60 ? 'Almost there' : p.answered ? 'Keep practising' : 'Start your first quiz';
    const note = p.answered ? 'You have answered ' + p.answered + ' of ' + p.total + ' questions. Each topic score uses your latest answer to every question.' : 'Answer questions to see your readiness. Unanswered questions count as zero.';
    app.innerHTML =
      '<section class="hero"><div class="ring" role="img" aria-label="Readiness ' + R + ' percent"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="track"/><circle cx="60" cy="60" r="54" class="arc" style="stroke-dasharray:' + (C * R / 100).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg><b>' + R + '%</b></div>' +
      '<div><h1>' + verdict + '</h1><p class="muted">' + note + '</p>' +
      '<div class="row"><button class="primary" id="mock">Mixed practice (12 questions)</button>' +
      '<button id="weak"' + (p.answered ? '' : ' disabled') + '>Practise weak spots' + (p.weakCount ? ' (' + p.weakCount + ')' : '') + '</button>' +
      '<button id="cards">Flashcards</button><button id="plan">Study planner</button><button id="buddy">Study buddy</button></div></div></section>' +
      '<h2>Topics</h2><div class="topics">' + p.topics.map(t =>
        '<article class="topic' + (t.answered && t.pct < 60 ? ' low' : '') + '"><div><h3>' + esc(t.name) + '</h3><p class="muted">' + t.weight + '% of the exam. ' + t.answered + ' of ' + t.total + ' answered, ' + t.correct + ' correct.</p>' +
        '<div class="bar" role="img" aria-label="' + t.pct + ' percent"><i style="width:' + t.pct + '%"></i></div></div>' +
        '<div class="end"><b class="pct">' + t.pct + '%</b><button data-t="' + t.key + '">Practise</button></div></article>').join('') + '</div>' +
      '<p class="fine"><button class="link" id="reset">Reset my progress</button></p>';
    document.getElementById('mock').onclick = () => start('mock');
    document.getElementById('weak').onclick = () => start('weak');
    document.getElementById('cards').onclick = cards;
    document.getElementById('plan').onclick = planner;
    document.getElementById('buddy').onclick = buddy;
    document.getElementById('reset').onclick = async () => { if (confirm('Delete all your saved answers?')) { await post('reset', {}); home(); } };
    app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => start('topic', b.dataset.t));
  }

  async function cards() {
    const deck = await get('cards');
    if (!deck.length) { app.innerHTML = '<h1>All cards mastered</h1><p class="muted">You marked every card as known three times. Reset your progress to start again.</p><button id="b">Back to dashboard</button>'; document.getElementById('b').onclick = home; return; }
    let i = 0;
    const show = () => {
      if (i >= deck.length) return home();
      const c = deck[i], tag = c.box < 0 ? 'New card' : c.box === 0 ? 'You missed this one' : 'Seen ' + c.box + ' time' + (c.box > 1 ? 's' : '') + ' correctly';
      app.innerHTML = '<div class="qhead"><button class="link" id="quit">Leave cards</button><span>' + esc(c.topicName) + ', card ' + (i + 1) + ' of ' + deck.length + '</span></div>' +
        '<div class="bar thin"><i style="width:' + (100 * i / deck.length) + '%"></i></div>' +
        '<div class="card"><p class="muted">' + tag + '</p><h2>' + esc(c.term) + '</h2><p id="def" hidden>' + esc(c.def) + '</p></div>' +
        '<div class="row" id="ctl"><button class="primary" id="rev">Show definition</button></div>';
      document.getElementById('quit').onclick = home;
      document.getElementById('rev').focus();
      document.getElementById('rev').onclick = () => {
        document.getElementById('def').hidden = false;
        document.getElementById('ctl').innerHTML = '<button class="primary" id="y">I knew it</button><button id="n">Still learning</button>';
        const rate = known => async () => { await post('card', { id: c.id, known }); i++; show(); };
        document.getElementById('y').onclick = rate(true); document.getElementById('n').onclick = rate(false);
        document.getElementById('y').focus();
      };
    };
    show();
  }

  function planner() {
    app.innerHTML = '<div class="qhead"><button class="link" id="b">Back to dashboard</button><span>Study planner</span></div><h2>Plan around your exam date</h2>' +
      '<div class="form"><label>Exam date<input type="date" id="d"></label><label>Hours you can study per week<input type="number" id="h" min="1" max="60" value="6"></label><button class="primary" id="go">Build my plan</button></div><div id="out" aria-live="polite"></div>';
    document.getElementById('b').onclick = home;
    document.getElementById('go').onclick = async () => {
      const r = await post('plan', { examDate: document.getElementById('d').value, hoursPerWeek: +document.getElementById('h').value }), out = document.getElementById('out');
      if (r.error) { out.innerHTML = '<p class="fb no">' + esc(r.error) + '</p>'; return; }
      out.innerHTML = '<p class="muted">' + r.days + ' days left. Plan covers the last ' + r.weeks + ' week' + (r.weeks > 1 ? 's' : '') + ' (' + r.totalHours + ' hours). Weak topics get more time, so answer some quizzes first for a sharper plan.</p>' +
        '<h3>Time by topic</h3><div class="topics">' + r.split.map(s => '<article class="topic"><div><h3>' + esc(s.name) + '</h3><p class="muted">Current score ' + (s.answered ? s.pct + '%' : 'not started') + '</p></div><b class="pct">' + s.hours + 'h</b></article>').join('') + '</div>' +
        '<h3>Week by week</h3><div class="topics">' + r.plan.map(w => '<article class="topic low"><div><h3>Week ' + w.week + ': ' + esc(w.focus) + '</h3><ul>' + w.tasks.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div></article>').join('') + '</div>';
    };
  }

  let H = [];
  const CHIPS = ['Explain the shared responsibility model', 'Compare IaaS, PaaS and SaaS', 'What is on the AZ-900 exam?', 'Quiz me on storage', 'Help me study my weak topic'];
  async function buddy() {
    const langs = await fetch('/api/languages').then(r => r.json());
    app.innerHTML = '<div class="qhead"><button class="link" id="b">Back to dashboard</button><span>AI study buddy</span></div><h2>Ask anything about AZ-900</h2>' +
      '<div class="row">' + CHIPS.map(c => '<button class="chip">' + esc(c) + '</button>').join('') + '</div>' +
      '<div id="chat" class="chat" aria-live="polite"><p class="muted">Ask about concepts, comparisons, the exam, study tips, or say "quiz me on storage".</p></div>' +
      '<div class="form"><label>Reply language<select id="lang">' + langs.map(l => '<option>' + l + '</option>').join('') + '</select></label><label>Your question<input id="m" maxlength="800" placeholder="Which storage redundancy should I choose?"></label><button class="primary" id="send">Ask</button></div>' +
      '<p class="fine"><button class="link" id="clr">Clear chat</button> AI answers can contain mistakes. Check important facts on Microsoft Learn.</p>';
    document.getElementById('b').onclick = home;
    const chat = document.getElementById('chat'), m = document.getElementById('m');
    const add = (who, t) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = t; chat.appendChild(d); d.scrollIntoView({ block: 'nearest' }); return d; };
    H.forEach(x => add(x.role === 'user' ? 'me' : 'bot', x.content));
    const ask = async text => {
      const t = (text || m.value).trim(); if (!t) return; m.value = ''; add('me', t);
      const el = add('bot', 'Thinking...');
      const r = await post('buddy', { message: t, language: document.getElementById('lang').value, history: H.slice(-8) });
      const a = r.error || r.reply; el.textContent = a;
      if (!r.error) H.push({ role: 'user', content: t }, { role: 'assistant', content: a });
    };
    document.getElementById('send').onclick = () => ask(); m.onkeydown = e => { if (e.key === 'Enter') ask(); };
    app.querySelectorAll('.chip').forEach(c => c.onclick = () => ask(c.textContent));
    document.getElementById('clr').onclick = () => { H = []; buddy(); };
  }

  async function start(mode, topic) {
    const qs = await get('questions?mode=' + mode + (topic ? '&topic=' + topic : ''));
    if (!qs.length) { app.innerHTML = '<p>Nothing to practise here yet.</p><button id="b">Back to dashboard</button>'; document.getElementById('b').onclick = home; return; }
    ask({ qs, i: 0, score: 0 });
  }

  function ask(s) {
    const q = s.qs[s.i];
    app.innerHTML = '<div class="qhead"><button class="link" id="quit">Leave quiz</button><span>' + esc(q.topicName) + ', question ' + (s.i + 1) + ' of ' + s.qs.length + '</span></div>' +
      '<div class="bar thin"><i style="width:' + (100 * s.i / s.qs.length) + '%"></i></div>' +
      '<h2 class="q">' + esc(q.q) + '</h2><div class="opts">' + q.options.map((o, k) => '<button class="opt" data-k="' + k + '">' + esc(o) + '</button>').join('') + '</div><div id="fb" aria-live="polite"></div>';
    document.getElementById('quit').onclick = home;
    app.querySelectorAll('.opt').forEach(b => b.onclick = async () => {
      const opts = app.querySelectorAll('.opt'); opts.forEach(x => x.disabled = true);
      const r = await post('answer', { id: q.id, choice: +b.dataset.k });
      opts[r.answer].classList.add('right'); if (!r.correct) b.classList.add('wrong');
      if (r.correct) s.score++;
      const last = s.i + 1 === s.qs.length;
      document.getElementById('fb').innerHTML = '<div class="fb ' + (r.correct ? 'ok' : 'no') + '"><b>' + (r.correct ? 'Correct.' : 'Not quite. The answer is: ' + esc(q.options[r.answer])) + '</b><p>' + esc(r.explain) + '</p><button class="primary" id="next">' + (last ? 'See results' : 'Next question') + '</button></div>';
      const n = document.getElementById('next'); n.focus();
      n.onclick = () => { s.i++; last ? done(s) : ask(s); };
    });
  }

  function done(s) {
    const pct = Math.round(100 * s.score / s.qs.length);
    app.innerHTML = '<section class="hero"><div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="track"/><circle cx="60" cy="60" r="54" class="arc" style="stroke-dasharray:' + (339.3 * pct / 100).toFixed(1) + ' 339.3"/></svg><b>' + pct + '%</b></div><div><h1>' + s.score + ' of ' + s.qs.length + ' correct</h1><p class="muted">Missed questions come back in "Practise weak spots" until you answer them correctly.</p><div class="row"><button class="primary" id="d">Back to dashboard</button></div></div></section>';
    document.getElementById('d').onclick = home;
  }
  home();
})();
