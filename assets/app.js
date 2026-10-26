'use strict';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- tiny syntax highlighter ---------- */
const KEYWORDS = 'for|if|else|int|in|or|and|return|while|class|public|private|new|void|static|def|true|false|this|unsigned|char|boolean|record|var';
function highlight(src, lang) {
  const comment = lang === 'py' || lang === 'make' ? '#.*' : '\\/\\/.*';
  const re = new RegExp(`(${comment})|("[^"\\n]*"|'[^'\\n]*')|\\b(0x[0-9A-Fa-f]+|0b[01]+|\\d+)\\b|\\b(${KEYWORDS})\\b|\\b([A-Za-z_]\\w*)(?=\\()`, 'g');
  let out = '', i = 0;
  for (const m of src.matchAll(re)) {
    out += esc(src.slice(i, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 'k' : 'f';
    out += `<span class="t-${cls}">${esc(m[0])}</span>`;
    i = m.index + m[0].length;
  }
  return out + esc(src.slice(i));
}
// Lines starting with "!" are marked bad, "+" good.
function renderCode(src, lang) {
  return src.split('\n').map(line => {
    const mark = line[0] === '!' ? 'bad' : line[0] === '+' ? 'good' : '';
    const body = highlight(mark ? ' ' + line.slice(1) : line, lang);
    return mark ? `<span class="${mark}">${body}</span>` : body;
  }).join('\n');
}
$$('pre.code[data-lang]').forEach(pre => { if (pre.textContent.trim()) pre.innerHTML = highlight(pre.textContent, pre.dataset.lang); });

$$('[data-tabs]').forEach(box => {
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    $$('[data-tab]', box).forEach(x => x.classList.toggle('active', x === b));
    $$('[data-pane]', box).forEach(p => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
});

/* ---------- demos: each has start/stop, run only while its slide is visible ---------- */
const demos = {};

demos.life = (() => {
  const cv = $('#life'), ctx = cv.getContext('2d');
  const N = 48, S = cv.width / N;
  let g = new Uint8Array(N * N), age = new Uint8Array(N * N);
  let gen = 0, playing = true, raf = 0, last = 0, paint = -1;
  const genEl = $('#life-gen'), playBtn = $('#life-play');

  function randomize() {
    for (let i = 0; i < g.length; i++) g[i] = Math.random() < 0.28 ? 1 : 0;
    age.fill(0); gen = 0;
  }
  function step() {
    const n = new Uint8Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx || dy) c += g[((y + dy + N) % N) * N + (x + dx + N) % N];
      const i = y * N + x;
      n[i] = c === 3 || (g[i] && c === 2) ? 1 : 0;
      age[i] = n[i] && g[i] ? Math.min(age[i] + 1, 60) : 0;
    }
    g = n; gen++;
  }
  function draw() {
    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < g.length; i++) {
      if (!g[i]) continue;
      const a = age[i];
      ctx.fillStyle = a === 0 ? '#d9ffe6' : `hsl(${142 - a * 1.2} 72% ${62 - a * 0.35}%)`;
      ctx.fillRect((i % N) * S + 1, Math.floor(i / N) * S + 1, S - 2, S - 2);
    }
    genEl.textContent = gen;
  }
  function loop(t) {
    if (playing && t - last > 110) { step(); last = t; }
    draw();
    raf = requestAnimationFrame(loop);
  }
  function cellAt(e) {
    const r = cv.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N);
    return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1;
  }
  cv.addEventListener('pointerdown', e => {
    const i = cellAt(e); if (i < 0) return;
    cv.setPointerCapture(e.pointerId);
    paint = g[i] ? 0 : 1; g[i] = paint; age[i] = 0;
  });
  cv.addEventListener('pointermove', e => {
    if (paint < 0) return;
    const i = cellAt(e); if (i >= 0) { g[i] = paint; age[i] = 0; }
  });
  cv.addEventListener('pointerup', () => { paint = -1; });
  playBtn.onclick = () => { playing = !playing; playBtn.textContent = playing ? 'Pausa' : 'Spela'; };
  $('#life-step').onclick = () => { playing = false; playBtn.textContent = 'Spela'; step(); };
  $('#life-rand').onclick = randomize;
  $('#life-clear').onclick = () => { g.fill(0); age.fill(0); gen = 0; };
  $('#life-glider').onclick = () => {
    const ox = Math.floor(Math.random() * N), oy = Math.floor(Math.random() * N);
    for (const [x, y] of [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]) g[((oy + y) % N) * N + (ox + x) % N] = 1;
  };
  randomize();
  return {
    start() { last = 0; raf = requestAnimationFrame(loop); },
    stop() { cancelAnimationFrame(raf); },
  };
})();

