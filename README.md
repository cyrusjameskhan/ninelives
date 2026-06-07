# Nine Lives

A single-file browser fighting game prototype inspired by arcade fighters, built around custom cat fighter sprites, a dojo stage, embedded music, sound effects, and a CRT pixel filter.

Run it locally by opening `index.html` in a browser, or serve the folder with any static web server.

## Online multiplayer server

The browser client connects to `ws://66.135.12.137:8797` by default. To run the matchmaker locally or on a VPS:

```bash
cd server
npm install
npm start
```

Override the browser WebSocket endpoint before loading the game with `window.NINE_LIVES_WS_URL = 'ws://host:8797'`.
