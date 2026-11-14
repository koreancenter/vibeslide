import { SlideData, PresentationTheme, Language } from "../types";

export interface GenerateWebBundleOptions {
  slides: SlideData[];
  theme: PresentationTheme;
  defaultLanguage?: Language;
  title?: string;
  enableLaser?: boolean;
  enableNotes?: boolean;
  enableBuildIn?: boolean;
}

export function generateSelfContainedHtmlBundle(options: GenerateWebBundleOptions): string {
  const {
    slides,
    theme,
    defaultLanguage = "dual",
    title = "KIND 2026 Presentation",
    enableLaser = true,
    enableNotes = true,
    enableBuildIn = true,
  } = options;

  const slidesJson = JSON.stringify(slides);
  const themeJson = JSON.stringify(theme);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: ${theme.bgColor || "#0b0d11"};
      color: ${theme.textColor || "#f8fafc"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      overflow: hidden;
      user-select: none;
    }
    #app-container {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    #viewport {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      position: relative;
      overflow: hidden;
    }
    #slide-frame {
      width: 100%;
      max-width: 1200px;
      aspect-ratio: 16 / 9;
      background-color: ${theme.canvasBg || "#11141c"};
      border: 1px solid ${theme.borderColor || "rgba(255,255,255,0.1)"};
      border-radius: 16px;
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.8);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: background-color 0.3s ease;
    }
    .slide-header {
      padding: 18px 24px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      background: ${theme.badgeBg || "rgba(59,130,246,0.15)"};
      color: ${theme.badgeText || "#60a5fa"};
      border: 1px solid rgba(255,255,255,0.08);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .slide-number {
      font-size: 11px;
      font-family: monospace;
      opacity: 0.6;
    }
    .slide-content {
      flex: 1;
      padding: 20px 28px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .slide-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
      line-height: 1.25;
      color: ${theme.textColor || "#fff"};
    }
    .slide-subtitle {
      font-size: 13px;
      opacity: 0.75;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .cards-grid {
      display: grid;
      gap: 14px;
      flex: 1;
      align-content: stretch;
    }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .grid-1 { grid-template-columns: 1fr; }
    .card-item {
      background: ${theme.cardBg || "rgba(255,255,255,0.03)"};
      border: 1px solid ${theme.borderColor || "rgba(255,255,255,0.08)"};
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 8px;
      color: ${theme.accentColor || "#38bdf8"};
    }
    .card-desc {
      font-size: 12px;
      line-height: 1.5;
      opacity: 0.85;
    }
    .stat-val {
      font-size: 32px;
      font-weight: 800;
      color: ${theme.accentColor || "#38bdf8"};
      font-family: monospace;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.9;
    }
    /* Controls Bar */
    #toolbar {
      height: 52px;
      background: rgba(15, 19, 28, 0.95);
      backdrop-filter: blur(8px);
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      z-index: 50;
    }
    .btn {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: #cbd5e1;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: rgba(255,255,255,0.12);
      color: #fff;
    }
    .btn-primary {
      background: #2563eb;
      border-color: #3b82f6;
      color: #fff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .pip-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pip {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pip.active {
      background: ${theme.accentColor || "#38bdf8"};
      transform: scale(1.4);
    }
    /* Build-in component animation */
    .build-in-item {
      transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .build-in-hidden {
      opacity: 0 !important;
      transform: translateY(16px) scale(0.96) !important;
      pointer-events: none;
    }
    /* Laser pointer */
    #laser-dot {
      position: fixed;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 12px 3px #ef4444, 0 0 24px 8px rgba(239, 68, 68, 0.5);
      pointer-events: none;
      transform: translate(-50%, -50%);
      z-index: 9999;
      display: none;
    }
    /* Presenter Notes Drawer */
    #notes-drawer {
      position: absolute;
      bottom: 52px;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.98);
      border-top: 1px solid rgba(255,255,255,0.15);
      padding: 16px 24px;
      display: none;
      max-height: 160px;
      overflow-y: auto;
      font-size: 13px;
      line-height: 1.6;
      color: #94a3b8;
      z-index: 40;
    }
  </style>
