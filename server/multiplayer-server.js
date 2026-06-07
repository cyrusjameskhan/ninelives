'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 8797);
let nextRoomId = 1;
let waitingClient = null;
const rooms = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'content-type': 'application/json'});
    res.end(JSON.stringify({ok: true, waiting: Boolean(waitingClient), rooms: rooms.size}));
    return;
  }
  res.writeHead(200, {'content-type': 'text/plain'});
  res.end('Nine Lives multiplayer server\n');
});

const wss = new WebSocketServer({server});

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function peerOf(ws) {
  const room = rooms.get(ws.roomId);
  if (!room) return null;
  return room.p1 === ws ? room.p2 : room.p1;
}

function clearRoom(ws) {
  if (waitingClient === ws) waitingClient = null;
  const room = rooms.get(ws.roomId);
  if (!room) return;
  rooms.delete(ws.roomId);
  const peer = room.p1 === ws ? room.p2 : room.p1;
  if (peer && peer.readyState === peer.OPEN) {
    peer.roomId = null;
    send(peer, {type: 'peer-left'});
  }
}

function joinQueue(ws) {
  if (ws.roomId || waitingClient === ws) return;
  if (waitingClient && waitingClient.readyState === waitingClient.OPEN) {
    const roomId = `room-${nextRoomId++}`;
    const p1 = waitingClient;
    const p2 = ws;
    waitingClient = null;
    p1.roomId = roomId;
    p2.roomId = roomId;
    rooms.set(roomId, {p1, p2});
    send(p1, {type: 'start', role: 'p1', roomId});
    send(p2, {type: 'start', role: 'p2', roomId});
    return;
  }
  waitingClient = ws;
  send(ws, {type: 'waiting'});
}

wss.on('connection', ws => {
  ws.roomId = null;

  ws.on('message', data => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    if (msg.type === 'join') {
      joinQueue(ws);
      return;
    }
    if (msg.type === 'input' || msg.type === 'state' || msg.type === 'round-end') {
      const peer = peerOf(ws);
      if (peer) send(peer, msg);
    }
  });

  ws.on('close', () => clearRoom(ws));
  ws.on('error', () => clearRoom(ws));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Nine Lives multiplayer server listening on ${PORT}`);
});
