/* D2F Interior Design — app.js (PART 1/3)
   iOS SUPER PACK
   - Navigation (tabbar)
   - FAB handler
   - Modal (sheet) handler
   - Progress simulator helper
   - History (localStorage) helpers
   Part 2 will include form handler + API calls (text + images)
   Part 3 will include finish-up, initialization and utility functions
*/

/* =========================
   UTILS & SELECTORS
   ========================= */

const PAGES = ["page-home", "page-generate", "page-history", "page-profile"];

// Short getters for frequently used inputs (to avoid undefined names)
const colorInput = () => document.getElementById("color");
const sizeInput = () => document.getElementById("size");
const roomTypeInput = () => document.getElementById("roomType");
const budgetInput = () => document.getElementById("budget");
const styleInput = () => document.getElementById("style");

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

/* =========================
   NAVIGATION (TABBAR) & PAGES
   ========================= */

function showPage(id) {
  PAGES.forEach(p => {
    const el = document.getElementById(p);
    if (!el) return;
    if (p === id) el.classList.add("active");
    else el.classList.remove("active");
  });

  // Update tab active states
  $all(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === id);
  });

  // Scroll to top when switching to generate page
  if (id === "page-generate") window.scrollTo({ top: 0, behavior: "smooth" });
}

// attach tab button handlers
$all(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const tgt = btn.dataset.target;
    if (tgt) showPage(tgt);
  });
});

/* =========================
   FAB & HOME BUTTONS
   ========================= */

// FAB (floating action button) — opens generate page
const fab = document.getElementById("fabGenerate");
if (fab) {
  fab.addEventListener("click", () => {
    showPage("page-generate");
    // small focus for UX
    setTimeout(() => {
      const c = colorInput();
      if (c) c.focus();
    }, 250);
  });
}

// Home quick buttons
const btnOpenGenerate = document.getElementById("btnOpenGenerate");
if (btnOpenGenerate) btnOpenGenerate.addEventListener("click", () => showPage("page-generate"));

const btnOpenHistory = document.getElementById("btnOpenHistory");
if (btnOpenHistory) btnOpenHistory.addEventListener("click", () => {
  showPage("page-history");
  populateHistory();
});

/* =========================
   MODAL (iOS sheet) HANDLER
   ========================= */

const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");
const modalDownload = document.getElementById("modalDownload");

function openModal(imageDataUrl, meta = {}) {
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  // Render image + optional metadata
  modalContent.innerHTML = `
    <div style="width:100%; border-radius:12px; overflow:hidden;">
      <img src="${imageDataUrl}" alt="Preview" style="width:100%; display:block;" />
    </div>
    ${meta.title ? `<div style="margin-top:8px; font-weight:700;">${meta.title}</div>` : ""}
    ${meta.desc ? `<div style="margin-top:6px; color:var(--text-muted); font-size:13px;">${meta.desc}</div>` : ""}
  `;
  if (modalDownload) {
    modalDownload.href = imageDataUrl;
    modalDownload.setAttribute("download", meta.filename || "design.png");
  }
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  if (modalContent) modalContent.innerHTML = "";
}

if (modalClose) modalClose.addEventListener("click", closeModal);
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

/* =========================
   PROGRESS SIMULATOR
   - simulateProgress(barId, duration)
     returns intervalId to clear when done
   ========================= */

function simulateProgress(barId, duration = 2500) {
  const bar = document.getElementById(barId);
  if (!bar) return null;
  bar.style.width = "0%";
  let progress = 0;
  const tick = 120;
  const steps = Math.max(3, Math.floor(duration / tick));
  const stepAmount = 90 / steps; // go up to 90% automatically, hold final 10% for completion
  const interval = setInterval(() => {
    if (progress < 90) {
      progress = Math.min(90, progress + stepAmount);
      bar.style.width = Math.round(progress) + "%";
    }
  }, tick);
  return interval;
}

/* =========================
   HISTORY (localStorage) HELPERS
   - saveToHistory(item)
   - populateHistory()
   - clearHistory()
   ========================= */

const HISTORY_KEY = "d2f_history_v1";

function saveToHistory(item) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY) || "[]";
    const arr = JSON.parse(raw);
    arr.unshift(item);
    // limit to 50 items
    const out = arr.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(out));
  } catch (e) {
    console.error("saveToHistory error", e);
  }
}

