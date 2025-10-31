/* script-news.js
   News page script — loads news.json, renders cards, integrates theme/sidebar/modal
*/

(() => {
  /* -------------------------
     SELECTORS / ELEMENTS
  ------------------------- */
  const newsListEl = document.getElementById('newsList');
  const newsEmpty = document.getElementById('newsEmpty');
  const qSearch = document.getElementById('qSearch');
  const filterType = document.getElementById('filterType');
  const tagsContainer = document.getElementById('tagsContainer');
  const clearFiltersBtn = document.getElementById('clearFilters');

  const root = document.documentElement;
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlayEl = document.getElementById('sidebarOverlay');
  const miniName = document.getElementById('miniName');
  const miniAvatar = document.getElementById('miniAvatar');

  const openLogin = document.getElementById('openLogin');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const saveUser = document.getElementById('saveUser');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameInput = document.getElementById('username');

  const themePoints = document.querySelectorAll(".theme-points span");
  const themeMarker = document.getElementById("themeMarker");

  /* state */
  let allNews = [];
  let activeTag = '';
  let activeType = '';
  let searchQ = '';

  /* -------------------------
     UTIL: format date
  ------------------------- */
  function fmtDate(dStr) {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dStr;
    }
  }

  /* -------------------------
     Load JSON (news)
  ------------------------- */
  async function loadNews() {
    try {
      const res = await fetch('JSON-Datastores/news.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('netzwerkfehler');
      const json = await res.json();
      allNews = (json.updates || []).map(n => Object.assign({}, n));
      renderAll();
      buildTagList();
    } catch (err) {
      console.error('Fehler beim Laden news.json', err);
      newsListEl.innerHTML = '<div class="news-empty muted">Fehler beim Laden der News.</div>';
    }
  }

  /* -------------------------
     Render helpers
  ------------------------- */
  function sortNews(list) {
    return list.slice().sort((a,b) => {
      // pinned first
      if ((a.pinned?1:0) !== (b.pinned?1:0)) return (b.pinned?1:0) - (a.pinned?1:0);
      // then date desc
      return new Date(b.date) - new Date(a.date);
    });
  }

  function buildTagList() {
    const tags = new Set();
    allNews.forEach(n => (n.tags || []).forEach(t => tags.add(t)));
    tagsContainer.innerHTML = '';
    Array.from(tags).sort().forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-chip';
      btn.textContent = tag;
      btn.dataset.tag = tag;
      btn.addEventListener('click', () => {
        if (activeTag === tag) activeTag = '';
        else activeTag = tag;
        renderAll();
        highlightActiveTag();
      });
      tagsContainer.appendChild(btn);
    });
    highlightActiveTag();
  }

  function highlightActiveTag() {
    tagsContainer.querySelectorAll('.tag-chip').forEach(el => {
      el.classList.toggle('active', el.dataset.tag === activeTag);
    });
  }

  function filterNews() {
    return allNews.filter(n => {
      if (activeType && n.type !== activeType) return false;
      if (activeTag && !(n.tags || []).includes(activeTag)) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        const inTitle = (n.title || '').toLowerCase().includes(q);
        const inSummary = (n.summary || '').toLowerCase().includes(q);
        const inContent = ( (n.content || []).join(' ') ).toLowerCase().includes(q);
        const inTags = (n.tags || []).join(' ').toLowerCase().includes(q);
        if (!(inTitle || inSummary || inContent || inTags)) return false;
      }
      return true;
    });
  }

  /* -------------------------
     render news list
  ------------------------- */
  function renderAll() {
    const list = sortNews(filterNews());
    newsListEl.innerHTML = '';
    if (!list.length) {
      newsEmpty.classList.remove('hidden');
      return;
    } else {
      newsEmpty.classList.add('hidden');
    }

    list.forEach((n, idx) => {
      const card = document.createElement('article');
      card.className = 'news-card fade-in';
      card.dataset.id = n.id || idx;

      // inner HTML
      card.innerHTML = `
        <div class="news-head">
          <div class="news-left">
            <div>
              <div class="news-date">${fmtDate(n.date)}</div>
            </div>
            <div>
              <h3 class="news-title">${escapeHtml(n.title)}${n.pinned ? ' <span class="pinned-badge">Pinned</span>' : ''}</h3>
              <p class="news-summary">${escapeHtml(n.summary || '')}</p>
            </div>
          </div>
          <div class="news-meta">
            <div class="news-type ${escapeHtml(n.type || '')}">${escapeHtml(n.type || '')}</div>
            <div style="margin-top:8px;">
              <button class="toggle-details" aria-expanded="false">Details ▾</button>
            </div>
          </div>
        </div>

        <div class="news-details" aria-hidden="true">
          <div class="news-body">
            ${Array.isArray(n.content) ? `<ul>${n.content.map(it => `<li>${escapeHtml(it)}</li>`).join('')}</ul>` : `<p>${escapeHtml(n.content || '')}</p>`}
          </div>
        </div>

        <div class="news-foot">
          <div class="news-tags">
            ${(n.tags || []).map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div>
            <small class="muted">ID: ${escapeHtml(n.id || '—')}</small>
          </div>
        </div>
      `;

      // toggle details
      const toggleBtn = card.querySelector('.toggle-details');
      const details = card.querySelector('.news-details');

      toggleBtn.addEventListener('click', () => {
        const open = details.classList.toggle('open');
        if (open) {
          details.style.maxHeight = details.scrollHeight + 24 + 'px';
          toggleBtn.textContent = 'Details ▴';
          toggleBtn.setAttribute('aria-expanded', 'true');
          details.setAttribute('aria-hidden', 'false');
        } else {
          details.style.maxHeight = null;
          toggleBtn.textContent = 'Details ▾';
          toggleBtn.setAttribute('aria-expanded', 'false');
          details.setAttribute('aria-hidden', 'true');
        }
      });

      newsListEl.appendChild(card);
    });

    // observe fade-ins
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  /* -------------------------
     small helper: escapeHtml
  ------------------------- */
  function escapeHtml(str){
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  /* -------------------------
     UI: search / filter bindings
  ------------------------- */
  qSearch?.addEventListener('input', (e) => {
    searchQ = e.target.value.trim();
    renderAll();
  });
  filterType?.addEventListener('change', (e) => {
    activeType = e.target.value;
    renderAll();
  });
  clearFiltersBtn?.addEventListener('click', () => {
    activeTag = '';
    activeType = '';
    searchQ = '';
    qSearch.value = '';
    filterType.value = '';
    highlightActiveTag();
    renderAll();
  });

  /* -------------------------
     build observer for fade-in
  ------------------------- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        observer.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  /* -------------------------
     THEME (same as your other scripts)
  ------------------------- */
  function setTheme(mode) {
    if (mode === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
    localStorage.setItem('gc-theme', mode);

    const indexMap = { auto: 0, light: 1, dark: 2 };
    const index = indexMap[mode] ?? 0;
    if (themeMarker) themeMarker.style.transform = `translateX(${index * 100}%)`;
  }

  themePoints?.forEach(span => {
    span.addEventListener('click', () => setTheme(span.dataset.mode));
  });
  setTheme(localStorage.getItem('gc-theme') || 'auto');
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (localStorage.getItem('gc-theme') === 'auto') setTheme('auto');
    });
  }

  /* -------------------------
     SIDEBAR: toggle + overlay + hide btn
  ------------------------- */
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlayEl.classList.remove('hidden');
      sidebarToggle.classList.add('hide');
    });
    sidebarOverlayEl.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlayEl.classList.add('hidden');
      sidebarToggle.classList.remove('hide');
    });
  }

  /* Swipe handling — horizontal swipe detection prevents vertical scroll */
  let startX = 0, startY = 0, isSwiping = false;
  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const diffX = e.touches[0].clientX - startX;
    const diffY = e.touches[0].clientY - startY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 18) {
      // treat as horizontal swipe — prevent vertical scroll
      e.preventDefault();
      isSwiping = true;
      if (diffX > 70 && !sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
        sidebarOverlayEl.classList.remove('hidden');
        sidebarToggle?.classList.add('hide');
      } else if (diffX < -70 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        sidebarOverlayEl.classList.add('hidden');
        sidebarToggle?.classList.remove('hide');
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', () => { isSwiping = false; });

  /* -------------------------
     LOGIN / STATS modal
  ------------------------- */
  function loadProfileUI() {
    const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
    if (user && user.name) {
      miniName.textContent = user.name;
      miniAvatar.textContent = user.name.charAt(0).toUpperCase();
    } else {
      miniName.textContent = 'GameCircl';
      miniAvatar.textContent = 'G';
    }
  }
  loadProfileUI();

  openLogin?.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    const user = JSON.parse(localStorage.getItem('gc-user') || 'null');
    if (usernameInput) usernameInput.value = user ? user.name : '';
  });

  modalClose?.addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(()=> modal.classList.add('hidden'), 220);
    modal.setAttribute('aria-hidden','true');
  });

  saveUser?.addEventListener('click', () => {
    const name = usernameInput?.value.trim();
    if (!name) return alert('Bitte Name eingeben');
    const user = { name, id: 'u_' + Date.now() };
    localStorage.setItem('gc-user', JSON.stringify(user));
    loadProfileUI();
    modal.classList.remove('show');
    setTimeout(()=> modal.classList.add('hidden'), 220);
  });

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('gc-user');
    loadProfileUI();
  });

  /* -------------------------
     footer year + fade-in observer for initial elements
  ------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  });

  /* -------------------------
     Init
  ------------------------- */
  loadNews();

})();