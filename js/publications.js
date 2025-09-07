/* publications.js — grouped by year (newest → oldest)
   Item fields:
   authors (array|string), title, venue|conference, year, github, paper, website|project, image
*/
(function () {
  const root = document.getElementById('pub-list');
  if (!root) return;

  const toAuthors = (a) => (!a ? "" : Array.isArray(a) ? a.join(", ") : String(a));

  function openExt(a, href) {
    a.href = href;
    if (/^https?:\/\//i.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
  }

  function makeIcon(href, label, glyph) {
    if (!href) return null;
    const a = document.createElement('a');
    a.className = 'icon-btn';
    a.setAttribute('aria-label', label);
    a.textContent = glyph;
    openExt(a, href);
    return a;
  }

  function buildCard(it) {
    const card = document.createElement('article');
    card.className = 'pub-card' + (it.image ? '' : ' no-thumb');

    // left
    const main = document.createElement('div');
    main.className = 'pub-main';

    const h3 = document.createElement('h3');
    h3.className = 'pub-title';

    h3.textContent = it.title || '';


    const meta = document.createElement('p');
    meta.className = 'pub-meta';
    const authors = toAuthors(it.authors);
    const venue = it.venue || it.conference || '';
    const year  = it.year ? String(it.year) : '';
    meta.textContent = [authors, venue, year].filter(Boolean).join(' — ');

    const links = document.createElement('div');
    links.className = 'pub-links';
    const github = makeIcon(it.github,  'GitHub repository', '🐙');
    const paper  = makeIcon(it.paper,   'Paper',              '📄');
    const site   = makeIcon(it.website || it.project, 'Project page', '🔗');
    [github, paper, site].forEach((el) => el && links.appendChild(el));

    main.append(h3, meta, links);
    card.appendChild(main);

    // right
    if (it.image) {
      const aside = document.createElement('div');
      aside.className = 'pub-aside';
      const img = document.createElement('img');
      img.className = 'pub-thumb';
      img.src = it.image;
      img.alt = it.title ? `Thumbnail for ${it.title}` : 'Publication thumbnail';
      img.loading = 'lazy';
      img.decoding = 'async';
      aside.appendChild(img);
      card.appendChild(aside);
    }

    return card;
  }

  fetch('json/publications.json', { cache: 'no-cache' })
    .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then((data) => {
      const items = Array.isArray(data) ? data : (data.publications || []);
      // bucket by year
      const buckets = new Map(); // year(string) -> array
      const others  = [];        // missing/invalid year
      items.forEach((it) => {
        const y = parseInt(it.year, 10);
        if (!isFinite(y)) { others.push(it); return; }
        const key = String(y);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(it);
      });

      // sort years desc
      const years = Array.from(buckets.keys()).map(Number).sort((a,b)=>b-a).map(String);
      root.innerHTML = '';

      years.forEach((y) => {
        const section = document.createElement('section');
        section.className = 'pub-year';
        section.setAttribute('aria-labelledby', `pub-y-${y}`);

        const h2 = document.createElement('h2');
        h2.className = 'pub-year-heading';
        h2.id = `pub-y-${y}`;
        h2.textContent = y;

        const wrap = document.createElement('div');
        wrap.className = 'pub-year-list'; // vertical stack

        // within same year, keep input order (or sort if you prefer)
        buckets.get(y).forEach((it) => wrap.appendChild(buildCard(it)));

        section.append(h2, wrap);
        root.appendChild(section);
      });

      if (others.length) {
        const section = document.createElement('section');
        section.className = 'pub-year';
        section.setAttribute('aria-labelledby', `pub-y-other`);

        const h2 = document.createElement('h2');
        h2.className = 'pub-year-heading';
        h2.id = 'pub-y-other';
        h2.textContent = 'Other';

        const wrap = document.createElement('div');
        wrap.className = 'pub-year-list';
        others.forEach((it) => wrap.appendChild(buildCard(it)));

        section.append(h2, wrap);
        root.appendChild(section);
      }
    })
    .catch((err) => {
      console.error('Publications load error:', err);
      root.innerHTML = '<p class="muted">Could not load publications. Check <code>publications.json</code>.</p>';
    });
})();
