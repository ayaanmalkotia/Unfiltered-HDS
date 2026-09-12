# Unfiltered

An AI that catches you lying to yourself.

Unfiltered is a Chrome extension that watches for simple browsing patterns and uses the Gemini API to point out when your behavior doesn't match the story you're telling yourself.

For example, if you keep opening YouTube while supposedly studying, Unfiltered notices the pattern. You can click the extension and explain yourself, and Gemini analyzes the situation and gives you an honest reality check.

The goal isn't to shame you. Sometimes your reasoning is completely valid. The point is to have an AI that challenges you instead of automatically agreeing with you.

## How it works

1. The extension tracks basic browsing metadata like domains, timestamps, and visit frequency.
2. When it detects a repeated pattern, it gives you a small nudge.
3. You voluntarily explain what you're doing.
4. Gemini compares your explanation with the observed behavior.
5. Future versions will track whether your predictions actually matched what happened.

## Tech Stack

- Chrome Extension (Manifest V3)
- JavaScript, HTML, CSS
- Node.js + Express
- Google Gemini API
- Chrome Storage API

## Running locally

Clone the repo and install the server dependencies:

```bash
cd server
npm install
```

Create a `.env` file inside `server`:

```env
GEMINI_API_KEY=your_api_key_here
```

Start the server:

```bash
npm start
```

Then open `chrome://extensions`, enable Developer Mode, click "Load unpacked", and select the `extension` folder.

Keep the server running while using the extension.

## Privacy

Unfiltered does not read page contents, messages, keystrokes, emails, or purchases. The extension only uses basic browsing metadata, and the user's explanation is shared with Gemini voluntarily.

## Built for

A hackathon project powered by the Google Gemini API.
