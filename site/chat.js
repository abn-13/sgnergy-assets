(() => {
  'use strict';
  const script = document.currentScript;
  if (!script) return;
  const mount = document.getElementById(script.dataset.mount || '') || document.body;
  const root = document.createElement('div');
  root.className = 'sg-chat';
  const id = 'sg-' + Math.random().toString(36).slice(2, 10);
  // Static markup only; conversation text never enters innerHTML.
  root.innerHTML = `<button class="sg-launch" type="button" aria-expanded="false" aria-controls="${id}-panel">S. &nbsp; Ask SGnergy &#8599;</button>
<section class="sg-panel" id="${id}-panel" aria-label="SGnergy AI assistant" hidden>
<header class="sg-head"><span class="sg-mark" aria-hidden="true">S.</span><div><h2>Ask SGnergy</h2><p>A clearer start to better energy</p></div><button class="sg-close" type="button" aria-label="Close assistant">&#215;</button></header>
<p class="sg-disclosure"><strong>You are chatting with an AI assistant.</strong> Messages are sent to Alibaba Cloud when you send. Do not share personal or confidential data. AI answers may be inaccurate.</p>
<div class="sg-log" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions"></div>
<nav class="sg-links" aria-label="Next steps"><a href="https://sgnergy.geo.hashmeta.tech/free-eui-check">Free EUI check &#8599;</a><a href="mailto:abu.bakar.nasir.abn@gmail.com">Email a human &#8599;</a></nav>
<form class="sg-form"><label for="${id}-input">Your energy question</label><div class="sg-row"><textarea class="sg-input" id="${id}-input" rows="2" maxlength="500" placeholder="What does EUI tell me?" aria-describedby="${id}-status ${id}-count"></textarea><button class="sg-send" type="submit" disabled>Send</button></div><p class="sg-counter" id="${id}-count">0 / 500</p><p class="sg-status" id="${id}-status" role="status" aria-live="polite" aria-atomic="true"></p></form>
</section>`;
  mount.append(root);
  const launch = root.querySelector('.sg-launch');
  const panel = root.querySelector('.sg-panel');
  const close = root.querySelector('.sg-close');
  const input = root.querySelector('textarea');
  const send = root.querySelector('.sg-send');
  const status = root.querySelector('.sg-status');
  const count = root.querySelector('.sg-counter');
  const log = root.querySelector('.sg-log');
  const history = [];
  let busy = false;
  let previousFocus = launch;
  function endpoint() {
    const value = (script.dataset.endpoint || '').trim();
    if (!value) return '';
    try {
      const url = new URL(value, document.baseURI);
      return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch { return ''; }
  }
  function refresh() {
    const configured = Boolean(endpoint());
    input.disabled = !configured || busy;
    send.disabled = !configured || busy || !input.value.trim();
    count.textContent = input.value.length + ' / 500';
    if (!configured) status.textContent = 'Preview mode: sending is off until an endpoint is configured. The links above are available.';
    else if (!busy && !status.dataset.result) status.textContent = 'Ready for your question. Up to 500 characters.';
  }
  function addMessage(role, text) {
    const item = document.createElement('div');
    item.className = 'sg-message sg-' + role;
    const label = document.createElement('span');
    label.className = 'sg-role';
    label.textContent = role === 'user' ? 'YOU' : 'SGNERGY / AI ASSISTANT';
    const bubble = document.createElement('p');
    bubble.className = 'sg-bubble';
    // Only pages confirmed on the live homepage and the verified human email.
    const origin = 'https://sgnergy.geo.hashmeta.tech';
    const paths = new Set(['/', '/free-eui-check', '/how-it-works', '/sample-report', '/pricing', '/office-energy-map', '/privacy', '/terms']);
    function safeURL(value) {
      try {
        const url = new URL(value, origin);
        if (url.protocol === 'https:' && url.origin === origin && paths.has(url.pathname) && !url.username && !url.password) return url.href;
        if (url.protocol === 'mailto:' && url.pathname === 'abu.bakar.nasir.abn@gmail.com' && !url.search && !url.hash) return url.href;
      } catch {}
      return '';
    }
    const pattern = /\[([^\]\n]+)\]\(([^\s)]+)\)|https?:\/\/[^\s<>]+|mailto:[^\s<>]+/g;
    let offset = 0;
    for (const match of text.matchAll(pattern)) {
      bubble.append(document.createTextNode(text.slice(offset, match.index)));
      const value = (match[2] || match[0]).replace(/[.,;!?)]+$/, '');
      const href = role === 'assistant' ? safeURL(value) : '';
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = match[1] || value;
        bubble.append(link);
        if (!match[2]) bubble.append(document.createTextNode(match[0].slice(value.length)));
      } else bubble.append(document.createTextNode(match[0]));
      offset = match.index + match[0].length;
    }
    bubble.append(document.createTextNode(text.slice(offset)));
    item.append(label, bubble);
    log.append(item);
    log.scrollTop = log.scrollHeight;
  }
  function open(focus) {
    previousFocus = document.activeElement === document.body ? launch : document.activeElement;
    panel.hidden = false;
    launch.hidden = true;
    launch.setAttribute('aria-expanded', 'true');
    refresh();
    if (focus) close.focus();
  }
  function dismiss() {
    panel.hidden = true;
    launch.hidden = false;
    launch.setAttribute('aria-expanded', 'false');
    if (previousFocus && previousFocus.isConnected && !panel.contains(previousFocus)) previousFocus.focus();
    else launch.focus();
    scheduleLayout();
  }
  // Reposition only the closed launcher when it would cover a page link.
  let layoutFrame = 0;
  function clearPageLinks() {
    layoutFrame = 0;
    if (!panel.hidden) return;
    root.style.bottom = '';
    const box = launch.getBoundingClientRect();
    const conflicts = [...document.querySelectorAll('footer a, #hm-footer a')].filter(a => !root.contains(a)).map(a => a.getBoundingClientRect()).filter(r => r.width && r.top < box.bottom + 8 && r.bottom > box.top - 8 && r.left < box.right && r.right > box.left);
    if (conflicts.length) {
      const top = Math.min(...conflicts.map(r => r.top));
      root.style.bottom = Math.min(window.innerHeight - box.height - 16, window.innerHeight - top + 12) + 'px';
    }
  }
  function scheduleLayout() { if (!layoutFrame) layoutFrame = requestAnimationFrame(clearPageLinks); }
  window.addEventListener('scroll', scheduleLayout, { passive: true });
  window.addEventListener('resize', scheduleLayout, { passive: true });
  scheduleLayout();
  launch.addEventListener('click', () => { root.style.bottom = ''; open(true); });
  close.addEventListener('click', dismiss);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); dismiss(); }
  });
  input.addEventListener('input', () => { delete status.dataset.result; refresh(); });
  new MutationObserver(refresh).observe(script, { attributes: true, attributeFilter: ['data-endpoint'] });
  root.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const target = endpoint();
    const message = input.value.trim();
    if (busy || !target || !message || input.value.length > 500) { refresh(); return; }
    // Backend contract: {reply: string}. Backend owns the 300-token output cap,
    // friendly 2-4 sentence responses, and exclusion of pricing/payment advice.
    const prior = history.slice(-6).map(turn => ({ role: turn.role, content: turn.content }));
    busy = true;
    delete status.dataset.result;
    addMessage('user', message);
    status.textContent = 'Waiting for the AI assistant...';
    refresh();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(target, {
        method: 'POST', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: prior }), signal: controller.signal
      });
      if (!response.ok) throw new Error('Request failed');
      const data = await response.json();
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Missing reply');
      const reply = data.reply.trim();
      addMessage('assistant', reply);
      history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
      history.splice(0, Math.max(0, history.length - 6));
      input.value = '';
      status.textContent = 'Reply received. What else would you like to explore?';
    } catch {
      status.textContent = 'The assistant could not reply. Your question is still in the box; try again or email a human.';
    } finally {
      clearTimeout(timeout);
      busy = false;
      status.dataset.result = 'true';
      refresh();
      if (!panel.hidden && root.contains(document.activeElement)) input.focus();
    }
  });
  addMessage('assistant', "Hello, I'm the SGnergy AI assistant. I can help you understand EUI and find a practical starting point for your building. What would you like to explore?");
  refresh();
  if (script.dataset.open === 'true') open(false);
})();
