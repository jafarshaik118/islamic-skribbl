require('dotenv').config();
const express = require('express');
const ngrok = require('@ngrok/ngrok');
const path = require('path');
const getPort = require('get-port').default;

const app = express();

// Serve the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    // Find a free port (default 3000)
    const PORT = await getPort({ port: 3000 });

    // Start Express server
    app.listen(PORT, async () => {
      console.log(`📍 Local: http://localhost:${PORT}`);

      // Connect ngrok
      let url;
      try {
        const ngrokOptions = {
          addr: PORT
        };

        // If NGROK_AUTHTOKEN environment variable is set, use it
        if (process.env.NGROK_AUTHTOKEN) {
          ngrokOptions.authtoken = process.env.NGROK_AUTHTOKEN;
        }

        const listener = await ngrok.connect(ngrokOptions);
        url = listener.url();
        console.log(`🌍 Ngrok tunnel live at: ${url}`);
      } catch (ngrokErr) {
        console.error('❌ Ngrok connection failed:', ngrokErr.message);
        console.error('💡 Set your authtoken: set NGROK_AUTHTOKEN=your_token_here');
        console.error('   Then run: node index.js');
      }
    });

  } catch (err) {
    console.error('❌ Error starting server:', err);
  }
})();
