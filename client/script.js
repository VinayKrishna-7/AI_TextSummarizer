document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('summarize-form');
  const textInput = document.getElementById('text-input');
  const charCounter = document.getElementById('char-counter');
  const summarizeBtn = document.getElementById('summarize-btn');
  const btnText = summarizeBtn.querySelector('.btn-text');
  const errorMessage = document.getElementById('error-message');
  const resultSection = document.getElementById('result-section');
  const summaryOutput = document.getElementById('summary-output');
  const copyBtn = document.getElementById('copy-btn');

  // Determine API endpoint:
  // If page is served directly by Express on port 3000, use relative path.
  // Otherwise (e.g., VS Code Live Server on port 5500, or file://), point to Express backend on port 3000.
  const isExpressHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '3000';
  const API_BASE = isExpressHost ? '' : 'http://localhost:3000';
  const API_URL = `${API_BASE}/api/summarize`;

  let isSubmitting = false;
  let copyTimeoutId = null;

  // Real-time character counter
  function updateCharCount() {
    const count = textInput.value.length;
    charCounter.textContent = `${count.toLocaleString()} ${count === 1 ? 'character' : 'characters'}`;
  }

  textInput.addEventListener('input', () => {
    updateCharCount();
    // Clear validation error when user starts typing
    if (errorMessage.textContent) {
      hideError();
    }
  });

  // Display error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  // Hide error message
  function hideError() {
    errorMessage.textContent = '';
    errorMessage.hidden = true;
  }

  const formatRadios = document.querySelectorAll('input[name="summary-format"]');

  // Set loading state
  function setLoading(loading) {
    isSubmitting = loading;
    summarizeBtn.disabled = loading;
    textInput.disabled = loading;
    formatRadios.forEach(radio => radio.disabled = loading);
    btnText.textContent = loading ? 'Summarizing...' : 'Summarize';
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const rawText = textInput.value;
    const trimmedText = rawText.trim();
    const selectedFormat = form.querySelector('input[name="summary-format"]:checked')?.value || 'bullets';

    // Frontend validation: empty or whitespace-only check
    if (!trimmedText) {
      showError('Please enter some text to summarize.');
      textInput.focus();
      return;
    }

    hideError();
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: rawText,
          format: selectedFormat
        })
      });

      // Safely parse JSON response
      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        data = null;
      }

      if (!response.ok) {
        const errorMsg = data && data.error
          ? data.error
          : `Server returned an error (${response.status}). Please make sure the backend server is running.`;
        throw new Error(errorMsg);
      }

      if (!data || !data.summary) {
        throw new Error('No summary was returned by the server.');
      }

      // Display summary safely as text
      summaryOutput.textContent = data.summary;
      resultSection.hidden = false;

      // Reset copy button state if previous summary was copied
      resetCopyButton();

      // Scroll summary into view smoothly
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      let message = err.message || 'Something went wrong. Please try again.';
      if (err.name === 'TypeError' && message.toLowerCase().includes('fetch')) {
        message = 'Unable to reach backend server. Please make sure the Express server is running (npm start in server folder).';
      }
      showError(message);
    } finally {
      setLoading(false);
    }
  });

  // Handle Copy to Clipboard
  function resetCopyButton() {
    if (copyTimeoutId) {
      clearTimeout(copyTimeoutId);
      copyTimeoutId = null;
    }
    copyBtn.textContent = 'Copy';
    copyBtn.disabled = false;
  }

  copyBtn.addEventListener('click', async () => {
    const textToCopy = summaryOutput.textContent;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      copyBtn.textContent = 'Copied!';

      if (copyTimeoutId) {
        clearTimeout(copyTimeoutId);
      }

      copyTimeoutId = setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyTimeoutId = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
      copyBtn.textContent = 'Failed to copy';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    }
  });

  // Dark Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
    if (themeText) themeText.textContent = isDark ? 'Light' : 'Dark';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    localStorage.setItem('theme', theme);
  }

  // Initialize theme from localStorage or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // Initial character count update
  updateCharCount();
});