demos.refactor = (() => {
  const SPAGHETTI = `void spelaRunda() {
!  int a = (int)(Math.random()*6) + 1;
!  int b = (int)(Math.random()*6) + 1;
!  int c = (int)(Math.random()*6) + 1;
   visa(a, b, c);
!  if (vilKastaOm()) a = (int)(Math.random()*6) + 1;
}`;
  const CLEAN = `void spelaRunda() {
+  Tarning t = new Tarning();
+  int a = t.kasta(), b = t.kasta(), c = t.kasta();
   visa(a, b, c);
+  if (vilKastaOm()) a = t.kasta();
}`;
  const DIE = `public class Tarning {
  public int kasta() { return (int)(Math.random()*6) + 1; }
}`;
  const FIA_EMPTY = `// tomt projekt
// ...hur kastade man en tärning nu igen?`;
  const FIA = `void flyttaPjas(Pjas p) {
+  int steg = new Tarning().kasta();
   p.flytta(steg);
}`;
  const EXPLAIN = [
    'Samma rad finns på <b>fyra</b> ställen. Vill du byta till en 20-sidig tärning måste du hitta alla, och missar du en har du en bugg.',
    'Lyft ut tärningen till en egen klass. Nu finns logiken på <b>ett</b> ställe och har ett namn som säger vad den gör.',
    'Nytt spel? Ta med <b>Tarning.java</b> och kör. Ingen ny kod, inga nya buggar. Klicka på tärningen!',
  ];
  const file = (name, code, isNew, die) => `<div class="file${isNew ? ' new' : ''}">
    <div class="file-name"><span>${name}</span>${die ? '<button class="die" title="kasta()">6</button>' : ''}</div>
    <pre class="code">${renderCode(code, 'java')}</pre></div>`;

  function show(step) {
    $$('#ref-steps .step').forEach(b => b.classList.toggle('active', +b.dataset.step === step));
    $('#proj-yatzy').innerHTML = step === 0 ? file('Yatzy.java', SPAGHETTI)
      : file('Yatzy.java', CLEAN) + file('Tarning.java', DIE, step === 1, true);
    $('#proj-fia').innerHTML = step < 2 ? file('Fia.java', FIA_EMPTY)
      : file('Fia.java', FIA) + file('Tarning.java', DIE, true, true);
    $('#ref-arrow').classList.toggle('on', step === 2);
    $('#ref-explain').innerHTML = EXPLAIN[step];
  }
  $('#ref-steps').addEventListener('click', e => { const b = e.target.closest('.step'); if (b) show(+b.dataset.step); });
  $('#oop').addEventListener('click', e => {
    const d = e.target.closest('.die'); if (!d) return;
    d.classList.remove('roll'); void d.offsetWidth; d.classList.add('roll');
    d.textContent = 1 + Math.floor(Math.random() * 6);
  });
  show(0);
  return { start() {}, stop() {} };
})();

