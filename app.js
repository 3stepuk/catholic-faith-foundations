/* Progress, quiz and notes — all stored in this browser only (localStorage). No network.
   Reading and navigation work without this file; the interactive blocks simply stay hidden. */
(function () {
  var READ = 'cff-sessions-read', SCORES = 'cff-quiz-scores', NOTES = 'cff-notes-';
  document.documentElement.classList.add('js');

  function get(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  document.addEventListener('DOMContentLoaded', function () {
    var read = get(READ, []); if (!Array.isArray(read)) read = [];
    var scores = get(SCORES, {});

    /* ---- Course map ---- */
    var items = document.querySelectorAll('[data-session]');
    var line = document.querySelector('[data-progress]');
    if (items.length) {
      var count = 0;
      items.forEach(function (li) {
        var id = li.getAttribute('data-session');
        if (read.indexOf(id) > -1) { li.classList.add('is-read'); count++; }
        if (scores[id]) {
          var meta = li.querySelector('.meta');
          if (meta) meta.appendChild(document.createTextNode(' · Quiz ' + scores[id].score + ' of ' + scores[id].total));
        }
      });
      if (line) line.innerHTML = '<b>' + count + '</b> of ' + items.length + ' session' + (items.length === 1 ? '' : 's') + ' read';
    }

    /* ---- Mark as read ---- */
    var btn = document.querySelector('[data-mark]');
    if (btn) {
      var slug = btn.getAttribute('data-mark');
      var paint = function () {
        var on = get(READ, []).indexOf(slug) > -1;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.textContent = on ? 'Read' : 'Mark as read';
      };
      btn.addEventListener('click', function () {
        var list = get(READ, []), i = list.indexOf(slug);
        if (i > -1) list.splice(i, 1); else list.push(slug);
        set(READ, list); paint();
      });
      paint();
    }

    /* ---- Fill-in-the-blank dropdowns ---- */
    document.querySelectorAll('[data-fill]').forEach(function (box) {
      var fb = box.querySelector('.feedback');
      box.querySelector('.check-btn').addEventListener('click', function () {
        var ok = true, empty = false;
        box.querySelectorAll('select').forEach(function (s) {
          s.classList.remove('wrong');
          if (!s.value) { empty = true; ok = false; return; }
          if (s.value !== s.getAttribute('data-answer')) { ok = false; s.classList.add('wrong'); }
        });
        fb.textContent = empty ? 'Choose a word in each box first.'
          : ok ? 'Correct.' : 'Not quite. Change the crossed-out word and check again.';
        fb.classList.toggle('good', ok && !empty);
      });
    });

    /* ---- Quiz ---- */
    var quiz = document.querySelector('[data-quiz]');
    if (quiz) {
      var qid = quiz.getAttribute('data-quiz');
      var qs = quiz.querySelectorAll('li.q');
      var res = quiz.querySelector('.result');
      var showSaved = function () {
        var s = get(SCORES, {})[qid];
        if (s) res.textContent = 'Last score: ' + s.score + ' of ' + s.total + '.';
      };
      showSaved();

      quiz.querySelector('[data-quiz-check]').addEventListener('click', function () {
        var score = 0, missing = 0;
        qs.forEach(function (li) {
          var fb = li.querySelector('.fb'), chosen = li.querySelector('input:checked');
          fb.classList.remove('good');
          if (!chosen) { missing++; fb.textContent = ''; return; }
          var good = chosen.hasAttribute('data-correct');
          if (good) { score++; fb.classList.add('good'); }
          fb.textContent = good ? 'Correct.' : 'Not quite. ' + li.getAttribute('data-hint');
        });
        if (missing) { res.classList.remove('good'); res.textContent = 'Answer every question, then check.'; return; }
        var all = get(SCORES, {}); all[qid] = { score: score, total: qs.length }; set(SCORES, all);
        res.classList.toggle('good', score === qs.length);
        res.textContent = 'You scored ' + score + ' of ' + qs.length + '.' + (score === qs.length ? '' : ' Reread the sections named above and try again.');
      });

      quiz.querySelector('[data-quiz-reset]').addEventListener('click', function () {
        quiz.querySelectorAll('input').forEach(function (i) { i.checked = false; });
        quiz.querySelectorAll('.fb').forEach(function (f) { f.textContent = ''; f.classList.remove('good'); });
        res.classList.remove('good'); showSaved();
      });
    }

    /* ---- Private notes ---- */
    document.querySelectorAll('[data-notes]').forEach(function (ta) {
      var key = NOTES + ta.getAttribute('data-notes');
      ta.value = get(key, '');
      ta.addEventListener('input', function () { set(key, ta.value); });
    });


    /* ---- Single reflection note (data-note) ---- */
    document.querySelectorAll('[data-note]').forEach(function (ta) {
      var key = NOTES + ta.getAttribute('data-note');
      ta.value = get(key, '');
      ta.addEventListener('input', function () { set(key, ta.value); });
    });

    /* ---- Self-check ticks (data-check) ---- */
    document.querySelectorAll('input[data-check]').forEach(function (cb) {
      var key = 'cff-check-' + cb.getAttribute('data-check');
      cb.checked = get(key, false) === true;
      cb.addEventListener('change', function () { set(key, cb.checked); });
    });
    /* ---- Print: open every collapsible ---- */
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('details').forEach(function (d) { d.open = true; });
    });
  });
})();
