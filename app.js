/**
 * Abacus Laboratory — Interactive Application & Canvas Renderer
 * Modernization of Walter Fendt's classic HTML5 Abacus applet
 * High-DPI Canvas, Bi-conical 3D beads, Web Audio haptics & Responsive UI
 */

(function () {
  'use strict';

  // State
  let engine;
  let audio;
  let canvas, ctx;
  let width = 800, height = 480;
  let dpr = window.devicePixelRatio || 1;

  // Visual Theme & Geometry
  let theme = 'wood'; // 'wood', 'slate', 'classic'
  let lang = 'de'; // 'de' or 'en'
  let mode = 'free'; // 'free' or 'quiz'
  let quizTarget = 0;

  // Layout Constants (normalized space, scaled in draw)
  let rodSpacing = 70;
  let beadWidth = 48;
  let beadHeight = 22;
  let framePaddingX = 40;
  let framePaddingY = 30;
  let separatorThickness = 14;

  // Animation States for beads (interpolation)
  // Each bead stores: { currentY, targetY, isUpper, col, idx }
  let beadVisuals = [];
  let isDragging = false;
  let draggedBead = null;
  let dragStartY = 0;

  // I18N Strings
  const i18n = {
    de: {
      title: "Abakus & Soroban Labor",
      subtitle: "Interaktives bi-quinäres Rechenbrett mit Live-Kinematik & Akustik",
      tribute: "Modernisierung & didaktische Hommage an Walter Fendt (2023)",
      rods: "Stellen / Drähte",
      abacusType: "Typ",
      theme: "Optik",
      decimalInput: "Dezimalzahl:",
      romanInput: "Römische Zahl:",
      placeValueTitle: "Stellenwert-Zerlegung:",
      clearBtn: "Abakus leeren",
      randomBtn: "Zufallszahl",
      quizBtn: "Trainer starten",
      quizActive: "Stelle folgende Zahl ein: ",
      quizCorrect: "Hervorragend! Richtig eingestellt! 🎉",
      helpText: "Klicke oder ziehe Perlen zum Trennstab hin, um Werte zu aktivieren. Jede obere Perle zählt 5, untere zählen 1.",
      classicNote: "Bi-quinäres System der klassischen Rechenmeister"
    },
    en: {
      title: "Abacus & Soroban Laboratory",
      subtitle: "Interactive Bi-quinary Reckoning Board with Live Kinematics & Audio",
      tribute: "Modernization & pedagogical tribute to Walter Fendt (2023)",
      rods: "Digits / Wires",
      abacusType: "Type",
      theme: "Theme",
      decimalInput: "Decimal Value:",
      romanInput: "Roman Numeral:",
      placeValueTitle: "Place-Value Decomposition:",
      clearBtn: "Clear Abacus",
      randomBtn: "Random Value",
      quizBtn: "Start Trainer",
      quizActive: "Set this target value: ",
      quizCorrect: "Brilliant! Exact match! 🎉",
      helpText: "Click or drag beads toward the separator beam to reckon. Upper beads count 5, lower beads count 1.",
      classicNote: "Bi-quinary decimal system used by ancient reckoning masters"
    }
  };

  // Color Palettes
  const themes = {
    wood: {
      bg: '#120f0d',
      frameOuter: '#2c1810',
      frameInner: '#1a0e0a',
      frameBorder: '#4a2818',
      beam: '#3a1f14',
      beamDots: '#d4af37', // Gold reckoning unit dots
      wire: '#a89f91',
      upperBead: { top: '#e07a5f', mid: '#b84224', bot: '#7a220e' }, // Warm terracotta
      lowerBead: { top: '#e6ccb2', mid: '#b08968', bot: '#7f5539' }, // Bamboo / wood
      beadBorder: 'rgba(30, 15, 10, 0.7)',
      text: '#f4ece1',
      accent: '#e07a5f'
    },
    slate: {
      bg: '#090d16',
      frameOuter: '#111827',
      frameInner: '#0b0f19',
      frameBorder: '#1f2937',
      beam: '#1e293b',
      beamDots: '#38bdf8', // Cyan reckoning dots
      wire: '#64748b',
      upperBead: { top: '#38bdf8', mid: '#0284c7', bot: '#0369a1' }, // Electric Cyan
      lowerBead: { top: '#34d399', mid: '#059669', bot: '#047857' }, // Emerald
      beadBorder: 'rgba(0, 0, 0, 0.6)',
      text: '#f1f5f9',
      accent: '#38bdf8'
    },
    classic: {
      bg: '#fafafa',
      frameOuter: '#71717a',
      frameInner: '#f4f4f5',
      frameBorder: '#3f3f46',
      beam: '#52525b',
      beamDots: '#ffffff',
      wire: '#71717a',
      upperBead: { top: '#f87171', mid: '#dc2626', bot: '#991b1b' }, // Walter Fendt Red
      lowerBead: { top: '#60a5fa', mid: '#2563eb', bot: '#1d4ed8' }, // Walter Fendt Blue
      beadBorder: 'rgba(0, 0, 0, 0.5)',
      text: '#18181b',
      accent: '#2563eb'
    }
  };

  function init() {
    // Check if embedded in iframe
    if (window.self !== window.top || window.location.search.includes('embed') || window.location.hash.includes('embed')) {
      document.body.classList.add('is-embedded');
      // If embedded on dark landing page, default to slate or wood
      if (window.location.search.includes('theme=slate')) {
        theme = 'slate';
        document.body.className = 'theme-slate is-embedded';
        const ts = document.getElementById('theme-select');
        if (ts) ts.value = 'slate';
      }
    }

    engine = new AbacusEngine(6, 'soroban');
    audio = new AbacusAudio();

    canvas = document.getElementById('abacus-canvas');
    ctx = canvas.getContext('2d');

    setupDomListeners();
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial random value
    const startVal = Math.floor(Math.random() * 8999) + 1000;
    engine.setValue(startVal);
    syncInputs();
    updateBeadTargetPositions(false);

    // Start animation loop
    requestAnimationFrame(renderLoop);
  }

  function handleResize() {
    const container = canvas.parentElement;
    width = container.clientWidth;
    height = Math.max(380, Math.min(520, window.innerHeight * 0.52));

    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
    recalculateGeometry();
    updateBeadTargetPositions(false);
  }

  function recalculateGeometry() {
    const totalRods = engine.rods;
    const availableWidth = width - framePaddingX * 2;
    rodSpacing = Math.min(85, Math.max(42, availableWidth / (totalRods + 0.6)));
    beadWidth = Math.min(56, rodSpacing * 0.88);
    beadHeight = Math.min(26, Math.max(18, height * 0.055));
    separatorThickness = 14;
  }

  // Calculate target resting Y position for each bead
  function updateBeadTargetPositions(animated = true) {
    const config = engine.getConfig();
    const frameTop = framePaddingY + 30;
    const frameBottom = height - framePaddingY - 45;
    const separatorY = frameTop + (frameBottom - frameTop) * 0.32;

    const newVisuals = [];

    for (let c = 0; c < engine.rods; c++) {
      const colState = engine.columns[c];
      const rodX = (width + (engine.rods - 1) * rodSpacing) / 2 - c * rodSpacing;

      // 1. Upper Beads (Heaven)
      if (config.upperBeads > 0) {
        for (let b = 0; b < config.upperBeads; b++) {
          const isActive = b < colState.upperActive;
          let targetY;
          if (isActive) {
            // Pushed down against the separator beam
            targetY = separatorY - separatorThickness / 2 - beadHeight / 2 - b * (beadHeight + 2);
          } else {
            // Pushed up against the top frame
            const inactiveIdx = config.upperBeads - 1 - b;
            targetY = frameTop + beadHeight / 2 + inactiveIdx * (beadHeight + 2);
          }

          // Match or create visual
          const existing = beadVisuals.find(v => v.col === c && v.isUpper && v.idx === b);
          const currentY = existing && animated ? existing.currentY : targetY;

          newVisuals.push({
            col: c,
            isUpper: true,
            idx: b,
            x: rodX,
            currentY: currentY,
            targetY: targetY,
            active: isActive
          });
        }
      }

      // 2. Lower Beads (Earth)
      for (let b = 0; b < config.lowerBeads; b++) {
        const isActive = b < colState.lowerActive;
        let targetY;
        if (isActive) {
          // Pushed up against the separator beam
          targetY = separatorY + separatorThickness / 2 + beadHeight / 2 + b * (beadHeight + 2);
        } else {
          // Pushed down against the bottom frame
          const inactiveIdx = (config.lowerBeads - 1) - b;
          targetY = frameBottom - beadHeight / 2 - inactiveIdx * (beadHeight + 2);
        }

        const existing = beadVisuals.find(v => v.col === c && !v.isUpper && v.idx === b);
        const currentY = existing && animated ? existing.currentY : targetY;

        newVisuals.push({
          col: c,
          isUpper: false,
          idx: b,
          x: rodX,
          currentY: currentY,
          targetY: targetY,
          active: isActive
        });
      }
    }

    beadVisuals = newVisuals;
  }

  // Animation and Render Loop
  function renderLoop() {
    updatePhysics();
    drawAbacus();
    requestAnimationFrame(renderLoop);
  }

  function updatePhysics() {
    let moving = false;
    for (const bead of beadVisuals) {
      if (Math.abs(bead.currentY - bead.targetY) > 0.4) {
        bead.currentY += (bead.targetY - bead.currentY) * 0.35;
        moving = true;
      } else {
        bead.currentY = bead.targetY;
      }
    }
  }

  function drawAbacus() {
    ctx.clearRect(0, 0, width, height);
    const pal = themes[theme];
    const frameTop = framePaddingY + 30;
    const frameBottom = height - framePaddingY - 45;
    const frameLeft = (width - engine.rods * rodSpacing) / 2 - 15;
    const frameRight = (width + engine.rods * rodSpacing) / 2 + 15;
    const separatorY = frameTop + (frameBottom - frameTop) * 0.32;

    // 1. Outer Frame (Shadow & Rich Wood/Slate Border)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    // Outer Rectangle
    ctx.fillStyle = pal.frameOuter;
    ctx.beginPath();
    roundRect(ctx, frameLeft - 18, frameTop - 18, (frameRight - frameLeft) + 36, (frameBottom - frameTop) + 36, 12);
    ctx.fill();
    ctx.restore();

    // Frame Outer Border
    ctx.strokeStyle = pal.frameBorder;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner Cutout Area
    ctx.fillStyle = pal.frameInner;
    ctx.beginPath();
    roundRect(ctx, frameLeft, frameTop, frameRight - frameLeft, frameBottom - frameTop, 6);
    ctx.fill();

    // 2. Brass / Metallic Corner Brackets (Traditional Artisan Detail)
    if (theme === 'wood') {
      drawBrassCorner(frameLeft - 18, frameTop - 18, 22, 22, 0);
      drawBrassCorner(frameRight + 18, frameTop - 18, 22, 22, 1);
      drawBrassCorner(frameRight + 18, frameBottom + 18, 22, 22, 2);
      drawBrassCorner(frameLeft - 18, frameBottom + 18, 22, 22, 3);
    }

    // 3. Vertical Metal / Bamboo Rods
    for (let c = 0; c < engine.rods; c++) {
      const rodX = (width + (engine.rods - 1) * rodSpacing) / 2 - c * rodSpacing;

      const grad = ctx.createLinearGradient(rodX - 3, 0, rodX + 3, 0);
      grad.addColorStop(0, pal.wire);
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#444444');

      ctx.fillStyle = grad;
      ctx.fillRect(rodX - 2.5, frameTop, 5, frameBottom - frameTop);
    }

    // 4. Horizontal Separator Beam (Reckoning Beam)
    ctx.fillStyle = pal.beam;
    ctx.fillRect(frameLeft, separatorY - separatorThickness / 2, frameRight - frameLeft, separatorThickness);

    ctx.strokeStyle = pal.frameBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frameLeft, separatorY - separatorThickness / 2, frameRight - frameLeft, separatorThickness);

    // 5. Unit Reckoning Dots (Star Points / Hoshidome on Soroban every 3 columns)
    for (let c = 0; c < engine.rods; c++) {
      const rodX = (width + (engine.rods - 1) * rodSpacing) / 2 - c * rodSpacing;
      if (c % 3 === 0 && c > 0) {
        ctx.beginPath();
        ctx.arc(rodX, separatorY, 3, 0, Math.PI * 2);
        ctx.fillStyle = pal.beamDots;
        ctx.fill();
      }
    }

    // 6. Draw Beads (Bi-conical diamond profile with specular highlight)
    for (const bead of beadVisuals) {
      drawBiConicalBead(bead.x, bead.currentY, beadWidth, beadHeight, bead.isUpper ? pal.upperBead : pal.lowerBead, pal.beadBorder);
    }

    // 7. Column Digits & Powers of 10 labels along the bottom
    const config = engine.getConfig();
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let c = 0; c < engine.rods; c++) {
      const rodX = (width + (engine.rods - 1) * rodSpacing) / 2 - c * rodSpacing;
      const colState = engine.columns[c];
      const digit = colState.upperActive * config.upperVal + colState.lowerActive * config.lowerVal;

      // Active Digit
      ctx.fillStyle = digit > 0 ? pal.accent : pal.text;
      ctx.fillText(String(digit), rodX, frameBottom + 22);

      // Multiplier label (10^0, 10^1, ...)
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      const sup = engine.toSuperscript(c);
      ctx.fillText(`10${sup}`, rodX, frameTop - 26);
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
    }
  }

  // Draw authentic bi-conical abacus bead (tapered diamond edge)
  function drawBiConicalBead(cx, cy, w, h, colors, borderColor) {
    const halfW = w / 2;
    const halfH = h / 2;
    const taper = halfW * 0.45;

    ctx.save();
    // Bead drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    // 3D Gradient
    const grad = ctx.createLinearGradient(cx - halfW, cy - halfH, cx + halfW, cy + halfH);
    grad.addColorStop(0, colors.top);
    grad.addColorStop(0.5, colors.mid);
    grad.addColorStop(1, colors.bot);

    // Bi-conical hexagonal path
    ctx.beginPath();
    ctx.moveTo(cx - halfW + taper, cy - halfH);
    ctx.lineTo(cx + halfW - taper, cy - halfH);
    ctx.lineTo(cx + halfW, cy);
    ctx.lineTo(cx + halfW - taper, cy + halfH);
    ctx.lineTo(cx - halfW + taper, cy + halfH);
    ctx.lineTo(cx - halfW, cy);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Subtle edge highlight
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Central reflection ridge
    ctx.beginPath();
    ctx.moveTo(cx - halfW + 6, cy);
    ctx.lineTo(cx + halfW - 6, cy);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawBrassCorner(x, y, w, h, orientation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((orientation * 90 * Math.PI) / 180);
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, 6);
    ctx.lineTo(6, 6);
    ctx.lineTo(6, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Rivet dot
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(3, 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // User Interaction (Click / Tap / Drag)
  function setupDomListeners() {
    // Canvas pointer events
    canvas.addEventListener('pointerdown', handlePointerDown);

    // Controls
    document.getElementById('rod-select').addEventListener('change', (e) => {
      engine.setRods(parseInt(e.target.value, 10));
      recalculateGeometry();
      updateBeadTargetPositions(false);
      syncInputs();
    });

    document.getElementById('type-select').addEventListener('change', (e) => {
      engine.setType(e.target.value);
      recalculateGeometry();
      updateBeadTargetPositions(false);
      syncInputs();
    });

    document.getElementById('theme-select').addEventListener('change', (e) => {
      theme = e.target.value;
      document.body.className = `theme-${theme}`;
    });

    document.getElementById('lang-btn').addEventListener('click', toggleLanguage);

    // Inputs
    const decInput = document.getElementById('dec-input');
    decInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = BigInt(decInput.value.replace(/[^0-9]/g, '') || '0');
        engine.setValue(val);
        updateBeadTargetPositions(true);
        audio.playBeadClack(1.0, 1.0);
        syncInputs(false);
        checkQuiz();
      }
    });

    const romInput = document.getElementById('rom-input');
    romInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = AbacusEngine.fromRoman(romInput.value);
        if (val > 0) {
          engine.setValue(BigInt(val));
          updateBeadTargetPositions(true);
          audio.playBeadClack(1.0, 1.0);
          syncInputs(true);
          checkQuiz();
        } else {
          audio.playError();
        }
      }
    });

    // Action Buttons
    document.getElementById('btn-clear').addEventListener('click', () => {
      engine.clear();
      updateBeadTargetPositions(true);
      audio.playClearCascade(engine.rods);
      syncInputs();
      checkQuiz();
    });

    document.getElementById('btn-random').addEventListener('click', () => {
      const max = Math.min(999999, Math.pow(10, engine.rods) - 1);
      const randVal = Math.floor(Math.random() * max);
      engine.setValue(BigInt(randVal));
      updateBeadTargetPositions(true);
      audio.playBeadClack(1.2, 0.9);
      syncInputs();
      checkQuiz();
    });

    document.getElementById('btn-quiz').addEventListener('click', startQuiz);
    document.getElementById('btn-sound-toggle').addEventListener('click', (e) => {
      const active = audio.toggle();
      e.currentTarget.classList.toggle('muted', !active);
    });
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Hit test on beads
    for (const bead of beadVisuals) {
      const dx = Math.abs(x - bead.x);
      const dy = Math.abs(y - bead.currentY);

      if (dx <= beadWidth / 2 && dy <= beadHeight / 2 + 3) {
        // Bead hit!
        const col = bead.col;
        if (bead.isUpper) {
          engine.toggleUpper(col, bead.idx);
        } else {
          engine.toggleLower(col, bead.idx);
        }

        const pitch = 0.8 + (col / engine.rods) * 0.6;
        audio.playBeadClack(pitch, 1.0);

        updateBeadTargetPositions(true);
        syncInputs();
        checkQuiz();
        break;
      }
    }
  }

  function syncInputs(skipRoman = false) {
    const val = engine.getValue();
    const decInput = document.getElementById('dec-input');
    const romInput = document.getElementById('rom-input');
    const breakdownEl = document.getElementById('place-value-text');

    decInput.value = val.toLocaleString('de-DE');
    if (!skipRoman) {
      romInput.value = AbacusEngine.toRoman(val);
    }
    if (breakdownEl) {
      breakdownEl.innerHTML = engine.getPlaceValueBreakdown() || '0';
    }
  }

  function startQuiz() {
    mode = 'quiz';
    const max = Math.min(4999, Math.pow(10, Math.min(4, engine.rods)) - 1);
    quizTarget = Math.floor(Math.random() * (max - 12)) + 12;
    engine.clear();
    updateBeadTargetPositions(true);
    syncInputs();

    const banner = document.getElementById('quiz-banner');
    banner.classList.remove('hidden', 'success');
    banner.innerHTML = `<strong>${i18n[lang].quizActive}</strong> <span class="quiz-number">${quizTarget}</span> (Römisch: <em>${AbacusEngine.toRoman(quizTarget)}</em>)`;
  }

  function checkQuiz() {
    if (mode !== 'quiz') return;
    const val = Number(engine.getValue());
    if (val === quizTarget) {
      audio.playSuccess();
      const banner = document.getElementById('quiz-banner');
      banner.classList.add('success');
      banner.innerHTML = `<strong>${i18n[lang].quizCorrect}</strong> (${quizTarget})`;
      mode = 'free';
    }
  }

  function toggleLanguage() {
    lang = lang === 'de' ? 'en' : 'de';
    document.getElementById('lang-btn').textContent = lang.toUpperCase();

    // Update static texts
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang][key]) el.textContent = i18n[lang][key];
    });
  }

  // Bootstrap
  document.addEventListener('DOMContentLoaded', init);
})();
