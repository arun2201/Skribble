import { io } from "socket.io-client";

let socket = null;
let currentToken = null; // Track the token used to create the socket

function getSocket() {
  const token = localStorage.getItem("whiteboard_user_token");

  // If a socket already exists with the SAME token, reuse it
  if (socket && socket.connected && currentToken === token) {
    return socket;
  }

  // Disconnect existing socket if any (token changed or disconnected)
  if (socket) {
    socket.disconnect();
  }

  // Remember which token this socket was created with
  currentToken = token;

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
