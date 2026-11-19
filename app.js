/**
 * Yazı Tasarımcıları ve Yazıevleri — Türkiye (app.js)
 * Türkçe Tipografi Topluluğu
 * 
 * İstemci taraflı canlı arama, kategori süzgeci, alfabetik sıralama,
 * harf ayraçları ve yapışkan harf indeksi, vitrin/liste görünüm motoru.
 */

(() => {
  "use strict";

  const DATA_URL = "./data/index.json";
  const THEME_STORAGE_KEY_INDEX = "tipografi-index-theme";
  const THEME_STORAGE_KEY_ARCHIVE = "tipografi-archive-theme";
  const VIEW_STORAGE_KEY = "tipografi-index-view";

  const SUN_SVG = `<circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>`;
  const MOON_SVG = `<path d="M20.1 15.2A8.4 8.4 0 0 1 8.8 3.9 8.5 8.5 0 1 0 20.1 15.2Z"/>`;

  // App State: 'loading' | 'ready' | 'error'
  let appState = "loading";

  // Data & Filter State
  let allItems = [];
  let currentResults = [];
  let activeQuery = "";
  let activeCategory = "all"; // 'all' | 'designer' | 'foundry'
  let activeSort = "name-asc"; // 'name-asc' | 'name-desc' | 'default'
  let activeView = "grid"; // 'grid' | 'list'
  let activeLetterInView = "";

  // Scroll & Offset State
  let cachedLetterOffsets = [];
  let isClickScrolling = false;
  let clickScrollTimer = null;
  let scrollTicking = false;

  // DOM Elements
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const searchInput = document.getElementById("search-input");
  const searchClearBtn = document.getElementById("search-clear-btn");
  const categorySegmented = document.getElementById("category-segmented");
  const sortSelect = document.getElementById("sort-select");
  const directoryList = document.getElementById("directory-list");
  const statusContainer = document.getElementById("status-container");
  const resultSummary = document.getElementById("result-summary");
  const viewGridBtn = document.getElementById("view-grid-btn");
  const viewListBtn = document.getElementById("view-list-btn");
  const letterIndexRail = document.getElementById("letter-index-rail");
  const mobileLetterStrip = document.getElementById("mobile-letter-strip");
  const heroUpdatedAt = document.getElementById("hero-updated-at");
  const toolbarWrapper = document.getElementById("dizin-toolbar-section");

  // Stat Elements
  const countAll = document.getElementById("count-all");
  const countDesigners = document.getElementById("count-designers");
  const countFoundries = document.getElementById("count-foundries");

  // Reduced Motion Helper
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function getScrollBehavior() {
    return reducedMotionQuery.matches ? "auto" : "smooth";
  }

  // -------------------------------------------------------------
  // Theme Management (Synchronized across both archive & index)
  // -------------------------------------------------------------

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getActiveTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  function updateThemeUI(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (!themeIcon || !themeToggleBtn) return;
    if (theme === "dark") {
      themeIcon.innerHTML = SUN_SVG;
      themeToggleBtn.setAttribute("aria-label", "Açık moda geç");
      themeToggleBtn.setAttribute("title", "Açık moda geç");
    } else {
      themeIcon.innerHTML = MOON_SVG;
      themeToggleBtn.setAttribute("aria-label", "Koyu moda geç");
      themeToggleBtn.setAttribute("title", "Koyu moda geç");
    }
  }

  function toggleTheme() {
    const next = getActiveTheme() === "dark" ? "light" : "dark";
    updateThemeUI(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY_ARCHIVE, next);
      localStorage.setItem(THEME_STORAGE_KEY_INDEX, next);
    } catch (e) {
      /* ignore */
    }
  }

  function initTheme() {
    const theme = getActiveTheme();
    updateThemeUI(theme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", toggleTheme);
    }

    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY_ARCHIVE) && !localStorage.getItem(THEME_STORAGE_KEY_INDEX)) {
          updateThemeUI(e.matches ? "dark" : "light");
        }
      });
    } catch (e) {
      /* ignore */
    }
  }

  // -------------------------------------------------------------
  // String & Turkish Normalization Utilities
  // -------------------------------------------------------------

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeForMatch(text) {
    if (!text) return "";
    return text
      .toLocaleLowerCase("tr-TR")
      .replace(/ı/g, "i")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  }

  function textContainsQuery(text, query) {
    if (!text || !query) return false;
    const normText = normalizeForMatch(text);
    const normQuery = normalizeForMatch(query);
    if (!normQuery) return false;
    return normText.includes(normQuery);
  }

  const TURKISH_HIGHLIGHT_MAP = {
    c: "[cçCÇ]",
    ç: "[cçCÇ]",
    g: "[gğGĞ]",
    ğ: "[gğGĞ]",
    i: "[iıİI]",
    ı: "[iıİI]",
    o: "[oöOÖ]",
    ö: "[oöOÖ]",
    s: "[sşSŞ]",
    ş: "[sşSŞ]",
    u: "[uüUÜ]",
    ü: "[uüUÜ]",
  };

  function buildTurkishHighlightPattern(term) {
    let pattern = "";
    for (const ch of term) {
      const lower = ch.toLocaleLowerCase("tr-TR");
      if (TURKISH_HIGHLIGHT_MAP[lower]) {
        pattern += TURKISH_HIGHLIGHT_MAP[lower];
      } else {
        pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }
    return pattern;
  }

  function highlightMatches(text, query) {
    if (!text) return "";
    const escaped = escapeHtml(text);
    if (!query) return escaped;

    const trimmed = query.trim();
    if (!trimmed) return escaped;

    const terms = trimmed.split(/\s+/).filter(Boolean);
    if (!terms.length) return escaped;

    const pattern = terms.map(buildTurkishHighlightPattern).join("|");
    try {
      const reg = new RegExp(`(${pattern})`, "gi");
      return escaped.replace(reg, '<mark class="search-hit">$1</mark>');
    } catch (e) {
      return escaped;
    }
  }

  function getMonogram(name) {
    if (!name) return "TT";
    const clean = name.replace(/\(.*?\)/g, "").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr-TR");
    }
    return clean.slice(0, 2).toLocaleUpperCase("tr-TR");
  }

  function getInitialLetter(name) {
    if (!name) return "#";
    const clean = name.trim();
    const first = clean.charAt(0).toLocaleUpperCase("tr-TR");
    if (/^[A-ZÇĞİIÖŞÜ]$/i.test(first)) {
      return first;
    }
    return "#";
  }

  function formatTurkishDate(dateStr) {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  }

  // -------------------------------------------------------------
  // Dynamic Sticky Offset Calculation (ResizeObserver)
  // -------------------------------------------------------------

  function updateStickyOffset() {
    let offset = 0;
    const isMobile = window.matchMedia("(max-width: 1100px)").matches;
    if (!isMobile) {
      if (toolbarWrapper) {
        offset = toolbarWrapper.getBoundingClientRect().height;
      }
    } else {
      if (mobileLetterStrip && mobileLetterStrip.offsetParent !== null && mobileLetterStrip.children.length > 0) {
        offset = mobileLetterStrip.getBoundingClientRect().height;
      }
    }
    document.documentElement.style.setProperty("--sticky-offset", `${Math.round(offset)}px`);
    updateCachedLetterOffsets();
    computeActiveLetterFromScroll();
  }

  function initStickyOffsetObserver() {
    updateStickyOffset();

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => {
        updateStickyOffset();
      });
      if (toolbarWrapper) ro.observe(toolbarWrapper);
      if (mobileLetterStrip) ro.observe(mobileLetterStrip);
      if (directoryList) ro.observe(directoryList);
    }

    try {
      const mql = window.matchMedia("(max-width: 1100px)");
      if (mql.addEventListener) {
        mql.addEventListener("change", updateStickyOffset);
      } else if (mql.addListener) {
        mql.addListener(updateStickyOffset);
      }
    } catch (e) {
      /* ignore */
    }

    window.addEventListener("resize", updateStickyOffset, { passive: true });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateStickyOffset);
    }
  }

  // -------------------------------------------------------------
  // Data Loading & State Management
  // -------------------------------------------------------------

  async function loadData() {
    appState = "loading";
    if (directoryList) {
      directoryList.setAttribute("aria-busy", "true");
    }
    if (resultSummary) {
      resultSummary.textContent = "Yükleniyor...";
    }
    if (statusContainer) {
      statusContainer.innerHTML = "";
    }

    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) {
        throw new Error(`Veri dosyası yüklenemedi: HTTP ${response.status}`);
      }
      const data = await response.json();
      allItems = Array.isArray(data.items) ? data.items : [];

      appState = "ready";
      if (directoryList) {
        directoryList.setAttribute("aria-busy", "false");
      }

      if (heroUpdatedAt && data.updated_at) {
        const trDate = formatTurkishDate(data.updated_at);
        heroUpdatedAt.textContent = `Son güncelleme: ${trDate}`;
      }

      calculateAndRenderCounts(data);
      readUrlParams();
      applyFiltersAndSort();
    } catch (error) {
      appState = "error";
      if (directoryList) {
        directoryList.setAttribute("aria-busy", "false");
        directoryList.innerHTML = "";
      }
      if (resultSummary) {
        resultSummary.textContent = "Bağlantı hatası";
      }
      console.error("Dizin yükleme hatası:", error);
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div class="app-status">
            <h2 class="empty-title">Dizin Yüklenemedi</h2>
            <p class="empty-desc">Veriler yüklenirken bir sorun oluştu (${escapeHtml(error.message)}). Lütfen internet bağlantınızı kontrol edip tekrar deneyin.</p>
            <button type="button" class="reset-filter-btn" id="retry-fetch-btn">Yeniden Dene</button>
          </div>
        `;
        const retryBtn = document.getElementById("retry-fetch-btn");
        if (retryBtn) {
          retryBtn.addEventListener("click", () => loadData());
        }
      }
    }
  }

  function calculateAndRenderCounts(data) {
    const total = allItems.length;
    const designers = allItems.filter((it) => it.categories && it.categories.includes("designer")).length;
    const foundries = allItems.filter((it) => it.categories && it.categories.includes("foundry")).length;

    if (countAll) countAll.textContent = total;
    if (countDesigners) countDesigners.textContent = designers;
    if (countFoundries) countFoundries.textContent = foundries;
  }

  // -------------------------------------------------------------
  // Filtering & Sorting
  // -------------------------------------------------------------

  const turkishCollator = new Intl.Collator("tr-TR", { numeric: true, sensitivity: "base" });

  function applyFiltersAndSort() {
    let filtered = allItems.slice();

    // 1. Category Filter
    if (activeCategory !== "all") {
      filtered = filtered.filter((item) => {
        return item.categories && item.categories.includes(activeCategory);
      });
    }

    // 2. Text Search
    if (activeQuery) {
      filtered = filtered.filter((item) => {
        const membersMatch = Array.isArray(item.members)
          ? item.members.some((m) => textContainsQuery(m, activeQuery))
          : false;

        return (
          textContainsQuery(item.name, activeQuery) ||
          textContainsQuery(item.brand, activeQuery) ||
          membersMatch ||
          textContainsQuery(item.affiliation, activeQuery) ||
          textContainsQuery(item.description, activeQuery) ||
          textContainsQuery(item.domain, activeQuery) ||
          textContainsQuery(item.platform, activeQuery)
        );
      });
    }

    // 3. Sorting
    if (activeSort === "name-asc") {
      filtered.sort((a, b) => turkishCollator.compare(a.name, b.name));
    } else if (activeSort === "name-desc") {
      filtered.sort((a, b) => turkishCollator.compare(b.name, a.name));
    } else if (activeSort === "default") {
      filtered.sort((a, b) => (a.index || 0) - (b.index || 0));
    }

    currentResults = filtered;
    renderResults();
    updateUrlParams();
  }

  // -------------------------------------------------------------
  // Grouping by Letter
  // -------------------------------------------------------------

  function groupResultsByLetter(results) {
    const groups = new Map();
    for (const item of results) {
      const letter = getInitialLetter(item.name);
      if (!groups.has(letter)) {
        groups.set(letter, []);
      }
      groups.get(letter).push(item);
    }
    return groups;
  }

  // -------------------------------------------------------------
  // Rendering Showcase (Vitrin) & List Views
  // -------------------------------------------------------------

  function renderResults() {
    if (!directoryList || !resultSummary) return;

    const count = currentResults.length;
    let catLabel = "KAYIT";
    if (activeCategory === "designer") catLabel = "YAZI TASARIMCISI";
    else if (activeCategory === "foundry") catLabel = "YAZIEVİ";

    if (activeQuery) {
      resultSummary.innerHTML = `<strong>${escapeHtml(activeQuery)}</strong> ARAMASI İÇİN <strong>${count}</strong> ${catLabel} BULUNDU`;
    } else {
      if (activeCategory === "all") {
        resultSummary.innerHTML = `TOPLAM <strong>${count}</strong> KAYIT LİSTELENİYOR`;
      } else {
        resultSummary.innerHTML = `<strong>${count}</strong> ${catLabel} LİSTELENİYOR`;
      }
    }

    // Empty State (only when appState is ready and count is 0)
    if (appState === "ready" && count === 0) {
      directoryList.innerHTML = "";
      if (letterIndexRail) letterIndexRail.innerHTML = "";
      if (mobileLetterStrip) mobileLetterStrip.innerHTML = "";
      updateStickyOffset();

      statusContainer.innerHTML = `
        <div class="app-status">
          <h2 class="empty-title">Kayıt Bulunamadı</h2>
          <p class="empty-desc">
            "${escapeHtml(activeQuery)}" ifadesiyle veya seçili filtreyle eşleşen herhangi bir kayıt bulunamadı.
          </p>
          <button type="button" class="reset-filter-btn" id="empty-reset-btn">Aramayı Temizle</button>
        </div>
      `;
      const resetBtn = document.getElementById("empty-reset-btn");
      if (resetBtn) resetBtn.addEventListener("click", resetFilters);
      return;
    }

    statusContainer.innerHTML = "";

    // Harf gruplama kuralı: Sadece name-asc veya name-desc VE sonuç sayısı 12'den fazla ise
    const isGroupedByLetter = (activeSort === "name-asc" || activeSort === "name-desc") && currentResults.length > 12;
    let letterGroups = null;

    if (isGroupedByLetter) {
      letterGroups = groupResultsByLetter(currentResults);
      renderLetterRails(Array.from(letterGroups.keys()));
    } else {
      if (letterIndexRail) letterIndexRail.innerHTML = "";
      if (mobileLetterStrip) mobileLetterStrip.innerHTML = "";
      updateStickyOffset();
    }

    if (activeView === "grid") {
      renderGridView(isGroupedByLetter, letterGroups);
    } else {
      renderListView(isGroupedByLetter, letterGroups);
    }

    // Harf konumlarını önbelleğe al
    updateCachedLetterOffsets();
  }

  // -------------------------------------------------------------
  // Showcase / Grid Rendering
  // -------------------------------------------------------------

  function renderBadgeHtml(item) {
    if (item.categories && item.categories.includes("foundry")) {
      return `<span class="badge badge-foundry">Yazıevi</span>`;
    }
    return `<span class="badge badge-designer">Yazı Tasarımcısı</span>`;
  }

  function renderIdentityLineHtml(item) {
    if (item.categories && item.categories.includes("foundry") && Array.isArray(item.members) && item.members.length > 0) {
      const highlightedMembers = item.members.map((m) => highlightMatches(m, activeQuery)).join(" · ");
      return `
        <div class="identity-line">
          <span class="identity-label">Ekip</span>
          <span class="identity-val">${highlightedMembers}</span>
        </div>
      `;
    }
    if (item.brand) {
      return `
        <div class="identity-line">
          <span class="identity-label">Marka</span>
          <span class="identity-val">${highlightMatches(item.brand, activeQuery)}</span>
        </div>
      `;
    }
    if (item.affiliation) {
      return `
        <div class="identity-line">
          <span class="identity-label">Yazıevi</span>
          <span class="identity-val">${highlightMatches(item.affiliation, activeQuery)}</span>
        </div>
      `;
    }
    return "";
  }

  function renderDescriptionHtml(item, className) {
    if (!item.description || !item.description.trim()) return "";
    const highlightedDesc = highlightMatches(item.description.trim(), activeQuery);
    return `<p class="${className}" title="${escapeHtml(item.description.trim())}">${highlightedDesc}</p>`;
  }

  function renderVitrinItemHtml(item, groupLetter = null) {
    const monogram = getMonogram(item.name);
    const highlightedName = highlightMatches(item.name, activeQuery);
    const badgeHtml = renderBadgeHtml(item);
    const identityLineHtml = renderIdentityLineHtml(item);
    const descHtml = renderDescriptionHtml(item, "vitrin-desc");

    const imageHtml = item.image
      ? `<div class="vitrin-media">
           <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} önizleme görseli" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('no-img');">
           <span class="vitrin-fallback" aria-hidden="true">${escapeHtml(monogram)}</span>
         </div>`
      : `<div class="vitrin-media no-img">
           <span class="vitrin-fallback" aria-hidden="true">${escapeHtml(monogram)}</span>
         </div>`;

    const domainHtml = item.domain
      ? `<div class="vitrin-domain">
           <span>${escapeHtml(item.domain)}</span>
           <span class="arrow-icon" aria-hidden="true">↗</span>
         </div>`
      : "";

    const letterAttrs = groupLetter
      ? ` id="letter-group-${escapeHtml(groupLetter)}" data-letter="${escapeHtml(groupLetter)}"`
      : "";

    return `
      <li class="vitrin-item"${letterAttrs} data-id="${escapeHtml(item.id)}">
        ${imageHtml}

        <div class="vitrin-meta">
          <div class="vitrin-badges">${badgeHtml}</div>
          ${domainHtml}
        </div>

        <h3 class="vitrin-title">
          <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="vitrin-card-link">
            ${highlightedName}
          </a>
        </h3>

        ${identityLineHtml}
        ${descHtml}
      </li>
    `;
  }

  function renderGridView(isGroupedByLetter, letterGroups) {
    if (!isGroupedByLetter) {
      directoryList.innerHTML = `
        <ul class="letter-group-list" role="list">
          ${currentResults.map((item) => renderVitrinItemHtml(item)).join("")}
        </ul>
      `;
      return;
    }

    let html = "";
    for (const [letter, groupItems] of letterGroups.entries()) {
      const itemsHtml = groupItems
        .map((item, idx) => (idx === 0 ? renderVitrinItemHtml(item, letter) : renderVitrinItemHtml(item)))
        .join("");

      html += `
        <div class="letter-group">
          <ul class="letter-group-list" role="list">
            ${itemsHtml}
          </ul>
        </div>
      `;
    }
    directoryList.innerHTML = html;
  }

  // -------------------------------------------------------------
  // List View Rendering
  // -------------------------------------------------------------

  function renderListRowHtml(item, groupLetter = null) {
    const monogram = getMonogram(item.name);
    const highlightedName = highlightMatches(item.name, activeQuery);
    const badgeHtml = renderBadgeHtml(item);
    const identityLineHtml = renderIdentityLineHtml(item);
    const descHtml = renderDescriptionHtml(item, "list-row-desc");

    const imageHtml = item.image
      ? `<div class="list-row-media">
           <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} görseli" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('no-img');">
           <span class="media-fallback" aria-hidden="true">${escapeHtml(monogram)}</span>
         </div>`
      : `<div class="list-row-media no-img">
           <span class="media-fallback" aria-hidden="true">${escapeHtml(monogram)}</span>
         </div>`;

    const letterAttrs = groupLetter
      ? ` id="letter-group-${escapeHtml(groupLetter)}" data-letter="${escapeHtml(groupLetter)}"`
      : "";

    return `
      <li class="dizin-list-row"${letterAttrs} data-id="${escapeHtml(item.id)}">
        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="list-row-link">
          ${imageHtml}
          <div class="list-row-content">
            <div class="list-row-main">
              <div class="list-row-line1">
                <span class="list-row-title">${highlightedName}</span>
                <div class="list-row-badges">${badgeHtml}</div>
              </div>
              ${descHtml}
            </div>
            <div class="list-row-line2">
              ${identityLineHtml}
              ${item.domain ? `<span class="list-row-domain"><span>${escapeHtml(item.domain)}</span><span class="arrow-icon" aria-hidden="true">↗</span></span>` : ""}
            </div>
          </div>
        </a>
      </li>
    `;
  }

  function renderListView(isGroupedByLetter, letterGroups) {
    if (!isGroupedByLetter) {
      directoryList.innerHTML = `
        <ul class="letter-group-list" role="list">
          ${currentResults.map((item) => renderListRowHtml(item)).join("")}
        </ul>
      `;
      return;
    }

    let html = "";
    for (const [letter, groupItems] of letterGroups.entries()) {
      const itemsHtml = groupItems
        .map((item, idx) => (idx === 0 ? renderListRowHtml(item, letter) : renderListRowHtml(item)))
        .join("");

      html += `
        <div class="letter-group">
          <ul class="letter-group-list" role="list">
            ${itemsHtml}
          </ul>
        </div>
      `;
    }
    directoryList.innerHTML = html;
  }

  // -------------------------------------------------------------
  // Letter Rails & Active Letter Computation
  // -------------------------------------------------------------

  function renderLetterRails(letters) {
    if (!letters.length) {
      if (letterIndexRail) letterIndexRail.innerHTML = "";
      if (mobileLetterStrip) mobileLetterStrip.innerHTML = "";
      updateStickyOffset();
      return;
    }

    const currentLetter = activeLetterInView && letters.includes(activeLetterInView) ? activeLetterInView : letters[0];

    const railButtonsHtml = letters
      .map(
        (ltr) => `
        <button type="button" class="rail-letter-btn${ltr === currentLetter ? " active" : ""}" data-letter="${escapeHtml(ltr)}" tabindex="${ltr === currentLetter ? "0" : "-1"}" aria-selected="${ltr === currentLetter ? "true" : "false"}" aria-label="${escapeHtml(ltr)} harfine atla">
          ${escapeHtml(ltr)}
        </button>
      `
      )
      .join("");

    const stripButtonsHtml = letters
      .map(
        (ltr) => `
        <button type="button" class="strip-letter-btn${ltr === currentLetter ? " active" : ""}" data-letter="${escapeHtml(ltr)}" tabindex="${ltr === currentLetter ? "0" : "-1"}" aria-selected="${ltr === currentLetter ? "true" : "false"}" aria-label="${escapeHtml(ltr)} harfine atla">
          ${escapeHtml(ltr)}
        </button>
      `
      )
      .join("");

    if (letterIndexRail) letterIndexRail.innerHTML = railButtonsHtml;
    if (mobileLetterStrip) mobileLetterStrip.innerHTML = stripButtonsHtml;

    updateActiveLetterIndicator(currentLetter);
    updateStickyOffset();
  }

  function updateCachedLetterOffsets() {
    cachedLetterOffsets = [];
    const separators = document.querySelectorAll(".vitrin-item[data-letter], .dizin-list-row[data-letter]");
    separators.forEach((el) => {
      const letter = el.getAttribute("data-letter");
      if (letter) {
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        cachedLetterOffsets.push({ letter, top, el });
      }
    });
  }

  function scrollToLetter(letter) {
    const target = document.getElementById(`letter-group-${letter}`);
    if (!target) return;

    // 1. Tıklanan harfi hemen etkin yap
    updateActiveLetterIndicator(letter);

    // 2. Scroll hesaplayıcısını kaydırma bitene kadar kilitle
    isClickScrolling = true;
    if (clickScrollTimer) clearTimeout(clickScrollTimer);

    const unlockScroll = () => {
      isClickScrolling = false;
      window.removeEventListener("scrollend", onScrollEnd);
    };

    const onScrollEnd = () => {
      unlockScroll();
    };

    if ("onscrollend" in window) {
      window.addEventListener("scrollend", onScrollEnd, { once: true });
    }
    clickScrollTimer = setTimeout(unlockScroll, 700);

    // 3. Hedefe kaydır
    target.scrollIntoView({ behavior: getScrollBehavior(), block: "start" });

    // 4. Hedef ayraca tabindex="-1" ver ve odağı preventScroll ile taşı (Item 8)
    target.setAttribute("tabindex", "-1");
    try {
      target.focus({ preventScroll: true });
    } catch (e) {
      target.focus();
    }
  }

  function updateActiveLetterIndicator(letter) {
    if (!letter) return;
    activeLetterInView = letter;

    if (letterIndexRail) {
      const btns = letterIndexRail.querySelectorAll(".rail-letter-btn");
      btns.forEach((btn) => {
        const isMatch = btn.getAttribute("data-letter") === letter;
        btn.classList.toggle("active", isMatch);
        btn.setAttribute("tabindex", isMatch ? "0" : "-1");
        btn.setAttribute("aria-selected", isMatch ? "true" : "false");
      });
    }

    if (mobileLetterStrip) {
      const btns = mobileLetterStrip.querySelectorAll(".strip-letter-btn");
      btns.forEach((btn) => {
        const isMatch = btn.getAttribute("data-letter") === letter;
        btn.classList.toggle("active", isMatch);
        btn.setAttribute("tabindex", isMatch ? "0" : "-1");
        btn.setAttribute("aria-selected", isMatch ? "true" : "false");
        if (isMatch) {
          // btn.scrollIntoView kaldırıldı, yerine horizontal scrollTo kullanıldı
          const stripRect = mobileLetterStrip.getBoundingClientRect();
          const btnRect = btn.getBoundingClientRect();
          const currentScroll = mobileLetterStrip.scrollLeft;
          const targetScroll = currentScroll + (btnRect.left - stripRect.left) - (mobileLetterStrip.clientWidth / 2) + (btn.clientWidth / 2);
          mobileLetterStrip.scrollTo({
            left: Math.max(0, targetScroll),
            behavior: getScrollBehavior()
          });
        }
      });
    }
  }

  function computeActiveLetterFromScroll() {
    if (!cachedLetterOffsets.length) return;

    // Sayfa sonuna gelindiğinde son harf etkin olsun
    const scrollY = window.scrollY;
    const innerHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;
    if (scrollY + innerHeight >= scrollHeight - 5) {
      const lastLetter = cachedLetterOffsets[cachedLetterOffsets.length - 1].letter;
      updateActiveLetterIndicator(lastLetter);
      return;
    }

    // --sticky-offset + 24px çizgisini en son geçmiş ayraç etkin olsun
    const stickyOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sticky-offset") || "0", 10) || 0;
    const threshold = scrollY + stickyOffset + 24;

    let currentActive = cachedLetterOffsets[0].letter;
    for (let i = 0; i < cachedLetterOffsets.length; i++) {
      if (cachedLetterOffsets[i].top <= threshold) {
        currentActive = cachedLetterOffsets[i].letter;
      } else {
        break;
      }
    }

    updateActiveLetterIndicator(currentActive);
  }

  function onWindowScroll() {
    if (toolbarWrapper) {
      if (window.scrollY > 40) {
        toolbarWrapper.classList.add("is-stuck");
      } else {
        toolbarWrapper.classList.remove("is-stuck");
      }
    }

    if (isClickScrolling) return;

    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        computeActiveLetterFromScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  // Roving Tabindex Keyboard Navigation
  function handleLetterNavigationKeydown(e, container, isHorizontal) {
    const btns = Array.from(container.querySelectorAll("button[data-letter]"));
    if (!btns.length) return;

    const currentIndex = btns.findIndex((b) => b === document.activeElement || b.classList.contains("active"));
    let nextIndex = -1;

    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";

    if (e.key === prevKey) {
      e.preventDefault();
      nextIndex = currentIndex > 0 ? currentIndex - 1 : btns.length - 1;
    } else if (e.key === nextKey) {
      e.preventDefault();
      nextIndex = currentIndex < btns.length - 1 ? currentIndex + 1 : 0;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = btns.length - 1;
    }

    if (nextIndex >= 0 && nextIndex < btns.length) {
      const targetBtn = btns[nextIndex];
      const letter = targetBtn.getAttribute("data-letter");
      targetBtn.focus();
      if (letter) {
        scrollToLetter(letter);
      }
    }
  }

  // -------------------------------------------------------------
  // Reset Filters
  // -------------------------------------------------------------

  function resetFilters() {
    activeQuery = "";
    activeCategory = "all";
    activeSort = "name-asc";

    if (searchInput) {
      searchInput.value = "";
      if (searchClearBtn) searchClearBtn.style.display = "none";
    }
    if (sortSelect) sortSelect.value = "name-asc";

    syncCategorySegmented("all");
    applyFiltersAndSort();
  }

  // -------------------------------------------------------------
  // View Switcher (Vitrin vs Liste)
  // -------------------------------------------------------------

  function setViewMode(mode) {
    activeView = mode === "list" ? "list" : "grid";

    if (directoryList) {
      if (activeView === "list") {
        directoryList.classList.remove("view-grid");
        directoryList.classList.add("view-list");
      } else {
        directoryList.classList.remove("view-list");
        directoryList.classList.add("view-grid");
      }
    }

    if (viewGridBtn) {
      viewGridBtn.classList.toggle("active", activeView === "grid");
      viewGridBtn.setAttribute("aria-pressed", activeView === "grid" ? "true" : "false");
    }
    if (viewListBtn) {
      viewListBtn.classList.toggle("active", activeView === "list");
      viewListBtn.setAttribute("aria-pressed", activeView === "list" ? "true" : "false");
    }

    try {
      localStorage.setItem(VIEW_STORAGE_KEY, activeView);
    } catch (e) {
      /* ignore */
    }

    // Yalnızca veri hazır olduğunda render tetiklenir (Item 3)
    if (appState === "ready") {
      renderResults();
    }
  }

  function initViewMode() {
    let saved = "grid";
    try {
      saved = localStorage.getItem(VIEW_STORAGE_KEY) || "grid";
    } catch (e) {
      /* ignore */
    }
    setViewMode(saved);

    if (viewGridBtn) viewGridBtn.addEventListener("click", () => setViewMode("grid"));
    if (viewListBtn) viewListBtn.addEventListener("click", () => setViewMode("list"));
  }

  // -------------------------------------------------------------
  // URL Params Synchronization
  // -------------------------------------------------------------

  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("category");
    const sort = params.get("sort");

    if (q) {
      activeQuery = q.trim();
      if (searchInput) searchInput.value = activeQuery;
      if (searchClearBtn) searchClearBtn.style.display = "flex";
    }
    if (cat && ["all", "designer", "foundry"].includes(cat)) {
      activeCategory = cat;
      syncCategorySegmented(cat);
    }
    if (sort && ["name-asc", "name-desc", "default"].includes(sort)) {
      activeSort = sort;
      if (sortSelect) sortSelect.value = sort;
    }
  }

  function updateUrlParams() {
    const params = new URLSearchParams();
    if (activeQuery) params.set("q", activeQuery);
    if (activeCategory && activeCategory !== "all") params.set("category", activeCategory);
    if (activeSort && activeSort !== "name-asc") params.set("sort", activeSort);

    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    try {
      window.history.replaceState({}, "", newUrl);
    } catch (e) {
      /* ignore */
    }
  }

  function syncCategorySegmented(category) {
    if (!categorySegmented) return;
    const buttons = categorySegmented.querySelectorAll(".segment-btn");
    buttons.forEach((btn) => {
      const match = btn.getAttribute("data-category") === category;
      btn.classList.toggle("active", match);
      btn.setAttribute("aria-pressed", match ? "true" : "false");
    });
  }

  // -------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------

  function initEventListeners() {
    // Search input
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        activeQuery = e.target.value.trim();
        if (searchClearBtn) {
          searchClearBtn.style.display = activeQuery ? "flex" : "none";
        }
        applyFiltersAndSort();
      });
    }

    // Search clear button
    if (searchClearBtn) {
      searchClearBtn.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.focus();
        }
        activeQuery = "";
        searchClearBtn.style.display = "none";
        applyFiltersAndSort();
      });
    }

    // Segmented category control
    if (categorySegmented) {
      categorySegmented.addEventListener("click", (e) => {
        const btn = e.target.closest(".segment-btn");
        if (!btn) return;
        const cat = btn.getAttribute("data-category");
        if (!cat) return;

        activeCategory = cat;
        syncCategorySegmented(cat);
        applyFiltersAndSort();
      });
    }

    // Sort select dropdown
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        activeSort = e.target.value;
        applyFiltersAndSort();
      });
    }

    // Letter rail delegation (Desktop)
    if (letterIndexRail) {
      letterIndexRail.addEventListener("click", (e) => {
        const btn = e.target.closest(".rail-letter-btn");
        if (!btn) return;
        const letter = btn.getAttribute("data-letter");
        if (letter) scrollToLetter(letter);
      });

      letterIndexRail.addEventListener("keydown", (e) => {
        handleLetterNavigationKeydown(e, letterIndexRail, false);
      });
    }

    // Mobile Letter Strip delegation
    if (mobileLetterStrip) {
      mobileLetterStrip.addEventListener("click", (e) => {
        const btn = e.target.closest(".strip-letter-btn");
        if (!btn) return;
        const letter = btn.getAttribute("data-letter");
        if (letter) scrollToLetter(letter);
      });

      mobileLetterStrip.addEventListener("keydown", (e) => {
        handleLetterNavigationKeydown(e, mobileLetterStrip, true);
      });
    }
  }

  // -------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initViewMode();
    initStickyOffsetObserver();
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    initEventListeners();
    loadData();
  });
})();
