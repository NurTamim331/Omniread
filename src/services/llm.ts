import type { ChatMessage } from '../types';

export interface LLMResponse {
  text: string;
  groundingSources?: any[]; // optional, kept for compatibility
}

/**
 * Sends a chat request to the backend `/api/llm` endpoint (OpenRouter proxy).
 * It translates the internal ChatMessage history into the OpenAI‑compatible format
 * expected by the proxy, forwards optional document context, and returns the assistant
 * reply text.
 */
export async function sendLLMMessage(
  history: ChatMessage[],
  newMessage: string,
  quotedText?: string,
  userJwt?: string,
  documentContext?: string,
  documentName?: string
): Promise<LLMResponse> {
  // Convert internal ChatMessage objects to OpenAI‑style messages
  const messages = history.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));
  // Append the new user message (quotedText is concatenated for clarity)
  const userContent = quotedText ? `${newMessage}\n\nQuoted: ${quotedText}` : newMessage;
  messages.push({ role: 'user', content: userContent });

  const payload: any = { messages };
  if (documentContext) payload.documentContext = documentContext;
  if (documentName) payload.documentName = documentName;

  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(userJwt ? { Authorization: `Bearer ${userJwt}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error || `LLM request failed with status ${response.status}.`);
  }

  const data = await response.json();
  // OpenRouter follows OpenAI schema: { choices: [{ message: { content } }] }
  const text = data?.choices?.[0]?.message?.content ?? '';
  return { text, groundingSources: [] };
}
