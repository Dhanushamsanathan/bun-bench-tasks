import { expect, test, afterAll } from "bun:test";
import server from "../src/server";

afterAll(() => {
  server.stop();
});

function calculateChecksum(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum = (sum + data[i]) % 65536;
  }
  return sum;
}

test("WebSocket should preserve binary data integrity", async () => {
  const ws = new WebSocket("ws://localhost:3022");

  // Create binary data with bytes that would be corrupted as text
  const originalData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG header
  const originalChecksum = calculateChecksum(originalData);

  const responsePromise = new Promise<ArrayBuffer>((resolve, reject) => {
    ws.binaryType = "arraybuffer";
    ws.onmessage = (event) => {
      resolve(event.data);
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Send binary data
  ws.send(originalData.buffer);

  const response = await responsePromise;
  const receivedData = new Uint8Array(response);
  const receivedChecksum = calculateChecksum(receivedData);

  // Test FAILS because buggy code converts binary to text, corrupting the data
  expect(receivedData.length).toBe(originalData.length);
  expect(receivedChecksum).toBe(originalChecksum);

  ws.close();
});

test("WebSocket should handle high-byte binary values", async () => {
  const ws = new WebSocket("ws://localhost:3022");

  // Create binary data with high byte values (>127) that break text encoding
  const originalData = new Uint8Array([0xff, 0xfe, 0xfd, 0xfc, 0x80, 0x81, 0x82, 0x83]);
  const originalChecksum = calculateChecksum(originalData);

  const responsePromise = new Promise<ArrayBuffer>((resolve, reject) => {
    ws.binaryType = "arraybuffer";
    ws.onmessage = (event) => {
      resolve(event.data);
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  // Send binary data with high bytes
  ws.send(originalData.buffer);

  const response = await responsePromise;
  const receivedData = new Uint8Array(response);
  const receivedChecksum = calculateChecksum(receivedData);

  // Test FAILS because high bytes get corrupted in text conversion
  expect(receivedData.length).toBe(originalData.length);
  expect(receivedChecksum).toBe(originalChecksum);

  ws.close();
});

test("WebSocket should echo back exact binary buffer", async () => {
  const ws = new WebSocket("ws://localhost:3022");

  // Create a buffer with null bytes and special characters
  const originalData = new Uint8Array([0x00, 0x01, 0x02, 0x00, 0xff, 0x00, 0xab, 0xcd]);

  const responsePromise = new Promise<ArrayBuffer>((resolve, reject) => {
    ws.binaryType = "arraybuffer";
    ws.onmessage = (event) => {
      resolve(event.data);
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  ws.send(originalData.buffer);

  const response = await responsePromise;
  const receivedData = new Uint8Array(response);

  // Test FAILS because null bytes and special chars break text encoding
  expect(Array.from(receivedData)).toEqual(Array.from(originalData));

  ws.close();
});

test("WebSocket should return binary type for binary input", async () => {
  const ws = new WebSocket("ws://localhost:3022");

  const originalData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

  const responsePromise = new Promise<{ data: ArrayBuffer | string; isBinary: boolean }>((resolve, reject) => {
    ws.binaryType = "arraybuffer";
    ws.onmessage = (event) => {
      resolve({
        data: event.data,
        isBinary: event.data instanceof ArrayBuffer,
      });
    };
    ws.onerror = (error) => {
      reject(error);
    };
    setTimeout(() => reject(new Error("Timeout")), 5000);
  });

  await new Promise<void>((resolve) => {
    ws.onopen = () => resolve();
  });

  ws.send(originalData.buffer);

  const response = await responsePromise;

  // Test FAILS because buggy code sends back text string instead of binary
  expect(response.isBinary).toBe(true);

  ws.close();
});
