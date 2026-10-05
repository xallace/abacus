<div align="center">

# 🧮 Abacus & Soroban Laboratory
### Modern Interactive Bi-Quinary Reckoning & Kinematics Simulator

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00f2fe?style=for-the-badge&logo=github)](https://xallace.github.io/abacus/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Platform: Web](https://img.shields.io/badge/Platform-Web_Canvas_2D-3b82f6?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Vanilla JS](https://img.shields.io/badge/Dependencies-Zero_Vanilla_ES6-f59e0b?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Bilingual](https://img.shields.io/badge/Language-DE_%7C_EN-8b5cf6?style=for-the-badge)](#features)

*A high-fidelity modernization and pedagogical tribute to Walter Fendt’s classic educational applet (2023).*

[**🚀 Launch Live Simulator**](https://xallace.github.io/abacus/) • [**📖 Mathematical Foundations**](#mathematical-foundations) • [**✨ New Features**](#features-modern-enhancements) • [**🛠️ Local Setup**](#local-setup)

</div>

---

## 🌟 Overview

The **Abacus** is one of humanity's most ingenious mechanical calculating inventions, with origins tracing back to ancient Mesopotamia and the Roman Empire (*calculi*). In Asia, the Chinese *Suanpan* (recognized in 2013 as a UNESCO Intangible Cultural Heritage) and the Japanese *Soroban* refined the reckoning board into an astonishingly fast bi-quinary computing machine.

This project delivers a responsive, zero-dependency, client-side web laboratory for exploring decimal and Roman numeral reckoning, place-value decomposition, and mechanical arithmetic.

While Walter Fendt's original 2023 HTML5 app was restricted to a fixed 500×400 canvas, static primary colors, and silent interaction, this modernized edition introduces high-DPI responsive canvas scaling, tactile procedural Web Audio feedback (authentic wooden bead impact clicks and clearing cascades), multi-model support (Soroban, Suanpan, Roman Handabacus, Russian Schoty), and an interactive mental training quiz.

---

## ✨ Features & Modern Enhancements

| Feature | Original Applet (Walter Fendt, 2023) | Modernized Laboratory (2026) |
| :--- | :--- | :--- |
| **Viewport & Resolution** | Fixed 500 × 400 px box | Fully responsive with high-DPI / Retina canvas scaling |
| **Acoustics & Haptics** | Silent | Procedural Web Audio API synthesis (wood-on-wood bead clacks, cascading reset rattle, success chimes) |
| **Historical Abacus Variants** | Only 4+1 Soroban | **Soroban** (4+1), **Suanpan** (5+2), **Roman Handabacus** (4+1), and **Russian Schoty** (10) |
| **Visual Aesthetics** | Primary flat colors (blue/red on yellow) | Bi-conical 3D diamond beads with specular highlights, brass corner brackets, mahogany/slate/fendt themes |
| **Place-Value Mathematics** | Plain numeric digits output | Live LaTeX-style decomposition: $z = \sum d_i \cdot 10^i$ with highlighted active powers of 10 |
| **Roman Numeral Conversion** | Up to 5,000 only | Bidirectional live synchronization with canonical validation |
| **Training & Quiz Mode** | None (display only) | Interactive challenge trainer with random target generation and verification chord |
| **Internationalization** | Separate language files | Instant single-click German / English toggle (`DE` / `EN`) |
| **Dependencies** | None | **Zero external dependencies** (Vanilla ES6, HTML5 Canvas 2D, Web Audio API) |

---

## 📐 Mathematical Foundations

### 1. The Bi-Quinary Representation
The Soroban represents each decimal digit $d_i \in \{0, 1, \dots, 9\}$ on wire $i$ using a bi-quinary system (combinations of 5 and 1):

$$d_i = 5 \cdot b_{\text{upper}} + \sum_{j=1}^{4} b_{\text{lower}, j}$$

where:
* $b_{\text{upper}} \in \{0, 1\}$ denotes whether the upper heaven bead is moved down against the reckoning beam ($1$) or resting against the top frame ($0$).
* $b_{\text{lower}, j} \in \{0, 1\}$ denotes whether lower earth bead $j$ is moved up against the reckoning beam ($1$) or resting at the bottom ($0$).

This reduces the cognitive load of subitizing from 9 items down to at most 4 lower beads, enabling the rapid mental calculation techniques known as *Anzan* (暗算).

### 2. Positional Place-Value System
The total integer value $Z$ of an abacus with $n$ rods is given by:

$$Z = \sum_{i=0}^{n-1} d_i \cdot 10^i$$

where $i = 0$ corresponds to the rightmost unit wire.

---

## 🛠️ Local Setup & Deployment

Since this project has **zero build steps** and **zero npm dependencies**, you can run it instantly:

```bash
# Clone the repository
git clone https://github.com/xallace/abacus.git
cd abacus

# Open directly in your browser
open index.html   # macOS
start index.html  # Windows
```

---

## 📜 Credits & License

* Modern implementation, Web Audio synthesis, and multi-model architecture by **Walter (@xallace)** (2026).
* Pedagogical tribute to **Walter Fendt** (Studiendirektor a.D., [www.walter-fendt.de](https://www.walter-fendt.de)).
* Released under the **MIT License**.
