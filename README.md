# AI Text Summarizer

A simple, clean web application that turns long text into clear, concise summaries using AI.

## Features

* Paste or type text to summarize
* Choose output format: **Bullet Points** or **Paragraph**
* One-click copy to clipboard
* Real-time character counter
* Dark / Light mode toggle

## Tech Stack

* Frontend: HTML5, CSS3, Vanilla JavaScript
* Backend: Node.js, Express.js
* AI: OpenAI SDK

## Setup & Running

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure environment**:
   Create a `.env` file in the `server` directory (see `.env.example`):
   ```env
   OPENAI_API_KEY=your_api_key_here
   PORT=3000
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open in browser**:
   Visit `http://localhost:3000`
