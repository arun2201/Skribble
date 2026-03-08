import { io } from "socket.io-client";

let socket = null;

function getSocket() {
  const token = localStorage.getItem("whiteboard_user_token");

  // If a socket already exists with the correct token, return it
  if (socket && socket.connected) {
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create a new socket connection with the current token
  socket = io(process.env.REACT_APP_NODE_API_URL, {
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return socket;
}

// Initialize socket on first import
socket = getSocket();

export { getSocket };
export default socket;
