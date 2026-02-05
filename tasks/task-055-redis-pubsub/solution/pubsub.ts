// FIXED: Redis pub/sub properly unsubscribes and cleans up subscriptions
// No more memory leaks or zombie subscriptions

type MessageHandler = (message: string, channel: string) => void;

const publisher = new Bun.RedisClient();
const subscriber = new Bun.RedisClient();

const subscriptions = new Map<string, MessageHandler>();
const activeChannels = new Set<string>();
let messageCount = 0;

export function getMessageCount(): number {
  return messageCount;
}

export function resetMessageCount(): void {
  messageCount = 0;
}

export async function subscribe(channel: string, handler: MessageHandler): Promise<void> {
  // FIXED: Check if already subscribed to prevent duplicate handlers
  if (activeChannels.has(channel)) {
    // Replace the handler but don't re-subscribe
    subscriptions.set(channel, handler);
    return;
  }

  subscriptions.set(channel, handler);
  activeChannels.add(channel);

  await subscriber.subscribe(channel, (message: string, ch: string) => {
    // FIXED: Check if still subscribed before processing
    if (!activeChannels.has(ch)) {
      return;
    }

    messageCount++;
    const currentHandler = subscriptions.get(ch);
    if (currentHandler) {
      currentHandler(message, ch);
    }
  });
}

export async function unsubscribe(channel: string): Promise<void> {
  // FIXED: Remove from both tracking structures
  subscriptions.delete(channel);
  activeChannels.delete(channel);

  // FIXED: Actually unsubscribe from Redis with await
  await subscriber.unsubscribe(channel);
}

export async function publish(channel: string, message: string): Promise<number> {
  return await publisher.publish(channel, message);
}

export function getSubscriptionCount(): number {
  return subscriptions.size;
}

export function isSubscribed(channel: string): boolean {
  return subscriptions.has(channel) && activeChannels.has(channel);
}

export async function cleanup(): Promise<void> {
  // FIXED: Unsubscribe from all channels in Redis
  for (const channel of activeChannels) {
    await subscriber.unsubscribe(channel);
  }

  // Clear local tracking
  subscriptions.clear();
  activeChannels.clear();

  // FIXED: Close both connections
  await subscriber.quit();
  await publisher.quit();
}

// Example usage
async function main() {
  const messages: string[] = [];

  await subscribe("news", (message) => {
    messages.push(message);
    console.log("Received:", message);
  });

  await publish("news", "Hello World");

  // Wait for message
  await Bun.sleep(100);

  console.log("Messages before unsubscribe:", messages.length);

  // Unsubscribe (now works correctly)
  await unsubscribe("news");

  // This message will NOT be received after proper unsubscribe
  await publish("news", "This should not be received");

  await Bun.sleep(100);

  console.log("Messages after unsubscribe:", messages.length);
  console.log("Total message count:", getMessageCount());

  await cleanup();
}

export { publisher, subscriber };
export default main;
