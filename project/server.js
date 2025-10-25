
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';

const app = express();
const port = 5174;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const completion = await openai.chat.completions.create({
      model: 'qwen/qwen3-next-80b-a3b-instruct',
      messages,
      temperature: 0.6,
      top_p: 0.7,
      max_tokens: 4096,
      stream: false,
    });
    res.json({ response: completion.choices?.[0]?.message?.content || "I'm here to help." });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message || 'Proxy error' });
  }
});

app.listen(port, () => {
  console.log(`Campinnova proxy server running on http://localhost:${port}`);
});