demos.git = (() => {
  const POOL = ['class Spel {', '  int poäng = 0;', '  void hoppa() {', '    y -= 10;', '  }', '  void träffa() {', '    poäng++;', '  }', '}'];
  const GARBAGE = ['§clas Spel {{{', '§  int poäng = "många";', '§  void hoppa( {', '§    y -= ???;', '§}}'];
  const fileEl = $('#git-file'), tl = $('#git-timeline'), logEl = $('#git-log'), dirtyEl = $('#git-dirty');
  let lines, commits, head, dirty, poolI;

  const hash = () => Math.random().toString(16).slice(2, 9);
  function log(html) { logEl.innerHTML += html + '\n'; logEl.scrollTop = logEl.scrollHeight; }
  function render() {
    fileEl.innerHTML = lines.map(l => l[0] === '§' ? `<span class="broken">${esc(l.slice(1))}</span>` : highlight(l, 'java')).join('\n');
    fileEl.scrollTop = fileEl.scrollHeight;
    dirtyEl.hidden = !dirty;
    const shown = commits.slice(-9), off = commits.length - shown.length;
    tl.innerHTML = shown.map((c, k) => `<div class="commit${k + off === head ? ' head' : ''}"><button data-c="${k + off}" title="${esc(c.msg)}">${k + off}</button></div>`).join('');
  }
  function reset() {
    lines = ['// Spel.java']; poolI = 0; dirty = false;
    commits = [{ id: hash(), msg: 'första commit', lines: [...lines] }]; head = 0;
    logEl.innerHTML = '<span class="dim">$ git init && git commit -m "första commit"</span>\n';
    render();
  }
  $('#git-write').onclick = () => {
    lines = lines.filter(l => l[0] !== '§');
    lines.push(poolI < POOL.length ? POOL[poolI++] : `// ny idé #${poolI++ - POOL.length + 1}`);
    dirty = true; render();
  };
  $('#git-commit').onclick = () => {
    if (!dirty) { log('<span class="p">$ git commit</span>\n<span class="dim">nothing to commit, working tree clean</span>'); return; }
    const broken = lines.some(l => l[0] === '§');
    const c = { id: hash(), msg: broken ? 'fixade nog allt (?)' : `lägg till rad ${lines.length}`, lines: [...lines] };
    commits.push(c); head = commits.length - 1; dirty = false;
    log(`<span class="p">$ git commit -m "${esc(c.msg)}"</span>\n<span class="ok">[main ${c.id}]</span> ${esc(c.msg)}`);
    render();
  };
  $('#git-break').onclick = () => {
    lines = ['// Spel.java', ...GARBAGE]; dirty = true; render();
    log('<span class="err">error: 47 errors. Allt är trasigt. 😱</span>');
  };
  tl.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    head = +b.dataset.c; const c = commits[head];
    lines = [...c.lines]; dirty = false;
    log(`<span class="p">$ git checkout ${c.id}</span>\n<span class="ok">HEAD är nu på ${c.id}</span> ${esc(c.msg)}: koden är räddad!`);
    render();
  });
  reset();
  return { start() {}, stop() {} };
})();

demos.app = (() => {
  let items = [{ text: 'Plugga C', done: true }, { text: 'Pusha till git', done: false }, { text: 'Fika', done: false }];
  const list = $('#app-list'), raw = $('#app-raw'), ui = $('#app-ui');
  function render() {
    list.innerHTML = items.map((it, i) => `<li class="${it.done ? 'done' : ''}${it.fresh ? ' fresh' : ''}">
      <input type="checkbox" data-i="${i}" ${it.done ? 'checked' : ''} aria-label="Klar">
      <span>${esc(it.text)}</span><button class="del" data-del="${i}" aria-label="Ta bort">×</button></li>`).join('');
    items.forEach(it => delete it.fresh);
    const n = items.filter(x => x.done).length;
    $('#app-foot').textContent = `${n} av ${items.length} klara`;
    const body = items.map(it => `  new Uppgift(${JSON.stringify(it.text)}, ${it.done})`).join(',\n');
    raw.innerHTML = highlight(`// Så här ser backend datan:\nList<Uppgift> lista = List.of(\n${body}\n);\n\n// Frontend = att göra den\n// begriplig och klickbar.`, 'java');
  }
  list.addEventListener('change', e => { const i = e.target.dataset.i; if (i != null) { items[i].done = e.target.checked; render(); } });
  list.addEventListener('click', e => { const i = e.target.dataset.del; if (i != null) { items.splice(+i, 1); render(); } });
  $('#app-form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#app-input'), text = inp.value.trim();
    if (text) { items.push({ text, done: false, fresh: true }); inp.value = ''; render(); }
  });
  $('#app-xray').addEventListener('change', e => { raw.hidden = !e.target.checked; ui.hidden = e.target.checked; });
  render();
  return { start() {}, stop() {} };
})();

