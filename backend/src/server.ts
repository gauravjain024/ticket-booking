import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import { initSockets } from "./sockets/socket";
import { authenticateToken } from "./middlewares/authMiddleware";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", eventRoutes);

initSockets(io);

server.listen(3000, () => console.log("Server running on port 3000"));

export { io };
