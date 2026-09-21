const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_CHAR_LIMIT = 20000;

// Initialize OpenAI client (supports official OpenAI or free OpenAI-compatible providers like Groq)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || undefined
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static frontend files from client directory
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Summarize API endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { text, format } = req.body;

    // Validate presence and content of text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    // Validate text length
    if (text.length > MAX_CHAR_LIMIT) {
      return res.status(400).json({
        error: `Text is too large. Maximum allowed length is ${MAX_CHAR_LIMIT.toLocaleString()} characters.`
      });
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('Server Error: OPENAI_API_KEY is not set in server/.env');
      return res.status(500).json({
        error: 'OpenAI API key is not configured on the server. Please add OPENAI_API_KEY to server/.env.'
      });
    }

    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Choose prompt based on user's preferred format: 'paragraph' or 'bullets'
    const isParagraph = format === 'paragraph';
    const systemPrompt = isParagraph
      ? 'You are an expert text summarization assistant. Summarize the user\'s text into clear, readable, and concise prose. Preserve all essential facts, main ideas, and context without inventing any information. Return only the summary in cohesive prose without bullet points or conversational filler.'
      : 'You are an expert text summarization assistant. Summarize the user\'s text into clear, accurate, and informative bullet points. Extract all key facts, takeaways, and essential context without inventing any information. Format each key takeaway as a bullet point starting with "• ". Return only the bullet points without any introductory or concluding conversational filler.';

    // Request summary from OpenAI (or OpenAI-compatible provider)
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: text.trim()
        }
      ],
      temperature: 0.2
    });

    const summary = response.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(502).json({
        error: 'Unable to generate summary. The AI model returned an empty response.'
      });
    }

    return res.status(200).json({ summary });
  } catch (error) {
    // Log detailed technical error for debugging
    console.error('Summarization request failed:', error.message || error);

    // Provide friendly, actionable messages for common API errors without leaking secrets
    if (error.status === 429) {
      return res.status(429).json({
        error: 'OpenAI quota exceeded: You have no credits remaining on your OpenAI account. Please check your billing at platform.openai.com.'
      });
    }

    if (error.status === 401) {
      return res.status(401).json({
        error: 'Invalid OpenAI API key. Please check the OPENAI_API_KEY in server/.env.'
      });
    }

    // Return human-readable error for unexpected failures
    return res.status(500).json({
      error: 'Something went wrong while generating the summary. Please try again.'
    });
  }
});

// Fallback to index.html for root path
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