demos.make = (() => {
  const term = $('#make-term');
  let running = false, busy = false;
  const OUT = {
    help: () => `Tillgängliga kommandon:

  make help     Visa den här hjälpen
  make up       Starta presentationen lokalt
  make down     Stoppa den lokala servern
  make status   Visa om servern kör
  make test     Kolla JavaScript-syntax och relativa länkar
  make deploy   Kopiera till ~/public_html på itchy`,
    up: () => running
      ? '<span class="dim">Servern kör redan: http://127.0.0.1:8080/</span>'
      : (running = true, `Startar lokal server på port 8080…
<span class="ok">Klart!</span> Öppna http://127.0.0.1:8080/

Kör \`make help\` för fler kommandon.`),
    down: () => running ? (running = false, '<span class="ok">Servern stoppad.</span>') : '<span class="dim">Servern kör inte.</span>',
    cat: () => highlight(`# (förenklad)
PORT ?= 8080

help:  ## Visa den här hjälpen
	@grep '##' Makefile

up:    ## Starta presentationen lokalt
	python3 -m http.server $(PORT) &

down:  ## Stoppa den lokala servern
	kill $$(cat .runtime/server.pid)`, 'make'),
  };
  const CMD = { help: 'make help', up: 'make up', down: 'make down', cat: 'cat Makefile' };
  async function run(k) {
    if (busy) return; busy = true;
    term.innerHTML += '<span class="p">$ </span>';
    for (const ch of CMD[k]) { term.innerHTML += esc(ch); await sleep(35); }
    term.innerHTML += '\n';
    await sleep(200);
    term.innerHTML += OUT[k]() + '\n\n';
    term.scrollTop = term.scrollHeight;
    busy = false;
  }
  $$('[data-make]').forEach(b => b.addEventListener('click', () => run(b.dataset.make)));
  term.innerHTML = '<span class="dim"># Klicka på ett kommando nedan.</span>\n\n';
  return { start() {}, stop() {} };
})();

demos.threads = (() => {
  const cv = $('#mandel'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  const COLORS = ['#f472b6', '#38bdf8', '#4ade80', '#facc15', '#a78bfa', '#fb923c', '#2dd4bf', '#f87171'];
  const ROWS_PER_SEC = 60;
  const nInput = $('#thr-n'), bars = $('#thread-bars'), timeEl = $('#thr-time');
  let img = null, raf = 0, run = null;

  function compute() {
    img = ctx.createImageData(W, H);
    const scale = 3.1 / W, cx = -0.65, cy = 0, MAX = 90;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let zr = 0, zi = 0, k = 0;
      const r0 = cx + (x - W / 2) * scale, i0 = cy + (y - H / 2) * scale;
      while (k < MAX && zr * zr + zi * zi < 4) { const t = zr * zr - zi * zi + r0; zi = 2 * zr * zi + i0; zr = t; k++; }
      const p = (y * W + x) * 4, v = k === MAX ? 0 : Math.sqrt(k / MAX);
      img.data[p] = 255 * Math.min(1, v * 1.6) * 0.65;
      img.data[p + 1] = 255 * v * 0.55;
      img.data[p + 2] = 255 * Math.min(1, v * 2.2);
      img.data[p + 3] = 255;
    }
  }
  const bands = n => Array.from({ length: n }, (_, t) => [Math.round(t * H / n), Math.round((t + 1) * H / n)]);
  function drawBands(n) {
    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
    bands(n).forEach(([a, b], t) => {
      ctx.fillStyle = COLORS[t] + '22'; ctx.fillRect(0, a, W, b - a);
      ctx.fillStyle = COLORS[t]; ctx.font = '12px JetBrains Mono, monospace'; ctx.fillText(`tråd ${t + 1}`, 8, a + 16);
    });
    bars.innerHTML = bands(n).map((_, t) => `<div class="thread-bar"><span>T${t + 1}</span><div><i style="background:${COLORS[t]}"></i></div></div>`).join('');
  }
  function frame(now) {
    const done = Math.floor((now - run.t0) / 1000 * ROWS_PER_SEC);
    let all = true;
    run.bands.forEach(([a, b], t) => {
      const upTo = Math.min(b, a + done);
      for (let y = run.row[t]; y < upTo; y++) ctx.putImageData(img, 0, 0, 0, y, W, 1);
      run.row[t] = upTo;
      if (upTo < b) { all = false; ctx.fillStyle = COLORS[t]; ctx.fillRect(0, upTo, W, 2); }
      bars.children[t].querySelector('i').style.width = ((upTo - a) / (b - a) * 100) + '%';
    });
    timeEl.textContent = ((now - run.t0) / 1000).toFixed(1) + ' s';
    if (all) {
      ctx.putImageData(img, 0, 0);
      const n = run.bands.length;
      $('#thr-results').insertAdjacentHTML('beforeend', `<span>${n} ${n === 1 ? 'tråd' : 'trådar'}: ${timeEl.textContent}</span>`);
      run = null; return;
    }
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!img) compute();
    const n = +nInput.value;
    cancelAnimationFrame(raf);
    drawBands(n);
    run = { t0: performance.now(), bands: bands(n), row: bands(n).map(b => b[0]) };
    raf = requestAnimationFrame(frame);
  }
  nInput.addEventListener('input', () => { $('#thr-label').textContent = nInput.value; if (!run) drawBands(+nInput.value); });
  $('#thr-run').onclick = start;
  const cores = navigator.hardwareConcurrency;
  if (cores) $('#cores').innerHTML = `Din dator har <b>${cores}</b> logiska kärnor, alltså plats för ${cores} trådar samtidigt.`;
  return {
    start() { if (!run) drawBands(+nInput.value); },
    stop() { cancelAnimationFrame(raf); run = null; timeEl.textContent = '–'; },
  };
})();

