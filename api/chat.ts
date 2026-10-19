/**
 * Serverless API endpoint for Gemini AI Chat.
 * 
 * Features:
 * - Document Awareness: Full access to the uploaded PDF text & page structure.
 * - Live Internet Browsing: Grounding with Google Search for up-to-date real-world facts & references.
 * - Server-side security: GEMINI_API_KEY is kept private on the server.
 */

const SYSTEM_INSTRUCTION = `You are an expert reading assistant and scholarly study tutor embedded inside a minimal PDF reader.
Your purpose is to help the reader comprehend documents deeply, clarify difficult sentences, explain foreign idioms or technical jargon, provide context, and summarize passages.

Guidelines:
1. When a document is loaded, you have FULL ACCESS to its text. Synthesize its content, reference specific pages, and clarify any questions regarding the document.
2. Use Google Search grounding when needed to provide extra context, real-world examples, definitions, or recent historical/scientific developments.
3. When referencing external web sources found via search, cite them naturally.
4. Structure your answers cleanly with Markdown (bullet points, bold key terms, short paragraphs).
5. Be encouraging, concise, and intellectually precise.`;

export async function POST(req: Request) {
  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!openrouterKey && !apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Server setup required: Please configure OPENROUTER_API_KEY (or GEMINI_API_KEY) in your environment variables (.env file).',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const {
      messages = [],
      prompt = '',
      quotedText,
      documentContext,
      documentName,
    } = await req.json();

    if (!prompt && !quotedText) {
      return new Response(
        JSON.stringify({ error: 'No prompt or quoted text provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system instruction including document context
    let dynamicSystemInstruction = SYSTEM_INSTRUCTION;
    if (documentContext) {
      dynamicSystemInstruction += `\n\n=== UPLOADED DOCUMENT CONTENT ("${
        documentName || 'Document'
      }") ===\n${documentContext.slice(0, 48000)}\n=== END OF UPLOADED DOCUMENT CONTENT ===\nYou have full access to this document. When answering questions, reference this document directly.`;
    }

    // If OpenRouter key is present, route to OpenRouter free models
    if (openrouterKey) {
      const openRouterMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: dynamicSystemInstruction },
      ];

      for (const msg of messages) {
        if (msg.sender === 'system' || msg.isError) continue;
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        let text = msg.text;
        if (msg.quotedText && msg.sender === 'user') {
          text = `[Referenced Text from PDF]:\n"${msg.quotedText}"\n\nQuestion/Instruction:\n${msg.text}`;
        }
        openRouterMessages.push({ role, content: text });
      }

      let currentTurnText = prompt;
      if (quotedText) {
        currentTurnText = `[Referenced Text from PDF]:\n"${quotedText}"\n\n${
          prompt || 'Please explain this passage and its key vocabulary.'
        }`;
      }
      openRouterMessages.push({ role: 'user', content: currentTurnText });

      const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://minimal-pdf-reader.local',
          'X-Title': 'Minimal PDF Reader AI Tutor',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-super-120b-a12b:free',
          models: [
            'nvidia/nemotron-3-super-120b-a12b:free',
            'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
            'cohere/north-mini-code:free',
          ],
          messages: openRouterMessages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!openrouterRes.ok) {
        const errorData = await openrouterRes.json().catch(() => ({}));
        return new Response(
          JSON.stringify({
            error:
              errorData?.error?.message ||
              `OpenRouter API error ${openrouterRes.status}`,
          }),
          { status: openrouterRes.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await openrouterRes.json();
      const choice = data.choices?.[0]?.message;
      const text = choice?.content || choice?.reasoning;
      return new Response(
        JSON.stringify({
          text: text || 'No response generated.',
          model: data.model || 'Nvidia Nemotron 120B (Free)',
          groundingSources: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build Gemini contents array
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Prior turns
    for (const msg of messages) {
      if (msg.sender === 'system' || msg.isError) continue;
      const role = msg.sender === 'user' ? 'user' : 'model';
      let text = msg.text;
      if (msg.quotedText && msg.sender === 'user') {
        text = `[Referenced Text from PDF]:\n"${msg.quotedText}"\n\nQuestion/Instruction:\n${msg.text}`;
      }
      contents.push({
        role,
        parts: [{ text }],
      });
    }

    // Current turn
    let currentTurnText = prompt;
    if (quotedText) {
      currentTurnText = `[Referenced Text from PDF]:\n"${quotedText}"\n\n${
        prompt || 'Please explain this passage and its key vocabulary.'
      }`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: currentTurnText }],
    });

    const model = 'gemini-3.8-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: dynamicSystemInstruction }],
        },
        contents,
        tools: [
          {
            google_search: {},
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json().catch(() => ({}));
      const message =
        errorData?.error?.message ||
        `Gemini API request failed with status ${geminiRes.status}.`;
      return new Response(JSON.stringify({ error: message }), {
        status: geminiRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await geminiRes.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    // Extract grounding search metadata / web citations
    const groundingChunks =
      candidate?.groundingMetadata?.groundingChunks || [];
    const groundingSources: Array<{ title?: string; url?: string }> = [];

    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        groundingSources.push({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
        });
      }
    }

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No response generated by Gemini.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        text,
        groundingSources: groundingSources.slice(0, 5),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : 'Internal server error processing request.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Node compatibility handler
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (typeof req.json === 'function') {
    return POST(req);
  }

  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!openrouterKey && !apiKey) {
      return res.status(500).json({
        error:
          'Server setup required: Please configure OPENROUTER_API_KEY (or GEMINI_API_KEY) in your environment variables.',
      });
    }

    const {
      messages = [],
      prompt = '',
      quotedText,
      documentContext,
      documentName,
    } = req.body || {};

    let dynamicSystemInstruction = SYSTEM_INSTRUCTION;
    if (documentContext) {
      dynamicSystemInstruction += `\n\n=== UPLOADED DOCUMENT CONTENT ("${
        documentName || 'Document'
      }") ===\n${documentContext.slice(0, 48000)}\n=== END OF UPLOADED DOCUMENT CONTENT ===\nYou have full access to this document. When answering questions, reference this document directly.`;
    }

    if (openrouterKey) {
      const openRouterMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: dynamicSystemInstruction },
      ];

      for (const msg of messages) {
        if (msg.sender === 'system' || msg.isError) continue;
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        let text = msg.text;
        if (msg.quotedText && msg.sender === 'user') {
          text = `[Referenced Text from PDF]:\n"${msg.quotedText}"\n\nQuestion/Instruction:\n${msg.text}`;
        }
        openRouterMessages.push({ role, content: text });
      }

      let currentTurnText = prompt;
      if (quotedText) {
        currentTurnText = `[Referenced Text from PDF]:\n"${quotedText}"\n\n${
          prompt || 'Please explain this passage and its key vocabulary.'
        }`;
      }
      openRouterMessages.push({ role: 'user', content: currentTurnText });

      const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://minimal-pdf-reader.local',
          'X-Title': 'Minimal PDF Reader AI Tutor',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-super-120b-a12b:free',
          models: [
            'nvidia/nemotron-3-super-120b-a12b:free',
            'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
            'cohere/north-mini-code:free',
          ],
          messages: openRouterMessages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!openrouterRes.ok) {
        const errorData = await openrouterRes.json().catch(() => ({}));
        return res.status(openrouterRes.status).json({
          error: errorData?.error?.message || `OpenRouter API error ${openrouterRes.status}`,
        });
      }

      const data = await openrouterRes.json();
      const choice = data.choices?.[0]?.message;
      const text = choice?.content || choice?.reasoning;
      return res.status(200).json({
        text: text || 'No response generated.',
        model: data.model || 'Nvidia Nemotron 120B (Free)',
        groundingSources: [],
      });
    }

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const msg of messages) {
      if (msg.sender === 'system' || msg.isError) continue;
      const role = msg.sender === 'user' ? 'user' : 'model';
      let text = msg.text;
      if (msg.quotedText && msg.sender === 'user') {
        text = `[Referenced Text from PDF]:\n"${msg.quotedText}"\n\nQuestion/Instruction:\n${msg.text}`;
      }
      contents.push({ role, parts: [{ text }] });
    }

    let currentTurnText = prompt;
    if (quotedText) {
      currentTurnText = `[Referenced Text from PDF]:\n"${quotedText}"\n\n${
        prompt || 'Please explain this passage and its key vocabulary.'
      }`;
    }
    contents.push({ role: 'user', parts: [{ text: currentTurnText }] });

    const model = 'gemini-3.8-flash';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: dynamicSystemInstruction }],
        },
        contents,
        tools: [
          {
            google_search: {},
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json().catch(() => ({}));
      return res.status(geminiRes.status).json({
        error: errorData?.error?.message || `Gemini API error: ${geminiRes.status}`,
      });
    }

    const data = await geminiRes.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    const groundingChunks =
      candidate?.groundingMetadata?.groundingChunks || [];
    const groundingSources: Array<{ title?: string; url?: string }> = [];
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        groundingSources.push({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
        });
      }
    }

    return res.status(200).json({
      text: text || 'No response generated.',
      groundingSources: groundingSources.slice(0, 5),
    });
  } catch (err: unknown) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}
