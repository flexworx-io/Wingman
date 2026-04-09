/**
 * Wingman Real-Time WebSocket Server
 * Provides live activity feed streaming via Socket.IO
 * All activity events are broadcast to authenticated user rooms
 */
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { getWingmanByUserId, getActivityFeed } from "./db";

export interface ActivityEvent {
  id: number;
  wingmanId: number;
  activityType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  isRead: boolean;
}

export interface WingmanStatusEvent {
  wingmanId: number;
  status: "active" | "discovering" | "introducing" | "idle";
  currentAction?: string;
}

let io: SocketIOServer | null = null;

/**
 * Initialize the Socket.IO server attached to the HTTP server
 */
export function initWebSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/ws",
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Join user-specific room for targeted broadcasts
    socket.on("join:user", async (userId: number) => {
      const roomId = `user:${userId}`;
      await socket.join(roomId);
      console.log(`[WS] User ${userId} joined room ${roomId}`);

      // Send initial activity feed on join
      try {
        const wingman = await getWingmanByUserId(userId);
        if (wingman) {
          const feed = await getActivityFeed(wingman.id, 10);
          socket.emit("activity:initial", feed);
          socket.emit("wingman:status", {
            wingmanId: wingman.id,
            status: wingman.status === "active" ? "active" : "idle",
            currentAction: wingman.status === "active" ? "Scanning for compatible connections..." : "Dormant",
          } as WingmanStatusEvent);
        }
      } catch (err) {
        console.error("[WS] Error sending initial feed:", err);
      }
    });

    // Join wingman-specific room for Wingman activity
    socket.on("join:wingman", async (wingmanId: number) => {
      const roomId = `wingman:${wingmanId}`;
      await socket.join(roomId);
      console.log(`[WS] Wingman ${wingmanId} room joined`);
    });

    socket.on("disconnect", () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });

    // Ping/pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });
  });

  console.log("[WS] WebSocket server initialized on /api/ws");
  return io;
}

/**
 * Broadcast a new activity event to a specific user's room
 */
export function broadcastActivityEvent(userId: number, event: ActivityEvent): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("activity:new", event);
}

/**
 * Broadcast Wingman status update to a specific user
 */
export function broadcastWingmanStatus(userId: number, status: WingmanStatusEvent): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("wingman:status", status);
}

/**
 * Broadcast a new connection event
 */
export function broadcastNewConnection(userId: number, connection: {
  wingmanName: string;
  compatibilityScore: number;
  avatarUrl?: string;
}): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("connection:new", {
    ...connection,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast a new introduction event
 */
export function broadcastIntroduction(userId: number, intro: {
  fromWingman: string;
  toWingman: string;
  compatibilityScore: number;
}): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("introduction:new", {
    ...intro,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast a travel alert (friends nearby)
 */
export function broadcastTravelAlert(userId: number, alert: {
  city: string;
  friendCount: number;
  friends: Array<{ wingmanName: string; avatarUrl?: string }>;
}): void {
  if (!io) return;
  io.to(`user:${userId}`).emit("travel:alert", {
    ...alert,
    timestamp: Date.now(),
  });
}

/**
 * Get the Socket.IO server instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}