demos.signals = (() => {
  class Signal {
    constructor() { this.slots = new Set(); }
    connect(f) { this.slots.add(f); }
    disconnect(f) { this.slots.delete(f); }
    emit(...args) { for (const f of this.slots) f(...args); }
  }
  const hit = new Signal();
  const player = $('#sig-player'), slide = $('#signals'), wires = $('#sig-wires');
  let hp = 100, hits = 0;
  const SOUNDS = ['AJ!', 'OUCH!', '*bonk*', 'AAAH', 'oof'];
  const handlers = {
    hud: dmg => {
      hp = Math.max(0, hp - dmg);
      const bar = $('#sig-hp'); bar.style.width = hp + '%';
      bar.style.background = hp > 50 ? 'var(--c-ipc)' : hp > 20 ? 'var(--c-oop)' : 'var(--red)';
      if (hp === 0) {
        player.classList.add('dead');
        setTimeout(() => { hp = 100; bar.style.width = '100%'; bar.style.background = 'var(--c-ipc)'; player.classList.remove('dead'); }, 1200);
      }
    },
    sound: () => { $('#sig-sound').textContent = '🔊 ' + SOUNDS[Math.floor(Math.random() * SOUNDS.length)]; },
    camera: () => { slide.classList.remove('shake'); void slide.offsetWidth; slide.classList.add('shake'); },
    ach: () => { hits++; $('#sig-ach').textContent = hits >= 10 ? `🏆 Boxningssäck! (${hits} träffar)` : `${hits} träffar`; },
  };
  const ls = $$('#sig-listeners .listener');
  // wires from the emitter (left middle) to each listener's vertical centre
  wires.innerHTML = ls.map((_, i) => { const y = 35 + i * (320 - 70) / 3; return `<path d="M0 118 C100 118 100 ${y} 200 ${y}"/>`; }).join('');
  const paths = $$('path', wires);
  function updateSlots() { $('#sig-slots').textContent = `player.hit: ${hit.slots.size} kopplade`; }
  ls.forEach((el, i) => {
    const box = $('input', el), f = handlers[el.dataset.l];
    const sync = () => {
      box.checked ? hit.connect(f) : hit.disconnect(f);
      el.classList.toggle('off', !box.checked); paths[i].classList.toggle('off', !box.checked);
      updateSlots();
    };
    box.addEventListener('change', sync); sync();
  });
  $('#sig-hit').onclick = () => {
    player.classList.remove('hit'); void player.offsetWidth; player.classList.add('hit');
    hit.emit(10);
    ls.forEach((el, i) => {
      if (!$('input', el).checked) return;
      el.classList.add('fire'); paths[i].classList.add('fire');
      setTimeout(() => { el.classList.remove('fire'); paths[i].classList.remove('fire'); }, 300);
    });
  };
  return { start() {}, stop() {} };
})();

