import { Server } from "socket.io";

export const initSockets = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("joinRoom", ( eventId ) => {
      console.log(`User joined event room: ${eventId}`);
      socket.join(eventId);
    });

    socket.on("disconnect", () => console.log("User disconnected"));
  });
};
