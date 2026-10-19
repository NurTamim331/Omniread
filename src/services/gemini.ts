import type { ChatMessage, GroundingSource } from '../types';

export interface GeminiResponse {
  text: string;
  groundingSources?: GroundingSource[];
  model?: string;
}

/**
 * Sends chat prompt to the secure /api/chat serverless endpoint.
 * Passes document context so Gemini can read the entire PDF,
 * and leverages live Google Search grounding.
 */
export async function sendGeminiMessage(
  history: ChatMessage[],
  newMessage: string,
  quotedText?: string,
  googleToken?: string,
  documentContext?: string,
  documentName?: string
): Promise<GeminiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(googleToken ? { Authorization: `Bearer ${googleToken}` } : {}),
    },
    body: JSON.stringify({
      messages: history,
      prompt: newMessage,
      quotedText,
      documentContext,
      documentName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 504) {
      throw new Error(
        'The free AI model took longer than Netlify\'s 10-second limit. Tip: Toggle "Doc Context: OFF" in the top bar for 3x faster responses, or retry in a moment.'
      );
    }
    if (response.status === 502) {
      throw new Error(
        'Server gateway error (502). Please verify your OPENROUTER_API_KEY is configured in your Netlify site settings (and trigger a redeploy), or retry shortly.'
      );
    }
    throw new Error(
      errorData?.error || `Chat request failed with status ${response.status}.`
    );
  }

  const data = await response.json();
  if (!data?.text) {
    throw new Error('No response was received from Gemini.');
  }

  return {
    text: data.text,
    model: data.model,
    groundingSources: data.groundingSources || [],
  };
}