demos.db = (() => {
  const nodes = $$('#db-flow .node'), packet = $('#db-packet'), msg = $('#db-msg');
  $('#db-url').textContent = location.protocol === 'file:' ? 'en fil på din dator (inte hostad än!)' : location.href.split('#')[0];
  $('#db-host').textContent = location.host ? location.host : 'people.cs.umu.se';
  let token = 0;
  async function send() {
    const my = ++token;
    const path = location.pathname || '/';
    const STEPS = [
      [0, `GET ${path}`],
      [1, 'Servern letar upp filen i ~/public_html/…'],
      [2, 'PHP kör koden (om sidan är .php)'],
      [3, 'SELECT * FROM kurser;'],
      [2, 'PHP bygger HTML av svaret'],
      [1, '200 OK, skickar sidan'],
      [0, 'Sidan visas. Det är den du tittar på nu!'],
    ];
    packet.style.opacity = 1;
    for (const [i, text] of STEPS) {
      if (my !== token) return;
      const n = nodes[i];
      packet.style.left = (n.offsetLeft + n.offsetWidth / 2) + 'px';
      nodes.forEach(x => x.classList.toggle('lit', x === n));
      msg.textContent = text;
      await sleep(900);
    }
    if (my !== token) return;
    packet.style.opacity = 0; nodes.forEach(x => x.classList.remove('lit'));
    msg.textContent = 'Den här presentationen är ren HTML, så servern skickar filen direkt. Med PHP + SQLite kan sidan spara data.';
  }
  $('#db-send').onclick = send;

  const KURSER = [
    { namn: 'IPC', sprak: 'C', fokus: 'mönster' },
    { namn: 'OOP', sprak: 'Java', fokus: 'återanvändning' },
    { namn: 'App', sprak: 'Java', fokus: 'frontend' },
    { namn: 'Systemnära', sprak: 'C', fokus: 'make, trådar' },
    { namn: 'Databaser', sprak: 'SQL', fokus: 'hosting' },
    { namn: 'Inbyggda', sprak: 'C', fokus: 'hårdvara' },
    { namn: 'PVT', sprak: 'Flera', fokus: 'team' },
  ];
  const QUERIES = {
    all: () => KURSER,
    java: () => KURSER.filter(k => k.sprak === 'Java'),
    order: () => [...KURSER].sort((a, b) => a.namn.localeCompare(b.namn, 'sv')),
    count: () => Object.entries(KURSER.reduce((m, k) => (m[k.sprak] = (m[k.sprak] || 0) + 1, m), {}))
      .map(([sprak, n]) => ({ sprak, 'COUNT(*)': n })),
  };
  function query(q) {
    $$('[data-q]').forEach(b => b.classList.toggle('active', b.dataset.q === q));
    const rows = QUERIES[q](), cols = Object.keys(rows[0]);
    $('#db-table').innerHTML = `<tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>` +
      rows.map(r => `<tr class="in">${cols.map(c => `<td>${esc(r[c])}</td>`).join('')}</tr>`).join('');
  }
  $$('[data-q]').forEach(b => b.addEventListener('click', () => query(b.dataset.q)));
  query('all');
  return {
    start() {},
    stop() { token++; packet.style.opacity = 0; nodes.forEach(x => x.classList.remove('lit')); msg.textContent = ''; },
  };
})();

