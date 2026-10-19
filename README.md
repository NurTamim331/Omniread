# OmniRead

> A minimalist, all-in-one reading environment built to eliminate the constant friction of switching between PDFs, translators, and AI chat windows.

---

## 💡 The Motivation

Anyone who reads academic research papers, technical documentation, or foreign-language books knows the exhausting cycle of **"Three-Tab Fatigue"**:

1. **Tab 1 — The PDF**: You're reading a dense document and encounter an unfamiliar term, a complex sentence, or a foreign idiom.
2. **Tab 2 — Google Translate**: You copy the text, switch tabs, paste it into   Google Translate to understand the literal meaning.
3. **Tab 3 — ChatGPT / Claude / Gemini**: You copy the paragraph again, switch to an AI chat, and prompt it to explain the context, syntax, or underlying concept.

Then you switch back to the PDF, only to realize you’ve lost your place on the page, lost your train of thought, and spent more time managing tabs and clipboard text than actually absorbing the material.

**OmniRead was created to solve this exact problem.**

The goal is simple: **bring the translator and the AI study companion directly into the reader itself.** You never have to leave the page, switch tabs, or copy and paste text over and over again.

---

## 🖥️ How It Works

OmniRead organizes the entire study flow into a unified, distraction-free **split workspace**:

```
+------------------------------------------+-----------------------+
|                                          |   TRANSLATOR PANEL    |
|                                          |   Instant definitions |
|           CONTINUOUS PDF VIEWER          |   & translations      |
|           - Multi-page smooth scroll     +-----------------------+
|           - Text selection action popup  |   AI STUDY TUTOR      |
|           - Color highlights & underline |   - Explains context  |
|           - Permanent annotated export   |   - Reads entire PDF  |
|                                          |   - Token Saver mode  |
+------------------------------------------+-----------------------+
```

When reading, you simply highlight any word, phrase, or paragraph in the PDF. An instant action menu appears right beside your cursor:

- **Translate**: Instantly populates the translation panel with the translated text.
- **Explain**: Passes the excerpt directly to the AI tutor with a single click to break down grammar, clarify nuance, or define technical concepts.
- **Highlight / Underline**: Annotates the document immediately in your chosen color.

---

## ✨ Features

### 📄 Continuous-Scroll PDF Reader
- **Smooth Continuous Scroll**: Read multi-page documents as one seamless vertical stream rather than clicking through rigid page flips.
- **Precision Text Selection**: Native text-layer alignment ensures words and sentences highlight cleanly without erratic jumps across lines.
- **Multi-Color Annotations**: Highlight important insights in Yellow, Green, Blue, or Pink, or use the underline tool for subtle emphasis.
- **Annotation Controls**: Delete individual highlights on hover, or use the quick Undo and Clear tools in the toolbar.
- **Export Annotated PDF**: Saves your highlights directly into the PDF binary so your annotations remain permanently visible in any standard PDF reader (Adobe Acrobat, Apple Preview, Chrome).
- **Exit Protection**: Warns you before you close or navigate away if you have unsaved annotations, so your work is never lost.

### 🌐 Integrated Translation Panel
- **Zero Copy-Paste**: Selecting text in the PDF and clicking "Translate" immediately translates it in the side panel.
- **Bilingual Review**: View original and translated passages side-by-side.
- **One-Click Send to AI**: Send translated phrases straight to the AI tutor for deeper semantic or grammatical clarification.

### 🤖 Intelligent AI Study Tutor
- **Deep Document Awareness**: The AI reads the entire uploaded PDF, allowing you to ask broad questions (*"Summarize chapter 2"*, *"What methodology was used?"*, *"What are the main conclusions?"*).
- **Selection-Based Questioning**: Highlight any sentence or paragraph and ask the AI specific questions about that exact excerpt.
- **Token-Saver Mode (`Doc Context: ON / OFF`)**:
  - `Doc Context: ON`: Sends the full document for deep, comprehensive analysis.
  - `⚡ Doc Context: OFF`: Omits full document background to spend over 90% fewer tokens while still giving fast, accurate explanations of selected passages.
- **Zero-Cost Free Tier Routing**: Equipped with automated free-model routing and fallbacks, ensuring reliable responses without hitting rate limits.

### 🎨 Minimalist, Focused Interface
- **Adjustable Split Layout**: Drag the dividing border to customize the ratio between the PDF and the utility panels.
- **Individual Fullscreen Modes**: Expand the PDF, Translator, or AI Chat to full screen whenever you need deep, single-task focus.
- **Light & Dark Themes**: Toggle between high-contrast light mode and eye-friendly dark mode for comfortable reading day or night.

---

## 🛠️ Built With

- **React 19 & TypeScript** — Responsive UI and robust state management
- **PDF.js (`pdfjs-dist`)** — High-performance PDF rendering and text layer synchronization
- **pdf-lib** — Client-side PDF manipulation and annotation embedding
- **Tailwind CSS v4** — Clean, modern, distraction-free styling
- **OpenRouter Free Model API** — Free AI completions with automatic model fallbacks
