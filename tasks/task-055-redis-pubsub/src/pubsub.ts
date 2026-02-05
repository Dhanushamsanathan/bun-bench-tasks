// BUG: Redis pub/sub subscription doesn't properly unsubscribe, causing memory leaks
// Subscriptions persist even after calling unsubscribe

type MessageHandler = (message: string, channel: string) => void;

const publisher = new Bun.RedisClient();
const subscriber = new Bun.RedisClient();

const subscriptions = new Map<string, MessageHandler>();
let messageCount = 0;

export function getMessageCount(): number {
  return messageCount;
}

export function resetMessageCount(): void {
  messageCount = 0;
}

export async function subscribe(channel: string, handler: MessageHandler): Promise<void> {
  // BUG: Doesn't check if already subscribed - creates duplicate handlers
  subscriptions.set(channel, handler);

  await subscriber.subscribe(channel, (message: string, ch: string) => {
    messageCount++;
    // BUG: Always calls the handler from the Map, even if it was "removed"
    const currentHandler = subscriptions.get(ch);
    if (currentHandler) {
      currentHandler(message, ch);
    }
  });
}

export async function unsubscribe(channel: string): Promise<void> {
  // BUG: Only removes from Map, doesn't actually unsubscribe from Redis
  subscriptions.delete(channel);
  // BUG: Missing await and the actual Redis unsubscribe call
  // subscriber.unsubscribe(channel); // This line is commented out - the bug!
}

export async function publish(channel: string, message: string): Promise<number> {
  return await publisher.publish(channel, message);
}

export function getSubscriptionCount(): number {
  return subscriptions.size;
}

export function isSubscribed(channel: string): boolean {
  return subscriptions.has(channel);
}

export async function cleanup(): Promise<void> {
  // BUG: Doesn't unsubscribe from Redis, just clears the local Map
  subscriptions.clear();
  // BUG: Doesn't close the subscriber connection
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

  // Unsubscribe (but buggy - doesn't actually work)
  await unsubscribe("news");

  // This message will still be received due to the bug
  await publish("news", "This should not be received");

  await Bun.sleep(100);

  console.log("Messages after unsubscribe:", messages.length);
  console.log("Total message count:", getMessageCount());

  await cleanup();
}

export { publisher, subscriber };
export default main;
