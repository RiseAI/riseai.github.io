/* news.js — load local news.json and render .news-list
   Supports "YYYY", "YYYY-MM", "YYYY-MM-DD"
   Renders "Aug, 2025" when day is missing (no timezone shifts)
*/
(function () {
  const list = document.querySelector('.news-list');
  if (!list) return;
  const limit = Number(list.dataset.limit || Infinity);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function parseDateParts(s) {
    if (!s) return null;
    const m = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(String(s).trim());
    if (!m) return null;
    const y = parseInt(m[1], 10);
    const mm = m[2] ? parseInt(m[2], 10) : null;
    const dd = m[3] ? parseInt(m[3], 10) : null;
    return { y, m: mm, d: dd };
  }

  function displayDate(parts) {
    if (!parts) return "";
    const { y, m, d } = parts;
    if (m && d) return `${MONTHS[m - 1]} ${d}, ${y}`;
    if (m)     return `${MONTHS[m - 1]}, ${y}`;
    return String(y);
  }

  // Sort without Date(); missing month/day sort earlier in that year
  function sortKey(parts) {
    if (!parts) return -Infinity;
    return (parts.y || 0) * 10000 + (parts.m || 0) * 100 + (parts.d || 0);
  }

  fetch('json/news.json', { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then((data) => {
      const items = Array.isArray(data) ? data : (data.news || []);
      const enriched = items.map((it) => {
        const parts = parseDateParts(it.date);
        return { ...it, _parts: parts, _key: sortKey(parts) };
      });

      enriched.sort((a, b) => b._key - a._key);
      list.innerHTML = '';

      enriched.slice(0, limit).forEach((it) => {
        const article = document.createElement('article');
        article.className = 'news-item';

        const time = document.createElement('time');
        if (it.date) time.setAttribute('datetime', it.date); // keep original "YYYY-MM"
        time.textContent = displayDate(it._parts) || (it.date || '');

        const h3 = document.createElement('h3');
        if (it.url) {
          const a = document.createElement('a');
          a.href = it.url;
          a.textContent = it.title || '';
          h3.appendChild(a);
        } else {
          h3.textContent = it.title || '';
        }

        const p = document.createElement('p');
        p.textContent = it.summary || '';

        article.append(time, h3, p);
        list.appendChild(article);
      });
    })
    .catch((err) => {
      list.innerHTML = '<p style="color: var(--muted)">Could not load news. Check <code>news.json</code>.</p>';
      console.error('News load error:', err);
    });
})();
