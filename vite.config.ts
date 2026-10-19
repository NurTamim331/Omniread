import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-chat-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/api/chat', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk: Buffer) => {
              bodyStr += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const openrouterKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
                const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

                if (!openrouterKey && !geminiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      error:
                        'Server setup: Please set OPENROUTER_API_KEY (or GEMINI_API_KEY) in your .env file.',
                    })
                  );
                  return;
                }

                const {
                  messages = [],
                  prompt = '',
                  quotedText,
                  documentContext,
                  documentName,
                } = JSON.parse(bodyStr || '{}');

                let dynamicSystemInstruction =
                  'You are an expert reading assistant and scholarly study tutor embedded inside a minimal PDF reader. Explain words, sentences, grammar, and concepts clearly with markdown formatting.';

                if (documentContext) {
                  dynamicSystemInstruction += `\n\n=== UPLOADED DOCUMENT ("${
                    documentName || 'Document'
                  }") ===\n${documentContext.slice(
                    0,
                    48000
                  )}\n=== END OF UPLOADED DOCUMENT ===\nYou have full access to this document. When answering questions, reference this document directly.`;
                }

                // If OpenRouter key is present, use OpenRouter with free models chain
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
                      'HTTP-Referer': 'http://localhost:5173',
                      'X-Title': 'Minimal PDF Reader AI Tutor',
                    },
                    body: JSON.stringify({
                      model: 'openrouter/free',
                      models: [
                        'openrouter/free',
                        'meta-llama/llama-3.3-70b-instruct:free',
                        'meta-llama/llama-3.1-8b-instruct:free',
                      ],
                      messages: openRouterMessages,
                      temperature: 0.7,
                      max_tokens: 2048,
                    }),
                  });

                  if (!openrouterRes.ok) {
                    const errorData = (await openrouterRes.json().catch(() => ({}))) as any;
                    res.statusCode = openrouterRes.status;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(
                      JSON.stringify({
                        error:
                          errorData?.error?.message ||
                          `OpenRouter API error ${openrouterRes.status}`,
                      })
                    );
                    return;
                  }

                  const data = (await openrouterRes.json()) as any;
                  const text = data.choices?.[0]?.message?.content;
                  const modelUsed = data.model || 'OpenRouter Free';

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      text: text || 'No response generated.',
                      model: modelUsed,
                      groundingSources: [],
                    })
                  );
                  return;
                }

                // Fallback to Gemini API if only Gemini key is available
                const contents: Array<{
                  role: 'user' | 'model';
                  parts: Array<{ text: string }>;
                }> = [];
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
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

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
                  const errorData = (await geminiRes.json().catch(() => ({}))) as any;
                  res.statusCode = geminiRes.status;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      error:
                        errorData?.error?.message ||
                        `Gemini API error ${geminiRes.status}`,
                    })
                  );
                  return;
                }

                const data = (await geminiRes.json()) as any;
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

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    text: text || 'No response generated.',
                    groundingSources: groundingSources.slice(0, 5),
                  })
                );
              } catch (err: unknown) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error:
                      err instanceof Error
                        ? err.message
                        : 'Internal server error processing chat.',
                  })
                );
              }
            });
          });
        },
      },
    ],
  };
});
