# 🎨 Islamic Skribbl 🌙

Multiplayer drawing and guessing game featuring Islamic words and terminology.

## 🚀 Quick Start

### Option 1: Local Play (No Setup Required)

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

### Option 2: Remote Play with Ngrok (Requires Setup)

**First-time setup:**

1. Install dependencies:
```bash
npm install
```

2. Sign up for a free ngrok account at https://ngrok.com

3. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

4. Create a `.env` file by copying the example:
```bash
copy .env.example .env
```

5. Edit `.env` and replace `your_ngrok_token_here` with your actual token:
```
NGROK_AUTHTOKEN=your_actual_token_here
```

6. Run the server:
```bash
node index.js
```

7. Share the ngrok URL with friends to play remotely!

## 📁 Project Structure

- `server.js` - Main game server (local only)
- `index.js` - Server with ngrok support (public URL)
- `public/` - Client-side files (HTML, CSS, JS)
- `.env` - Your ngrok token (DO NOT commit this!)
- `.env.example` - Template for team members

## 🎮 Features

- ✨ 100+ Islamic words across 3 difficulty levels
- 🎨 Interactive HTML5 canvas drawing
- 💬 Real-time chat and guessing
- 🏆 Global leaderboard
- 🔒 Password-protected rooms
- ⚙️ Customizable game settings
- 📱 Mobile-friendly with touch support

## 🔐 Security Note

**NEVER commit your `.env` file!** It's already added to `.gitignore` to prevent this.
