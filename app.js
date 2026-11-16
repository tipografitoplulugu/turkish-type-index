/**
 * Turkish Type Designers Index (app.js)
 * Türkçe Tipografi Topluluğu
 * 
 * İstemci taraflı canlı arama, kategori filtreleme, alfabetik sıralama,
 * görünüm modu değiştirici ve koyu/açık tema yönetimi.
 */

(() => {
  "use strict";

  const DATA_URL = "./data/index.json";
  const THEME_STORAGE_KEY = "tipografi-index-theme";
  const VIEW_STORAGE_KEY = "tipografi-index-view";

  const SUN_SVG = `<circle cx="12" cy="12" r="3.5"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>`;
  const MOON_SVG = `<path d="M20.1 15.2A8.4 8.4 0 0 1 8.8 3.9 8.5 8.5 0 1 0 20.1 15.2Z"/>`;

  // State
  let allItems = [];
  let currentResults = [];
  let activeQuery = "";
  let activeCategory = "all"; // 'all' | 'designer' | 'foundry'
  let activeSort = "name-asc"; // 'name-asc' | 'name-desc' | 'default'
  let activeView = "grid"; // 'grid' | 'list'

  // DOM Elements
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const searchInput = document.getElementById("search-input");
  const searchClearBtn = document.getElementById("search-clear-btn");
  const categorySelect = document.getElementById("category-select");
  const sortSelect = document.getElementById("sort-select");
  const categoryPills = document.getElementById("category-pills");
  const directoryList = document.getElementById("directory-list");
  const statusContainer = document.getElementById("status-container");
  const resultSummary = document.getElementById("result-summary");
  const viewCardBtn = document.getElementById("view-card-btn");
  const viewListBtn = document.getElementById("view-list-btn");

  // Stat Elements
  const statDesigners = document.getElementById("stat-designers");
  const statFoundries = document.getElementById("stat-foundries");
  const statTotal = document.getElementById("stat-total");
  const countAll = document.getElementById("count-all");
  const countDesigners = document.getElementById("count-designers");
  const countFoundries = document.getElementById("count-foundries");

  // -------------------------------------------------------------
  // Theme Management
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
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (e) {
      /* ignore */
    }
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem("tipografi-archive-theme");
    } catch (e) {
      /* ignore */
    }
    const theme = saved || getSystemTheme();
    updateThemeUI(theme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", toggleTheme);
    }

    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
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

  function highlightMatches(text, query) {
    if (!text || !query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const trimmed = query.trim();
    if (!trimmed) return escaped;

    // Build regex supporting Turkish char variants
    const terms = trimmed.split(/\s+/).filter(Boolean);
    if (!terms.length) return escaped;

    const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
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

  // -------------------------------------------------------------
  // Data Loading & Statistics
  // -------------------------------------------------------------

  async function loadData() {
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) {
        throw new Error(`Veri dosyası yüklenemedi: HTTP ${response.status}`);
      }
      const data = await response.json();
      allItems = Array.isArray(data.items) ? data.items : [];

      calculateAndRenderStats(data);
      readUrlParams();
      applyFiltersAndSort();
    } catch (error) {
      console.error("Dizin yükleme hatası:", error);
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div class="app-status">
            <h3 class="empty-title">Dizin Yüklenemedi</h3>
            <p class="empty-desc">Veriler yüklenirken bir sorun oluştu (${escapeHtml(error.message)}). Lütfen sayfayı yenilemeyi deneyin.</p>
          </div>
        `;
      }
    }
  }

  function calculateAndRenderStats(data) {
    const total = allItems.length;
    const designers = allItems.filter((it) => it.categories && it.categories.includes("designer")).length;
    const foundries = allItems.filter((it) => it.categories && it.categories.includes("foundry")).length;

    if (statDesigners) statDesigners.textContent = designers;
    if (statFoundries) statFoundries.textContent = foundries;
    if (statTotal) statTotal.textContent = total;

    if (countAll) countAll.textContent = `(${total})`;
    if (countDesigners) countDesigners.textContent = `(${designers})`;
    if (countFoundries) countFoundries.textContent = `(${foundries})`;
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
        return (
          textContainsQuery(item.name, activeQuery) ||
          textContainsQuery(item.designer, activeQuery) ||
          textContainsQuery(item.studio, activeQuery) ||
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
  // Rendering
  // -------------------------------------------------------------

  function renderResults() {
    if (!directoryList || !resultSummary) return;

    // Summary Text
    const count = currentResults.length;
    let summaryText = "";

    let catLabel = "KAYIT";
    if (activeCategory === "designer") catLabel = "YAZI TASARIMCISI";
    else if (activeCategory === "foundry") catLabel = "YAZIEVİ";

    if (activeQuery) {
      summaryText = `<strong>${escapeHtml(activeQuery)}</strong> ARAMASI İÇİN <strong>${count}</strong> ${catLabel} BULUNDU`;
    } else {
      if (activeCategory === "all") {
        summaryText = `TOPLAM <strong>${count}</strong> KAYIT LİSTELENİYOR`;
      } else {
        summaryText = `<strong>${count}</strong> ${catLabel} LİSTELENİYOR`;
      }
    }
    resultSummary.innerHTML = summaryText;

    // Empty State
    if (count === 0) {
      directoryList.innerHTML = "";
      statusContainer.innerHTML = `
        <div class="app-status">
          <div class="empty-title">Kayıt Bulunamadı</div>
          <p class="empty-desc">
            "${escapeHtml(activeQuery)}" ifadesiyle veya seçili filtreyle eşleşen herhangi bir tasarımcı veya yazıevi bulunamadı.
          </p>
          <button type="button" class="reset-filter-btn" id="empty-reset-btn">Aramayı Temizle</button>
        </div>
      `;
      const resetBtn = document.getElementById("empty-reset-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", resetFilters);
      }
      return;
    }

    // Clear Status Container
    statusContainer.innerHTML = "";

    // Generate Card Elements
    const cardsHtml = currentResults
      .map((item) => {
        const monogram = getMonogram(item.name);
        const nameHighlighted = highlightMatches(item.name, activeQuery);
        const subHighlighted = item.studio && item.studio !== item.name
          ? highlightMatches(item.studio, activeQuery)
          : (item.designer && item.designer !== item.name ? highlightMatches(item.designer, activeQuery) : "");
        const descHighlighted = item.description ? highlightMatches(item.description, activeQuery) : "";

        const badgesHtml = (item.categories || [])
          .map((cat) => {
            if (cat === "designer") {
              return `<span class="badge badge-designer">Yazı Tasarımcısı</span>`;
            }
            if (cat === "foundry") {
              return `<span class="badge badge-foundry">Yazıevi</span>`;
            }
            return "";
          })
          .join("");

        const platformBadge = item.platform
          ? `<span class="badge badge-platform">${escapeHtml(item.platform)}</span>`
          : "";

        const imageHtml = item.image
          ? `<div class="card-media">
               <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)} görseli" loading="lazy" onerror="this.parentElement.classList.add('no-img');">
               <span class="media-fallback" aria-hidden="true">${escapeHtml(monogram)}</span>
             </div>`
          : `<div class="card-media no-img">
               <span class="media-fallback" aria-hidden="true">${escapeHtml(monogram)}</span>
             </div>`;

        return `
          <article class="index-card" data-id="${escapeHtml(item.id)}" role="listitem">
            <div class="card-top">
              <div class="card-badges">${badgesHtml}</div>
              <div class="card-platform">${platformBadge}</div>
            </div>

            <div class="card-middle">
              <div class="card-info">
                <h2 class="entry-title">
                  <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
                    ${nameHighlighted}
                  </a>
                </h2>
                ${subHighlighted ? `<div class="entry-subtitle">${subHighlighted}</div>` : ""}
                ${descHighlighted ? `<p class="entry-description">${descHighlighted}</p>` : ""}
              </div>
              ${imageHtml}
            </div>

            <div class="card-bottom">
              <a class="entry-link-btn" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
                <span>Ziyaret Et</span>
                <span class="arrow-icon" aria-hidden="true">↗</span>
              </a>
              <span class="entry-domain">${escapeHtml(item.domain || "")}</span>
            </div>
          </article>
        `;
      })
      .join("");

    directoryList.innerHTML = cardsHtml;
  }

  function resetFilters() {
    activeQuery = "";
    activeCategory = "all";
    activeSort = "name-asc";

    if (searchInput) {
      searchInput.value = "";
      if (searchClearBtn) searchClearBtn.style.display = "none";
    }
    if (categorySelect) categorySelect.value = "all";
    if (sortSelect) sortSelect.value = "name-asc";

    syncCategoryPills("all");
    applyFiltersAndSort();
  }

  // -------------------------------------------------------------
  // View Switcher (Grid vs List)
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

    if (viewCardBtn) viewCardBtn.classList.toggle("active", activeView === "grid");
    if (viewListBtn) viewListBtn.classList.toggle("active", activeView === "list");

    try {
      localStorage.setItem(VIEW_STORAGE_KEY, activeView);
    } catch (e) {
      /* ignore */
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

    if (viewCardBtn) {
      viewCardBtn.addEventListener("click", () => setViewMode("grid"));
    }
    if (viewListBtn) {
      viewListBtn.addEventListener("click", () => setViewMode("list"));
    }
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
      if (categorySelect) categorySelect.value = cat;
      syncCategoryPills(cat);
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

  function syncCategoryPills(category) {
    if (!categoryPills) return;
    const buttons = categoryPills.querySelectorAll(".topic-btn");
    buttons.forEach((btn) => {
      const match = btn.getAttribute("data-category") === category;
      btn.classList.toggle("active", match);
      btn.setAttribute("aria-selected", match ? "true" : "false");
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

    // Category select dropdown
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        activeCategory = e.target.value;
        syncCategoryPills(activeCategory);
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

    // Category quick pills
    if (categoryPills) {
      categoryPills.addEventListener("click", (e) => {
        const btn = e.target.closest(".topic-btn");
        if (!btn) return;
        const cat = btn.getAttribute("data-category");
        if (!cat) return;

        activeCategory = cat;
        if (categorySelect) categorySelect.value = cat;
        syncCategoryPills(cat);
        applyFiltersAndSort();
      });
    }
  }

  // -------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initViewMode();
    initEventListeners();
    loadData();
  });
})();
