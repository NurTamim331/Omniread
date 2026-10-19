export type FullscreenTarget = 'none' | 'pdf' | 'translate' | 'gemini';

export type ReaderTheme = 'light' | 'dark' | 'sepia';

export type MobileTab = 'document' | 'translate' | 'gemini';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
];

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  targetLang: string;
  timestamp: number;
}

export interface GroundingSource {
  title?: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini' | 'system';
  text: string;
  timestamp: number;
  quotedText?: string;
  groundingSources?: GroundingSource[];
  isError?: boolean;
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
}

export interface PDFDocumentInfo {
  name: string;
  size?: number;
  numPages: number;
  url?: string;
}

export interface SelectionActionPosition {
  x: number;
  y: number;
  text: string;
  pageNumber: number;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface AnnotationRect {
  x: number; // 0..1 ratio of page width
  y: number; // 0..1 ratio of page height
  width: number; // 0..1 ratio of page width
  height: number; // 0..1 ratio of page height
}

export interface Annotation {
  id: string;
  pageNumber: number;
  type: 'highlight' | 'underline';
  color: string;
  rects: AnnotationRect[];
  text: string;
  createdAt: number;
}
