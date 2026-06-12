import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Lazy initialize GoogleGenAI client to prevent crash on startup if key is missing
  let aiClient: GoogleGenAI | null = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it to Settings > Secrets.');
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // API Route: Code Assistant & Consultant powered by gemini-3.5-flash
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Invalid or missing messages parameter.' });
        return;
      }

      const client = getAiClient();

      // Transform messages into contents schema for Gemini API
      // systemInstruction configures the AI's persona
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const systemInstruction = `You are the Luxarion Autonomous Lead AI Architect.
Luxarion is a next-generation 3D graphics engine offering:
1. Dual-backend rendering with WebGL (maximal compatibility fallback) + WebGPU (high-performance compute pipelines, StorageBuffers).
2. TSL (Three Shader Language) as first-class citizen - a node-based shader ecosystem (e.g. positionNode.add(normalNode.mul(timeNode))) that generates GLSL or WGSL shader code directly instead of string concat.
3. Modern ESM tree-shakeable architecture, TypeScript first, and built-in post-processing passes.

Your job is to assist developers in building graphics shaders, custom meshes, post-processing filters, and architectural integrations in Luxarion.
When writing custom shaders, provide visual node explanations, TSL JavaScript syntax, and compare WebGL GLSL against WebGPU WGSL.
Avoid references to Three.js unless directly comparing compatibility. Be proud, precise, highly technical, and conversational. Keep snippets functional and elegant.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "I was unable to formulate a response. Please try again.";
      res.json({ content: replyText });
    } catch (error: any) {
      console.error('Gemini proxy error:', error);
      res.status(500).json({ error: error.message || 'An error occurred during conversational processing.' });
    }
  });

  // Vite Static / Dev Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite middleware in development mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build output...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Luxarion Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
});
