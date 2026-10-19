/**
 * Translation service supporting English to various target languages
 * with multi-engine resilience (Google Translate Web API, MyMemory API).
 */

export async function translateEnglishTo(
  text: string,
  targetLang: string
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // 1. Primary Engine: Google Translate Web API
  try {
    const encoded = encodeURIComponent(trimmed);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encoded}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((item: unknown[]) => (Array.isArray(item) && item[0] ? String(item[0]) : ''))
          .join('');
        if (translated.trim()) {
          return translated;
        }
      }
    }
  } catch (err) {
    console.warn('Google Translate API failed, trying fallback...', err);
  }

  // 2. Fallback Engine: MyMemory Translated API
  try {
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      trimmed
    )}&langpair=en|${targetLang}`;
    const memRes = await fetch(memUrl);
    if (memRes.ok) {
      const memData = await memRes.json();
      if (memData?.responseData?.translatedText) {
        return memData.responseData.translatedText;
      }
    }
  } catch (err) {
    console.warn('MyMemory fallback failed:', err);
  }

  throw new Error('Unable to translate. Please check your internet connection.');
}

/**
 * Text-to-speech helper
 */
export function speakText(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}
