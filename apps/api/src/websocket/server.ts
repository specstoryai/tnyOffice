import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { WebSocketServer } from 'ws';
import { WebSocketServerAdapter } from '@automerge/automerge-repo-network-websocket';
import { getRepo } from '../automerge/repo.js';
import { log } from '../utils/logger.js';

let io: SocketIOServer | null = null;
let wss: WebSocketServer | null = null;
let wsAdapter: WebSocketServerAdapter | null = null;

export function initWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  log.info('Initializing WebSocket server');

  // Create Socket.io server for custom events (presence, etc.)
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io/'
  });

  // Create WebSocket server for Automerge sync
  wss = new WebSocketServer({ 
    server: httpServer,
    path: '/automerge-sync'
  });

  // Create Automerge WebSocket adapter
  const repo = getRepo();
  wsAdapter = new WebSocketServerAdapter(wss);
  repo.networkSubsystem.addNetworkAdapter(wsAdapter);

  // Handle connections
  io.on('connection', (socket) => {
    log.info(`WebSocket client connected: ${socket.id}`);

    // Handle custom events (presence, etc.)
    socket.on('presence', (data) => {
      log.debug('Presence update:', data);
      // Broadcast presence to other clients in the same document room
      if (data.docId) {
        socket.to(`doc:${data.docId}`).emit('presence', data);
      }
    });

    // Join document room for presence
    socket.on('join-doc', (docId: string) => {
      socket.join(`doc:${docId}`);
      log.info(`Client ${socket.id} joined document: ${docId}`);
    });

    // Leave document room
    socket.on('leave-doc', (docId: string) => {
      socket.leave(`doc:${docId}`);
      log.info(`Client ${socket.id} left document: ${docId}`);
    });

    socket.on('disconnect', () => {
      log.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  log.info('WebSocket server initialized');
  return io;
}

export function getWebSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
}

export function closeWebSocketServer(): void {
  if (wsAdapter) {
    // Remove adapter from repo
    const repo = getRepo();
    repo.networkSubsystem.removeNetworkAdapter(wsAdapter);
    wsAdapter = null;
  }
  
  if (wss) {
    wss.close();
    wss = null;
  }
  
  if (io) {
    io.close();
    io = null;
    log.info('WebSocket servers closed');
  }
}