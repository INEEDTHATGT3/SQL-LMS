/* Progress Tracker for Skill
   Generated from quota-config.json - DO NOT EDIT DIRECTLY */
(function () {
  var KEY = 'sql_lms_progress_v1';
  
  function load() { 
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } 
    catch (e) { return {}; } 
  }
  
  function save(d) { 
    try { localStorage.setItem(KEY, JSON.stringify(d)); } 
    catch (e) {} 
  }
  
  function initReveals() {
    document.querySelectorAll('.reveal-btn').forEach(function (btn) {
      if (btn.dataset.bound) return; btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var t = document.getElementById(btn.getAttribute('data-target'));
        if (!t) return;
        t.classList.toggle('open');
        btn.textContent = t.classList.contains('open') 
          ? (btn.getAttribute('data-hide') || 'Hide') 
          : (btn.getAttribute('data-show') || 'Reveal');
      });
    });
  }
  
  function initQuizzes(lessonId) {
    document.querySelectorAll('.quiz-card[data-quiz-key]').forEach(function (card) {
      if (card.dataset.bound) return; card.dataset.bound = '1';
      var qkey = card.getAttribute('data-quiz-key');
      var opts = card.querySelectorAll('.quiz-opt');
      var explain = card.querySelector('.quiz-explain');
      var scoreEl = card.querySelector('.quiz-score');
      var answer = parseInt(card.getAttribute('data-answer'), 10);
      var state = load()[lessonId] || {};
      state.mcq = state.mcq || {};
      
      function lock(choice) {
        opts.forEach(function (o, i) {
          o.classList.add('locked');
          if (i === answer) o.classList.add('correct');
          else if (i === choice) o.classList.add('wrong');
        });
        if (explain) explain.classList.add('show');
        if (scoreEl) scoreEl.textContent = (choice === answer ? '✔ CORRECT' : '✘ INCORRECT — see explanation');
      }
      
      opts.forEach(function (o, i) {
        o.addEventListener('click', function () {
          if (o.classList.contains('locked')) return;
          state.mcq[qkey] = i;
          var all = load(); all[lessonId] = state; save(all);
          lock(i);
        });
        if (state.mcq[qkey] !== undefined) lock(state.mcq[qkey]);
      });
      
      // Placement quiz aggregate scoring
      if (card.closest('#placement')) {
        card.addEventListener('click', function () {
          setTimeout(function () {
            var cards = document.querySelectorAll('#placement .quiz-card');
            var right = 0, total = cards.length;
            cards.forEach(function (c) {
              var st = load()[lessonId] || {}; var mcq = st.mcq || {};
              var k = c.getAttribute('data-quiz-key');
              if (mcq[k] !== undefined && mcq[k] === parseInt(c.getAttribute('data-answer'), 10)) right++;
            });
            var box = document.getElementById('placement-result');
            if (!box) return;
            box.classList.add('show');
            var msg;
            if (right <= Math.floor(total / 3)) msg = 'Score ' + right + '/' + total + ' → START HERE. Work this file top to bottom.';
            else if (right < total) msg = 'Score ' + right + '/' + total + ' → You may skim early sections; focus on patterns + problem set.';
            else msg = 'Score ' + right + '/' + total + ' → Consider the NEXT level file for a better challenge.';
            box.innerHTML = '<strong style="color:var(--lvl)">' + msg + '</strong>';
          }, 60);
        });
      }
    });
  }
  
  function initSolved(lessonId) {
    document.querySelectorAll('.solved-check input[type=checkbox]').forEach(function (cb) {
      if (cb.dataset.bound) return; cb.dataset.bound = '1';
      var pid = cb.getAttribute('data-pid');
      var st = (load()[lessonId] || {});
      cb.checked = !!(st.solved && st.solved[pid]);
      cb.addEventListener('change', function () {
        var all = load(); var s = (all[lessonId] = all[lessonId] || {});
        s.solved = s.solved || {}; s.solved[pid] = cb.checked; save(all);
      });
    });
  }
  
  function initComplete(lessonId) {
    var btn = document.getElementById('mark-complete');
    if (!btn || btn.dataset.bound) return; btn.dataset.bound = '1';
    function paint() {
      var done = !!((load()[lessonId] || {}).complete);
      btn.classList.toggle('done', done);
      btn.textContent = done ? '✓ COMPLETED' : 'MARK ARTIFACT COMPLETE';
      document.querySelectorAll('.level-pill').forEach(function (p) {
        var id = p.getAttribute('data-lesson');
        if (id && ((load()[id] || {}).complete)) p.classList.add('done');
      });
    }
    btn.addEventListener('click', function () {
      var all = load(); var s = (all[lessonId] = all[lessonId] || {});
      s.complete = !s.complete; save(all); paint();
    });
    paint();
  }
  
  function initProgressBar() {
    var bar = document.querySelector('.progress-bar');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var h = document.documentElement;
      var pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }, { passive: true });
  }
  
  window.initRecall = function (lessonId) {
    initReveals(); initQuizzes(lessonId); initSolved(lessonId);
    initComplete(lessonId); initProgressBar();
  };
})();
