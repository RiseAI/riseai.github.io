/* index-people.js — home People (Advisor + PhD students) */
(function () {
  const mount = document.getElementById("people-list");
  if (!mount) return;

  function icon(href, aria, glyph) {
    if (!href || href === "#" || href === "sample") return null;
    const a = document.createElement("a");
    a.className = "icon-btn";
    a.setAttribute("aria-label", aria);
    a.textContent = glyph;
    a.href = aria === "Email" && !/^mailto:/i.test(href) ? `mailto:${href}` : href;
    if (/^https?:\/\//i.test(a.href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    return a;
  }

  function makeCard(p) {
    const article = document.createElement("article");
    article.className = "person-card row";

    article.innerHTML = `
      <div class="person-media">
        <img class="portrait" src="${p.img || 'images/people/placeholder.jpg'}"
             alt="Portrait of ${p.name}" loading="lazy" decoding="async">
      </div>
      <div class="person-info">
        <h3 class="person-name">${p.name}</h3>
        ${p.role ? `<p class="person-role">${p.role}</p>` : `<p class="person-role"></p>`}
        <p class="person-bio">${p.description || ""}</p>
        <div class="person-links" aria-label="Links for ${p.name}"></div>
      </div>
    `;

    const links = article.querySelector(".person-links");
    [ icon(p.email,"Email","📫︎"),
      icon(p.scholar,"Google Scholar","🎓"),
      icon(p.github,"GitHub","🐙"),
      icon(p.website,"Homepage","🏠") ]
      .forEach(el => el && links.appendChild(el));

    // Wrap with the OUTSIDE bar
    const wrap = document.createElement("div");
    wrap.className = "person-block";
    const bar = document.createElement("div");
    bar.className = "person-bar";
    bar.setAttribute("aria-hidden", "true");
    wrap.append(bar, article);
    return wrap;
  }

  fetch("json/students.json", { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(data => {
      // Default roles where missing
      const phds = (data.phd_students || []).map(s => ({
        ...s,
        role: s.role || "PhD Student"
      }));

      const list = [];
      if (data.advisor && data.advisor.name) {
        list.push({ ...data.advisor, role: data.advisor.role || "Advisor" });
      }
      list.push(...phds);

      const frag = document.createDocumentFragment();
      list.forEach(p => frag.appendChild(makeCard(p)));
      mount.replaceChildren(frag);
    })
    .catch(err => {
      console.error("People load error:", err);
      mount.innerHTML = '<p class="muted">Could not load people. Check <code>json/students.json</code>.</p>';
    });
})();