function populateHistory() {
  const wrap = document.getElementById("historyList");
  if (!wrap) return;
  wrap.innerHTML = "";
  let arr = [];
  try {
    arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch (e) {
    arr = [];
  }
  if (!arr || arr.length === 0) {
    wrap.innerHTML = `<div class="muted">No saved designs yet.</div>`;
    return;
  }

  arr.forEach((it, idx) => {
    const node = document.createElement("div");
    node.className = "history-item";
    node.innerHTML = `
      <img src="${it.images?.[0] || ''}" alt="thumb" />
      <div style="flex:1;">
        <div style="font-weight:700;">${escapeHtml(it.roomType || '')} • ${escapeHtml(it.style || '')}</div>
        <div class="muted" style="font-size:13px; margin-top:6px;">${escapeHtml(it.date || '')}</div>
      </div>
    `;
    node.addEventListener("click", () => {
      // open modal preview of first image
      if (it.images && it.images.length) openModal(it.images[0], { title: `${it.roomType} • ${it.style}`, desc: it.date });
    });
    wrap.appendChild(node);
  });
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  populateHistory();
}

const clearHistoryBtn = document.getElementById("clearHistory");
if (clearHistoryBtn) clearHistoryBtn.addEventListener("click", () => {
  if (!confirm("Clear saved history from this device?")) return;
  clearHistory();
});

/* =========================
   UTILITY: escapeHtml (safe insertion)
   ========================= */
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* End of PART 1/3 */
/* ===========================================================
   PART 2/3 — MAIN FORM HANDLER + AI CALLS
   Text generation (GROQ)
   Image generation (Pollinations multi-angle)
   Progress bars + loading states
   =========================================================== */

const designForm = document.getElementById("designForm");

if (designForm) {
  designForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    /* ---------------------------------------
       Gather inputs safely
    --------------------------------------- */
    const color = colorInput()?.value || "";
    const size = sizeInput()?.value || "";
    const roomType = roomTypeInput()?.value || "";
    const budget = budgetInput()?.value || "";
    const style = styleInput()?.value || "";

    /* ---------------------------------------
       UI elements
    --------------------------------------- */
    const btn = document.getElementById("generateBtn");
    const loadingText = document.getElementById("loadingText");
    const loadingImages = document.getElementById("loadingImages");
    const textCard = document.getElementById("textCard");
    const imagesCard = document.getElementById("imagesCard");
    const textResult = document.getElementById("textResult");
    const imageGrid = document.getElementById("imageGrid");

    // Reset
    textResult.innerHTML = "";
    imageGrid.innerHTML = "";
    textCard.hidden = true;
    imagesCard.hidden = true;

    /* ---------------------------------------
       Disable button (loading)
    --------------------------------------- */
    btn.disabled = true;
    btn.innerHTML = `Loading <span class="spinner-btn"></span>`;
    btn.classList.add("loading");

    /* ===========================================================
       1) GENERATE TEXT (GROQ)
       =========================================================== */
    loadingText.hidden = false;
    const textProgress = simulateProgress("progressTextBar", 2600);

    const textPrompt = `
      Buatkan deskripsi interior yang sangat rapi dan terstruktur.
      Detailkan:
      - Gaya: ${style}
      - Jenis ruangan: ${roomType}
      - Luas: ${size} meter persegi
      - Warna utama: ${color}
      - Budget: ${budget} juta
      Format paragraf pendek, mudah dibaca, 
	  dan jangan lupa ditambahkan biaya jasa pembangunan sebesar 10% dari total budget
    `;

    let finalText = "Gagal memuat deskripsi.";

    try {
      const res = await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textPrompt })
      });
      const json = await res.json();
      if (json?.text) finalText = json.text;
    } catch (err) {
      console.error("TEXT ERROR:", err);
    }

    clearInterval(textProgress);
    document.getElementById("progressTextBar").style.width = "100%";

    setTimeout(() => { loadingText.hidden = true; }, 300);

    /* Format hasil text menjadi paragraf rapi */
    textCard.hidden = false;
    textResult.innerHTML = finalText
      .split(/\.\s+/)
      .map(p => `<p>${p.trim()}.</p>`)
      .join("");

    /* ===========================================================
       2) GENERATE IMAGES (POLLINATIONS)
       =========================================================== */
    loadingImages.hidden = false;
    const imageProgress = simulateProgress("progressImageBar", 3500);

    // 4 sudut angle berbeda
    const angles = [
      "corner view interior",
      "front angle interior",
      "slightly elevated angle interior",
      "side cinematic angle interior"
    ];
    const prompts = angles.map(a =>
      `${style} ${roomType} interior, ${color} theme, ${a}`
    );

    let images = [];

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts })
      });
      const json = await res.json();
      if (json?.images) images = json.images;
    } catch (err) {
      console.error("IMAGE ERROR:", err);
    }

    clearInterval(imageProgress);
    document.getElementById("progressImageBar").style.width = "100%";
    setTimeout(() => { loadingImages.hidden = true; }, 300);

    /* Display Images */
    imagesCard.hidden = false;

    if (!images?.length) {
      imageGrid.innerHTML = `<p class="muted">No images returned.</p>`;
    } else {
      images.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.addEventListener("click", () => openModal(src, {
          title: `${roomType} • ${style}`,
          filename: "design.png"
        }));
        imageGrid.appendChild(img);
      });

      /* Save history */
      saveToHistory({
        date: new Date().toLocaleString(),
        color, size, roomType, budget, style,
        images,
        text: finalText
      });
    }

    /* ---------------------------------------
       Re-enable button
    --------------------------------------- */
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.innerHTML = "Generate";
  });
}

/* End of PART 2/3 */

/* ===========================================================
   PART 3/3 — DARK MODE + INITIALIZATION + UTILITIES
   =========================================================== */

/* =========================
   DARK MODE
   ========================= */

const toggleDark = document.getElementById("toggleDark");

// Load saved theme
const savedTheme = localStorage.getItem("d2f_theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  if (toggleDark) toggleDark.checked = true;
}

if (toggleDark) {
  toggleDark.addEventListener("change", () => {
    if (toggleDark.checked) {
      document.body.classList.add("dark");
      localStorage.setItem("d2f_theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("d2f_theme", "light");
    }
  });
}

/* =========================
   INITIALIZATION
   ========================= */

// Default to "Home" page
showPage("page-home");

// Load history automatically
populateHistory();

/* Auto-focus color input when opening generate page via navbar */
document.querySelector('button[data-target="page-generate"]')?.addEventListener("click", () => {
  setTimeout(() => {
    colorInput()?.focus();
  }, 220);
});

/* FAB also focuses generate form */
fab?.addEventListener("click", () => {
  setTimeout(() => {
    colorInput()?.focus();
  }, 220);
});

/* =========================
   GLOBAL ESC HANDLER for modal
   ========================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* =========================
   Simple log helper
   ========================= */
function log(...args) {
  console.log("[D2F]", ...args);
}

/* =========================
   END OF FILE
   ========================= */
