import { encryptMessage, decryptMessage, generateSharedKey } from "./aes.js";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./bufferarray.js";
const socket = io();
let currentRoom = null;
let username = null;
let aeskey = null;

// DOM elements
const roomSetup = document.getElementById("room-setup");
const chatArea = document.getElementById("chat-area");
const messagesDiv = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const joinBtn = document.getElementById("join-btn");
const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("room");
const status = document.getElementById("status");

// Socket connection status
socket.on("connect", () => {
  status.textContent = "Connected";
  status.className = "connected";
});

socket.on("disconnect", () => {
  status.textContent = "Disconnected";
  status.className = "disconnected";
  addSystemMessage("Disconnected from server");
});

// Join room functionality
joinBtn.addEventListener("click", joinRoom);
usernameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") joinRoom();
});
roomInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") joinRoom();
});

async function joinRoom() {
  const enteredUsername = usernameInput.value.trim();
  const enteredRoom = roomInput.value.trim();

  if (!enteredUsername) {
    alert("Please enter a username");
    return;
  }

  if (!enteredRoom) {
    alert("Please enter a room name");
    return;
  }

  username = enteredUsername;
  currentRoom = enteredRoom;

  // GENERATE ACTUAL AES KEY
  aeskey = await generateSharedKey(currentRoom);

  // Join the room
  socket.emit("join", currentRoom);

  // Switch to chat interface
  roomSetup.classList.add("hidden");
  chatArea.classList.remove("hidden");

  // Focus on message input
  messageInput.focus();

  addSystemMessage(`Joined room "${currentRoom}" as ${username}`);
}

// Message sending
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || !currentRoom || !username || !aeskey) return;

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // ACTUAL AES ENCRYPTION HAPPENS HERE
  const encrypted = await encryptMessage(message, aeskey, iv);

  // Create payload (using your server's expected format)
  const payload = {
    iv: arrayBufferToBase64(iv), // dummy values for compatibility
    ct: arrayBufferToBase64(encrypted), // base64 encoded message for compatibility
    ts: Date.now(),
  };

  // Send to server
  socket.emit("chat:ciphertext", {
    room: currentRoom,
    from: username,
    payload: payload,
  });

  // Add to our own chat
  addMessage(username, message, true);
  messageInput.value = "";
}

// Receive messages
socket.on("chat:ciphertext", async ({ from, payload }) => {
  if (from !== username) {
    // Don't show our own messages again
    try {
      // Decode the message (assuming it's base64 encoded plaintext for compatibility)
      const iv = base64ToArrayBuffer(payload.iv);
      const ciphertext = base64ToArrayBuffer(payload.ct);

      // ACTUAL AES DECRYPTION HAPPENS HERE
      const decryptedMessage = await decryptMessage(ciphertext, aeskey, iv);

      addMessage(from, decryptedMessage, false);
    } catch (err) {
      console.error("Error decoding message:", err);
      addSystemMessage(`Could not decode message from ${from}`);
    }
  }
});

// UI helper functions
function addMessage(sender, text, isOwn) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isOwn ? "own" : "other"}`;

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
                ${!isOwn ? `<div class="sender">${sender}</div>` : ""}
                <div class="text">${escapeHtml(text)}</div>
                <div class="time">${time}</div>
            `;

  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "system-message";
  messageDiv.textContent = text;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Auto-focus username input on load
window.addEventListener("load", () => {
  usernameInput.focus();
});
