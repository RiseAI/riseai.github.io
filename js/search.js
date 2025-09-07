// js/search.js
(() => {
  const input = document.getElementById('site-search');
  const button = document.getElementById('site-search-btn');
  const panel = document.getElementById('search-panel');
  const clearBtn = document.getElementById('site-search-clear');  
  if (!input || !panel) return;

  // Adjust these paths if your JSONs live elsewhere (e.g., 'data/people.json')
  const SOURCE_URLS = {
    people: 'people.json',
    publications: 'publications.json',
    news: 'news.json',
  };

  let INDEX = [];     // unified: {type,title,subtitle,url,raw}
  let open = false;
  let activeIndex = -1;

  // Fetch all sources (gracefully ignore missing files)
  Promise.all([
    fetch(SOURCE_URLS.people).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(SOURCE_URLS.publications).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(SOURCE_URLS.news).then(r => r.ok ? r.json() : []).catch(() => []),
  ]).then(([people, pubs, news]) => {
    const norm = [];

    // People
    if (Array.isArray(people)) {
      for (const p of people) {
        const title = p.name || p.title || '';
        if (!title) continue;
        norm.push({
          type: 'People',
          title,
          subtitle: [p.role, p.position, p.affiliation].filter(Boolean).join(' · '),
          url: p.url || 'people.html',
          raw: p,
        });
      }
    }

    // Publications
    if (Array.isArray(pubs)) {
      for (const x of pubs) {
        const title = x.title || '';
        if (!title) continue;
        const sub = [x.authors, x.conference, x.year].filter(Boolean).join(' · ');
        norm.push({
          type: 'Publications',
          title,
          subtitle: sub,
          url: x.paper || x.github || 'publications.html',
          raw: x,
        });
      }
    }

    // News
    if (Array.isArray(news)) {
      for (const n of news) {
        const title = n.title || n.headline || '';
        if (!title) continue;
        norm.push({
          type: 'News',
          title,
          subtitle: n.date || '',
          url: n.link || 'news.html',
          raw: n,
        });
      }
    }

    INDEX = norm;
  });

  // Simple scorer: title hits weigh more than subtitle
  function scoreItem(item, q) {
    const T = item.title.toLowerCase();
    const S = (item.subtitle || '').toLowerCase();
    const wTitle = T.includes(q) ? 3 : 0;
    const wSub = S.includes(q) ? 1 : 0;
    return wTitle + wSub;
  }

  // Escape HTML
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Highlight matches
  function hi(text, q) {
    if (!q) return esc(text);
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return esc(text).replace(re, '<mark>$1</mark>');
  }

  function render(results, q) {
    panel.innerHTML = '';
    if (!results.length) {
      panel.innerHTML = `<div class="search-panel"><div class="search-empty">No results</div></div>`;
      panel.hidden = false;
      open = true;
      activeIndex = -1;
      return;
    }

    const header = `<header>Search results</header>`;
    const items = results.map((r, i) => {
      return `
        <a class="search-item" href="${r.url}" data-idx="${i}" role="option">
          <h4>${hi(r.title, q)}</h4>
          <div class="search-meta">
            <span class="badge">${r.type}</span>
            <span>${hi(r.subtitle || '', q)}</span>
          </div>
        </a>
      `;
    }).join('');

    panel.innerHTML = `${header}<div class="search-results" role="listbox">${items}</div>`;
    panel.hidden = false;
    open = true;
    activeIndex = -1;

    // mouse/keyboard selection
    [...panel.querySelectorAll('.search-item')].forEach((el, i) => {
      el.addEventListener('mousemove', () => setActive(i));
    });
  }

  function setActive(i) {
    const items = panel.querySelectorAll('.search-item');
    items.forEach(el => el.setAttribute('aria-selected', 'false'));
    if (items[i]) {
      items[i].setAttribute('aria-selected', 'true');
      items[i].scrollIntoView({ block: 'nearest' });
      activeIndex = i;
    }
  }

  function topResultNavigate() {
    const first = panel.querySelector('.search-item');
    if (first) window.location.assign(first.getAttribute('href'));
  }

  function doSearch() {
    const q = input.value.trim().toLowerCase();
    if (clearBtn) clearBtn.hidden = (q.length === 0);   
    if (!q) { closePanel(); return; }
    const results = INDEX
      .map(item => ({ item, s: scoreItem(item, q) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || a.item.title.localeCompare(b.item.title))
      .slice(0, 12)
      .map(x => x.item);
    render(results, q);
  }

  function closePanel() {
    panel.hidden = true;
    panel.innerHTML = '';
    if (clearBtn) clearBtn.hidden = (input.value.trim().length === 0);  // NEW
    open = false;
    activeIndex = -1;
  }

  // Events
  input.addEventListener('input', doSearch);
  input.addEventListener('focus', () => { if (input.value.trim()) doSearch(); });
  button.addEventListener('click', (e) => { e.preventDefault(); doSearch(); });

  // Keyboard: arrows + enter + esc
  input.addEventListener('keydown', (e) => {
    if (!open) return;
    const items = panel.querySelectorAll('.search-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(items.length - 1, activeIndex + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(0, activeIndex - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        window.location.assign(items[activeIndex].getAttribute('href'));
      } else {
        topResultNavigate();
      }
    } else if (e.key === 'Escape') {
      closePanel();
      input.blur();
    }
  });
  // show/hide clear on typing and focus
  input.addEventListener('input', () => {
    if (clearBtn) clearBtn.hidden = (input.value.trim().length === 0);
  });
  input.addEventListener('focus', () => {
    if (clearBtn) clearBtn.hidden = (input.value.trim().length === 0);
  });

  // clear behavior
  clearBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    input.value = '';
    if (clearBtn) clearBtn.hidden = true;
    closePanel();
    input.focus();
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    const within = e.target === input || panel.contains(e.target) || e.target === button;
    if (!within) closePanel();
  });

})();
