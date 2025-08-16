export function arrayBufferToBase64(buffer) {
  // Convert ArrayBuffer to Uint8Array
  const bytes = new Uint8Array(buffer);

  // Convert each byte to a character
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Convert binary string to base64
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  // Convert base64 to binary string
  const binary = window.atob(base64);

  // Create Uint8Array with same length as binary string
  const bytes = new Uint8Array(binary.length);

  // Convert each character back to byte
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // Return the ArrayBuffer
  return bytes.buffer;
}
