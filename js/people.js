/* people.js — People page (unified grid + alumni lists)
   Card shows: Name, Role (under name), Description, Icon links, Portrait left
   Outside top bar color varies by level: advisor | phd | ms | ug
*/
(function () {
  const grid = document.getElementById("people-page-list");
  if (!grid) return;

  // build a single icon button (hidden if no link)
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
        <p class="person-role">${p.role || ""}</p>
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

    // OUTSIDE bar wrapper + level label for color
    const wrap = document.createElement("div");
    wrap.className = "person-block";
    wrap.dataset.level = p.level;           // advisor | phd | ms | ug

    const bar = document.createElement("div");
    bar.className = "person-bar";
    bar.setAttribute("aria-hidden", "true");

    wrap.append(bar, article);
    return wrap;
  }

  function alumniLine(a) {
    const s = (a.start || "").trim(), e = (a.end || "").trim();
    let head = a.name;
    if (a.degree) head += ` (${a.degree})`;
    const period = s || e ? `${s}${s && e ? " - " : s ? " - " : ""}${e}` : "";
    const bits = [];
    if (a.co_advisor)       bits.push(`Co-advisor: ${a.co_advisor}`);
    if (a.first_employment) bits.push(`First Employment: ${a.first_employment}`);
    return [head, period && `: ${period}`, bits.length ? `, ${bits.join(", ")}` : ""].join("");
  }

  function renderAlumni(listId, items) {
    const ul = document.getElementById(listId);
    if (!ul) return;
    ul.innerHTML = "";
    items.forEach(a => {
      const li = document.createElement("li");
      li.className = "alumni-item";
      li.textContent = alumniLine(a);
      ul.appendChild(li);
    });
  }

  fetch("json/students.json", { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(data => {
      const out = [];

      // Advisor block
      if (data.advisor && data.advisor.name) {
        out.push({ ...data.advisor, level: "advisor", role: data.advisor.role || "Advisor" });
      }

      // Students — assign level + default role labels
      (data.phd_students || []).forEach(s => out.push({ ...s, level: "phd", role: s.role || "PhD Student" }));
      (data.ms_students  || []).forEach(s => out.push({ ...s, level: "ms",  role: s.role || "MS Student"  }));
      (data.ug_students  || []).forEach(s => out.push({ ...s, level: "ug",  role: s.role || "Undergraduate" }));

      // Render unified people grid
      const frag = document.createDocumentFragment();
      out.forEach(p => frag.appendChild(makeCard(p)));
      grid.replaceChildren(frag);

      // Alumni (grouped, same as before)
      const alumni = data.alumni || [];
      const phdAlumni = alumni.filter(a => /^(phd|ph\.d\.?)/i.test(a.level || ""));
      const msAlumni  = alumni.filter(a => /^(ms|m\.s\.?|masters)/i.test(a.level || ""));
      const ugAlumni  = alumni.filter(a => /^(ug|undergrad(uate)?)/i.test(a.level || ""));
      renderAlumni("alumni-phd-list", phdAlumni);
      renderAlumni("alumni-ms-list",  msAlumni);
      renderAlumni("alumni-ug-list",  ugAlumni);
    })
    .catch(err => {
      console.error("People load error:", err);
      grid.innerHTML = '<p class="muted">Could not load people. Check <code>json/students.json</code>.</p>';
      ["alumni-phd-list","alumni-ms-list","alumni-ug-list"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<li class="muted">Could not load alumni.</li>';
      });
    });
})();
