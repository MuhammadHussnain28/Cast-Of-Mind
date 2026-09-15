import { Server } from 'socket.io';
import env from '../config/env.js';
import { setSocketServer } from './emitter.js';
import { registerHandlers } from './socketHandlers.js';
import {
  authenticateSocket,
  authoriseSocketRole,
  authoriseSocketSubscription,
  joinOwnRooms,
} from './socketAuth.js';

/**
 * The Socket.io server — master spec §14.
 *
 * ATTACHED IN server.js, NOT IN app.js. `app.js` stays a plain Express app with
 * no transport of its own, so supertest keeps working and the whole Jest suite
 * runs without a socket server in sight. That separation is also what makes the
 * REST path provably independent rather than nominally so.
 */
export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    // Locked to the same origin the REST layer allows. Sockets do not inherit
    // Express's CORS — configured here or it is wide open.
    cors: {
      origin: env.clientOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // The refresh cookie is path-scoped to /api/v1/auth and is not used here;
    // the socket authenticates with the access token in the handshake.
    serveClient: false,
  });

  // In order: who are you, are you allowed a socket at all, is your
  // subscription live, and what rooms are you in. Each refuses the CONNECTION
  // rather than an event, so a rejected user never reaches a room.
  io.use(authenticateSocket);
  io.use(authoriseSocketRole);
  io.use(authoriseSocketSubscription);

  // ROOM JOINING IS MIDDLEWARE, NOT A CONNECTION HANDLER — and that is a real
  // fix rather than a tidy-up. The client's `connect` event fires as soon as
  // the handshake completes. Joining rooms inside `io.on('connection')` meant
  // awaiting a database query AFTER that point, so a client could believe it
  // was connected, send immediately, and have the message emitted to a room the
  // recipient had not joined yet — persisted correctly but never delivered in
  // real time, with nothing anywhere reporting a problem. Middleware completes
  // before the connection is established, so by the time either side sees
  // "connected", both are already in their rooms.
  io.use((socket, next) => {
    joinOwnRooms(socket)
      .then(() => next())
      .catch((error) => {
        console.error('[socket] could not resolve rooms:', error.message);
        next(Object.assign(new Error('Server error.'), { data: { code: 'SERVER_ERROR' } }));
      });
  });

  // Synchronous, so every handler is attached before any client packet is
  // processed. An async body here would drop the first events a keen client
  // sends — the same class of race as the room joining above.
  io.on('connection', (socket) => registerHandlers(socket));

  setSocketServer(io);
  return io;
}

export default createSocketServer;
