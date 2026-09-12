/* SQL Language Switcher
   Generated from language-config.json - DO NOT EDIT DIRECTLY */
(function () {
  var KEY = 'sql_lms_lang_v1';
  var DEFAULT = 'sql';
  var LANGUAGES = [
  {
    "id": "sql",
    "label": "SQL (ANSI)",
    "ext": ".sql",
    "highlight": "sql",
    "group": "SQL Dialects"
  },
  {
    "id": "pg",
    "label": "PostgreSQL",
    "ext": ".sql",
    "highlight": "sql",
    "group": "SQL Dialects"
  },
  {
    "id": "mysql",
    "label": "MySQL",
    "ext": ".sql",
    "highlight": "sql",
    "group": "SQL Dialects"
  },
  {
    "id": "py-pandas",
    "label": "Python (pandas)",
    "ext": ".py",
    "highlight": "python",
    "group": "Python"
  },
  {
    "id": "py-sqlalchemy",
    "label": "Python (SQLAlchemy)",
    "ext": ".py",
    "highlight": "python",
    "group": "Python"
  }
];
  var GROUPS = {
  "SQL Dialects": [
    {
      "id": "sql",
      "label": "SQL (ANSI)",
      "ext": ".sql",
      "highlight": "sql",
      "group": "SQL Dialects"
    },
    {
      "id": "pg",
      "label": "PostgreSQL",
      "ext": ".sql",
      "highlight": "sql",
      "group": "SQL Dialects"
    },
    {
      "id": "mysql",
      "label": "MySQL",
      "ext": ".sql",
      "highlight": "sql",
      "group": "SQL Dialects"
    }
  ],
  "Python": [
    {
      "id": "py-pandas",
      "label": "Python (pandas)",
      "ext": ".py",
      "highlight": "python",
      "group": "Python"
    },
    {
      "id": "py-sqlalchemy",
      "label": "Python (SQLAlchemy)",
      "ext": ".py",
      "highlight": "python",
      "group": "Python"
    }
  ]
};
  var started = false;

  function apply(langId) {
    if (typeof document === 'undefined') return;
    var lang = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0];
    document.body.setAttribute('data-lang', lang.id);
    document.body.setAttribute('data-lang-label', lang.label);
    
    // Update tabs (desktop)
    document.querySelectorAll('.lang-tabs button').forEach(function(btn) {
      btn.classList.toggle('on', btn.getAttribute('data-lang') === langId);
    });
    
    // Update dropdown (mobile)
    var trigger = document.querySelector('.lang-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.querySelector('.lang-current').textContent = lang.label;
    }
    document.querySelectorAll('.lang-dropdown li').forEach(function(li) {
      li.classList.toggle('active', li.getAttribute('data-lang') === langId);
    });
    document.querySelector('.lang-dropdown')?.setAttribute('aria-hidden', 'true');
    
    try { localStorage.setItem(KEY, langId); } catch (e) {}
  }

  function init() {
    if (started) return; started = true;
    var saved = DEFAULT;
    try { saved = localStorage.getItem(KEY) || DEFAULT; } catch (e) {}
    
    // Build tabs (desktop)
    var tabsContainer = document.querySelector('.lang-tabs');
    if (tabsContainer) {
      tabsContainer.innerHTML = LANGUAGES.map(function(l) {
        return '<button data-lang="' + l.id + '" class="' + (l.id === saved ? 'on' : '') + '">' + l.label + '</button>';
      }).join('');
      tabsContainer.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function() { apply(btn.getAttribute('data-lang')); });
      });
    }
    
    // Build dropdown (mobile)
    var dropdown = document.querySelector('.lang-dropdown');
    var trigger = document.querySelector('.lang-trigger');
    if (dropdown && trigger) {
      var currentLang = LANGUAGES.find(l => l.id === saved) || LANGUAGES[0];
      trigger.querySelector('.lang-current').textContent = currentLang.label;
      
      dropdown.innerHTML = Object.entries(GROUPS).flatMap(function([group, langs]) {
        return [
          '<li class="lang-group" style="padding:4px 16px;font-size:9px;color:var(--text-dim);text-transform:uppercase;">' + group + '</li>',
          ...langs.map(function(l) {
            return '<li data-lang="' + l.id + '" class="' + (l.id === saved ? 'active' : '') + '">' + l.label + '</li>';
          })
        ];
      }).join('');
      
      dropdown.querySelectorAll('li[data-lang]').forEach(function(li) {
        li.addEventListener('click', function() {
          apply(li.getAttribute('data-lang'));
        });
      });
      
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !expanded);
        dropdown.setAttribute('aria-hidden', expanded);
      });
      
      document.addEventListener('click', function() {
        trigger.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
      });
    }
    
    // Keyboard shortcut: Ctrl+Shift+L cycles languages
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        var idx = LANGUAGES.findIndex(l => l.id === saved);
        var next = LANGUAGES[(idx + 1) % LANGUAGES.length].id;
        apply(next);
      }
    });
    
    apply(saved);
  }

  if (typeof window !== 'undefined') { window.initLangToggle = init; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