demos.emb = (() => {
  const box = $('#leds'), code = $('#led-code');
  box.innerHTML = Array.from({ length: 8 }, (_, i) => `<button class="led" data-bit="${7 - i}" aria-label="bit ${7 - i}"><small>${7 - i}</small></button>`).join('');
  const leds = $$('.led', box);
  let value = 0, timer = 0, pos = 0, dir = 1;
  function render() {
    leds.forEach(l => l.classList.toggle('on', !!(value >> l.dataset.bit & 1)));
    const hex = value.toString(16).toUpperCase().padStart(2, '0');
    code.innerHTML = highlight(`PORTB = 0b${value.toString(2).padStart(8, '0')};  // 0x${hex} = ${value}`, 'c');
  }
  function anim(fn, ms) { clearInterval(timer); timer = setInterval(() => { fn(); render(); }, ms); }
  box.addEventListener('click', e => { const l = e.target.closest('.led'); if (!l) return; clearInterval(timer); value ^= 1 << l.dataset.bit; render(); });
  $('#led-run').onclick = () => anim(() => { value = 1 << pos; pos += dir; if (pos === 7 || pos === 0) dir = -dir; }, 90);
  $('#led-count').onclick = () => anim(() => { value = (value + 1) & 255; }, 120);
  $('#led-off').onclick = () => { clearInterval(timer); value = 0; render(); };

  const arm = $('#arm'), clock = $('#clock'), clockT = $('#clock-t'), goofyMsg = $('#goofy-msg');
  let busy = false;
  $('#goofy').onclick = async () => {
    if (busy) return; busy = true;
    clock.classList.add('ring'); clockT.textContent = 'RIIING'; goofyMsg.textContent = 'larmet går…';
    await sleep(900);
    clock.classList.remove('ring');
    arm.classList.add('slap'); goofyMsg.textContent = 'servo.write(160); // tyst på dig';
    await sleep(220);
    clock.classList.add('squash'); clockT.textContent = 'tyst.';
    const before = value; value = 255; render();
    await sleep(500);
    arm.classList.remove('slap'); clock.classList.remove('squash'); value = before; render();
    await sleep(900);
    clockT.textContent = '07:00'; goofyMsg.textContent = 'servo väntar…'; busy = false;
  };
  render();
  return { start() {}, stop() { clearInterval(timer); } };
})();

