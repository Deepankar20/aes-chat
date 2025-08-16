export async function generateAESKey() {
  // THIS IS WHERE AES KEY IS CREATED
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256, // AES-256 (256-bit key)
    },
    true, // Key is extractable
    ["encrypt", "decrypt"] // Key can be used for both operations
  );

  return key;
}

// FIXED: Generate SAME key for all users in same room
export async function generateSharedKey(roomName) {
  // Create deterministic seed from room name
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(roomName + "-my-secret-key-2024"),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive the same AES key for everyone using same room name
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("fixed-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function decryptMessage(ciphertext, key, iv) {
  // THIS IS WHERE AES DECRYPTION HAPPENS
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM", // Same AES algorithm
      iv: iv, // Same IV used for encryption
    },
    key, // Same AES key
    ciphertext // Encrypted data
  );

  // Convert bytes back to text
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export async function encryptMessage(message, key, iv) {
  // Convert message to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // THIS IS WHERE AES HAPPENS
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM", // AES algorithm in GCM mode
      iv: iv, // Initialization vector
    },
    key, // AES key
    data // Message data to encrypt
  );

  return encrypted; // Returns ArrayBuffer with encrypted data
}