</head>
<body>
  <div id="laser-dot"></div>
  <div id="app-container">
    <div id="viewport">
      <div id="slide-frame">
        <div class="slide-header">
          <div class="badge" id="slide-tag">KIND 2026</div>
          <div class="slide-number" id="slide-num">1 / 10</div>
        </div>
        <div class="slide-content">
          <h1 class="slide-title build-in-item" id="slide-title">Loading Slide...</h1>
          <p class="slide-subtitle build-in-item" id="slide-subtitle">...</p>
          <div class="cards-grid" id="slide-body"></div>
        </div>
      </div>
      <div id="notes-drawer">
        <strong style="color: #cbd5e1; display: block; margin-bottom: 4px;">Speaker Notes:</strong>
        <p id="notes-text"></p>
      </div>
    </div>

    <!-- Controls -->
    <div id="toolbar">
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="btn" id="btn-prev" onclick="prevStep()">◀ Prev</button>
        <button class="btn btn-primary" id="btn-next" onclick="nextStep()">Next ▶</button>
        <span style="font-size: 11px; opacity: 0.6; font-family: monospace;" id="step-counter"></span>
      </div>

      <div class="pip-indicator" id="pip-container"></div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="btn" id="btn-lang" onclick="cycleLanguage()">🌐 <span id="lang-label">Dual</span></button>
        ${enableNotes ? `<button class="btn" id="btn-notes" onclick="toggleNotes()">📝 Notes</button>` : ""}
        ${enableLaser ? `<button class="btn" id="btn-laser" onclick="toggleLaser()">🔴 Laser</button>` : ""}
        <button class="btn" id="btn-fs" onclick="toggleFullscreen()">⛶ Fullscreen</button>
      </div>
    </div>
  </div>

  <script>
    const slides = ${slidesJson};
    const theme = ${themeJson};
    let currentSlideIdx = 0;
    let currentStep = 0; // component build-in step
    let currentLang = "${defaultLanguage}"; // "ko" | "id" | "en" | "dual"
    let laserActive = false;
    let notesActive = false;
    const buildInEnabled = ${enableBuildIn ? "true" : "false"};

    function getSlideTotalSteps(sl) {
      if (!buildInEnabled) return 0;
      let count = 2; // title (0) + subtitle (1)
      if (sl.bullets && Array.isArray(sl.bullets)) count += sl.bullets.length;
      if (sl.stats && Array.isArray(sl.stats)) count += sl.stats.length;
      return count;
    }

    function getText(ko, id, ja) {
      if (currentLang === "ko") return ko || id || "";
      if (currentLang === "id") return id || ko || "";
      if (currentLang === "en") return id || ko || "";
      return ko && id && ko !== id ? ko + " / " + id : (ko || id || "");
    }

    function renderSlide() {
      const sl = slides[currentSlideIdx];
      if (!sl) return;

      document.getElementById("slide-num").textContent = (currentSlideIdx + 1) + " / " + slides.length;
      document.getElementById("slide-tag").textContent = getText(sl.tagKo, sl.tagId) || getText(sl.categoryKo, sl.categoryId) || "KIND 2026";
      
      const titleEl = document.getElementById("slide-title");
      const subEl = document.getElementById("slide-subtitle");
      titleEl.textContent = getText(sl.titleKo, sl.titleId);
      subEl.textContent = getText(sl.subtitleKo, sl.subtitleId);

      // Build in visibility for title & sub
      if (buildInEnabled && currentStep < 1) {
        subEl.classList.add("build-in-hidden");
      } else {
        subEl.classList.remove("build-in-hidden");
      }

      // Render cards / stats
      const bodyEl = document.getElementById("slide-body");
      bodyEl.innerHTML = "";

      if (sl.layout === "key-stats" && sl.stats && sl.stats.length > 0) {
        bodyEl.className = "cards-grid grid-4";
        sl.stats.forEach((st, idx) => {
          const itemStep = 2 + idx;
          const isHidden = buildInEnabled && currentStep < itemStep;
          const card = document.createElement("div");
          card.className = "card-item build-in-item " + (isHidden ? "build-in-hidden" : "");
          card.innerHTML = \`
            <div class="stat-val">\${st.value || "0"}<span style="font-size: 14px; opacity: 0.7; margin-left: 2px;">\${getText(st.unitKo, st.unitId)}</span></div>
            <div class="stat-label">\${getText(st.labelKo, st.labelId)}</div>
          \`;
          bodyEl.appendChild(card);
        });
      } else if (sl.bullets && sl.bullets.length > 0) {
        const colClass = sl.bullets.length <= 2 ? "grid-2" : "grid-3";
        bodyEl.className = "cards-grid " + colClass;
        sl.bullets.forEach((b, idx) => {
          const itemStep = 2 + idx;
          const isHidden = buildInEnabled && currentStep < itemStep;
          const card = document.createElement("div");
          card.className = "card-item build-in-item " + (isHidden ? "build-in-hidden" : "");
          card.innerHTML = \`
            <div class="card-title">\${getText(b.titleKo, b.titleId)}</div>
            <div class="card-desc">\${getText(b.descKo, b.descId)}</div>
          \`;
          bodyEl.appendChild(card);
        });
      }

      // Notes
      const notes = getText(sl.notesKo, sl.notesId);
      document.getElementById("notes-text").textContent = notes || "No presenter notes for this slide.";

      // Step counter
      const maxSteps = getSlideTotalSteps(sl);
      if (buildInEnabled && maxSteps > 0) {
        document.getElementById("step-counter").textContent = "Step " + Math.min(currentStep + 1, maxSteps) + "/" + maxSteps;
      } else {
        document.getElementById("step-counter").textContent = "";
      }

      renderPips();
    }

    function renderPips() {
      const container = document.getElementById("pip-container");
      container.innerHTML = "";
      slides.forEach((_, idx) => {
        const pip = document.createElement("div");
        pip.className = "pip " + (idx === currentSlideIdx ? "active" : "");
        pip.onclick = () => {
          currentSlideIdx = idx;
          currentStep = 0;
          renderSlide();
        };
        container.appendChild(pip);
      });
    }

    function nextStep() {
      const maxSteps = getSlideTotalSteps(slides[currentSlideIdx]);
      if (buildInEnabled && currentStep < maxSteps - 1) {
        currentStep++;
        renderSlide();
      } else {
        if (currentSlideIdx < slides.length - 1) {
          currentSlideIdx++;
          currentStep = 0;
          renderSlide();
        }
      }
    }

    function prevStep() {
      if (buildInEnabled && currentStep > 0) {
        currentStep--;
        renderSlide();
      } else {
        if (currentSlideIdx > 0) {
          currentSlideIdx--;
          currentStep = Math.max(0, getSlideTotalSteps(slides[currentSlideIdx]) - 1);
          renderSlide();
        }
      }
    }

    function cycleLanguage() {
      const langs = ["dual", "ko", "id", "en"];
      const nextIdx = (langs.indexOf(currentLang) + 1) % langs.length;
      currentLang = langs[nextIdx];
      document.getElementById("lang-label").textContent = currentLang.toUpperCase();
      renderSlide();
    }

    function toggleNotes() {
      notesActive = !notesActive;
      document.getElementById("notes-drawer").style.display = notesActive ? "block" : "none";
    }

    function toggleLaser() {
      laserActive = !laserActive;
      const dot = document.getElementById("laser-dot");
      dot.style.display = laserActive ? "block" : "none";
      document.body.style.cursor = laserActive ? "none" : "default";
    }

    document.addEventListener("mousemove", (e) => {
      if (laserActive) {
        const dot = document.getElementById("laser-dot");
        dot.style.left = e.clientX + "px";
        dot.style.top = e.clientY + "px";
      }
    });

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Keyboard bindings
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "l" || e.key === "L") {
        toggleLaser();
      } else if (e.key === "b" || e.key === "B") {
        cycleLanguage();
      } else if (e.key === "n" || e.key === "N") {
        toggleNotes();
      }
    });

    // Initial render
    renderSlide();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
