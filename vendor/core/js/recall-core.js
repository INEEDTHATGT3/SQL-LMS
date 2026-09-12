/**
 * Shared recall core logic - used by progress-tracker.js
 * This is the non-generated, reusable part
 */

export const recallCore = {
  // Quiz locking logic
  lockQuiz(card, answer, choice) {
    const opts = card.querySelectorAll('.quiz-opt');
    const explain = card.querySelector('.quiz-explain');
    const scoreEl = card.querySelector('.quiz-score');
    
    opts.forEach((o, i) => {
      o.classList.add('locked');
      if (i === answer) o.classList.add('correct');
      else if (i === choice) o.classList.add('wrong');
    });
    if (explain) explain.classList.add('show');
    if (scoreEl) scoreEl.textContent = (choice === answer ? '✔ CORRECT' : '✘ INCORRECT — see explanation');
  },
  
  // Reveal toggle
  toggleReveal(btn) {
    const target = document.getElementById(btn.getAttribute('data-target'));
    if (!target) return;
    target.classList.toggle('open');
    btn.textContent = target.classList.contains('open')
      ? (btn.getAttribute('data-hide') || 'Hide')
      : (btn.getAttribute('data-show') || 'Reveal');
  },
  
  // Progress bar
  updateProgressBar() {
    const bar = document.querySelector('.progress-bar');
    if (!bar) return;
    const h = document.documentElement;
    const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  },
  
  // Placement scoring
  scorePlacement(lessonId, storageKey) {
    const cards = document.querySelectorAll('#placement .quiz-card');
    let right = 0, total = cards.length;
    const load = () => {
      try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
      catch (e) { return {}; }
    };
    cards.forEach(c => {
      const st = load()[lessonId] || {}; const mcq = st.mcq || {};
      const k = c.getAttribute('data-quiz-key');
      if (mcq[k] !== undefined && mcq[k] === parseInt(c.getAttribute('data-answer'), 10)) right++;
    });
    const box = document.getElementById('placement-result');
    if (!box) return;
    box.classList.add('show');
    let msg;
    if (right <= Math.floor(total / 3)) msg = `Score ${right}/${total} → START HERE. Work this file top to bottom.`;
    else if (right < total) msg = `Score ${right}/${total} → You may skim early sections; focus on patterns + problem set.`;
    else msg = `Score ${right}/${total} → Consider the NEXT level file for a better challenge.`;
    box.innerHTML = '<strong style="color:var(--lvl)">' + msg + '</strong>';
  }
};