demos.pvt = (() => {
  const svg = $('#pvt-graph'), logEl = $('#pvt-log'), nextBtn = $('#pvt-next');
  const LANES = [{ name: 'main', color: '#2dd4bf' }, { name: 'login', color: '#f472b6' }, { name: 'karta', color: '#facc15' }];
  const WHO = { Cia: '#2dd4bf', Alva: '#f472b6', Ben: '#facc15', Alla: '#e8eaf0' };
  const SEQ = [
    { lane: 0, who: 'Cia', msg: 'Projektstart: README + Makefile. Alla kör make up.' },
    { lane: 1, from: 0, who: 'Alva', msg: 'git switch -c login. Börjar på inloggningen.' },
    { lane: 2, from: 0, who: 'Ben', msg: 'git switch -c karta. Ber agenten skissa en karta.' },
    { lane: 1, who: 'Alva', msg: 'Inloggningssida + tester.' },
    { lane: 2, who: 'Ben', msg: 'Granskar agentens kod, stryker hälften, committar.' },
    { lane: 0, merge: 1, who: 'Cia', msg: 'Code review ✓ → merge login till main.' },
    { lane: 2, conflict: true, merge: 0, who: 'Ben', msg: 'Konflikt! Både login och karta ändrade index.html.' },
    { lane: 2, who: 'Ben', msg: 'Löser konflikten tillsammans med Alva.' },
    { lane: 0, merge: 2, who: 'Cia', msg: 'Code review ✓ → merge karta till main.' },
    { lane: 0, who: 'Alla', msg: 'v1.0: demo för kunden! 🎉' },
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const X = i => 150 + i * 98, Y = l => 30 + l * 55;
  let step, last, edges, dots;

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e); return e;
  }
  function edge(a, b, color) {
    const d = a.y === b.y ? `M${a.x} ${a.y} L${b.x} ${b.y}` : `M${a.x} ${a.y} C${a.x + 50} ${a.y} ${b.x - 50} ${b.y} ${b.x} ${b.y}`;
    el('path', { d, stroke: color }, edges);
  }
  function reset() {
    svg.innerHTML = ''; logEl.innerHTML = '';
    LANES.forEach((l, i) => el('text', { x: 10, y: Y(i) + 5, class: 'lane-label', opacity: i ? 0 : 1, id: `lane-${i}` }, svg).textContent = l.name);
    edges = el('g', {}, svg); dots = el('g', {}, svg);
    step = 0; last = [];
    nextBtn.disabled = false; nextBtn.textContent = 'Nästa steg i projektet';
    next();
  }
  function next() {
    if (step >= SEQ.length) return;
    const ev = SEQ[step], p = { x: X(step), y: Y(ev.lane) }, color = LANES[ev.lane].color;
    const prev = last[ev.lane] || last[ev.from];
    if (prev) edge(prev, p, color);
    if (ev.merge != null && last[ev.merge]) edge(last[ev.merge], p, LANES[ev.merge].color);
    $(`#lane-${ev.lane}`, svg).setAttribute('opacity', 1);
    el('circle', { cx: p.x, cy: p.y, r: ev.merge != null && !ev.conflict ? 12 : 9, fill: ev.conflict ? '#f87171' : color }, dots);
    if (ev.conflict) el('text', { x: p.x, y: p.y + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#111' }, dots).textContent = '!';
    last[ev.lane] = p;
    logEl.insertAdjacentHTML('beforeend', `<div><span class="who" style="color:${WHO[ev.who]}">${ev.who}</span>${esc(ev.msg)}</div>`);
    while (logEl.children.length > 3) logEl.firstChild.remove();
    step++;
    if (step === SEQ.length) { nextBtn.disabled = true; nextBtn.textContent = 'Projektet är klart!'; }
  }
  nextBtn.onclick = next;
  $('#pvt-reset').onclick = reset;
  reset();
  return { start() {}, stop() {} };
})();

/* ---------- slide navigation ---------- */
const stage = $('#stage');
const slides = $$('.slide');
let cur = -1;

function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720);
  stage.style.transform = `scale(${s})`;
}
function go(i) {
  i = Math.max(0, Math.min(slides.length - 1, i));
  if (i === cur) return;
  if (cur >= 0) {
    slides[cur].classList.remove('active');
    demos[slides[cur].dataset.demo]?.stop();
  }
  slides.forEach((s, j) => s.classList.toggle('before', j < i));
  cur = i;
  slides[i].classList.add('active');
  demos[slides[i].dataset.demo]?.start();
  $('#counter').textContent = `${i + 1} / ${slides.length}`;
  $('#progress').style.width = ((i + 1) / slides.length * 100) + '%';
  history.replaceState(null, '', '#' + (i + 1));
}

addEventListener('resize', fit);
addEventListener('keydown', e => {
  const t = e.target;
  if (t.matches('textarea, select, input:not([type=checkbox])') || e.altKey || e.ctrlKey || e.metaKey) return;
  const onButton = t.matches('button, label, input');
  switch (e.key) {
    case 'ArrowRight': case 'PageDown': go(cur + 1); break;
    case 'ArrowLeft': case 'PageUp': go(cur - 1); break;
    case ' ': if (onButton) return; go(cur + (e.shiftKey ? -1 : 1)); break;
    case 'Home': go(0); break;
    case 'End': go(slides.length - 1); break;
    case 'f': case 'F':
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
      break;
    default: return;
  }
  e.preventDefault();
});
$('#prev').onclick = () => go(cur - 1);
$('#next').onclick = () => go(cur + 1);
document.addEventListener('click', e => {
  const g = e.target.closest('[data-goto]');
  if (g) go(slides.indexOf(document.getElementById(g.dataset.goto)));
});

let touchX = null;
addEventListener('touchstart', e => { touchX = e.target.closest('canvas, input, .term') ? null : e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', e => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1));
  touchX = null;
});

fit();
go((parseInt(location.hash.slice(1), 10) || 1) - 1);
