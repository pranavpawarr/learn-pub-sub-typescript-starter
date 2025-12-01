import type { ConfirmChannel } from "amqplib";

export function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T
): Promise<void> {
  const jsonBytes = Buffer.from(JSON.stringify(value));
  return new Promise((resolve, reject) => {
    ch.publish(
      exchange,
      routingKey,
      jsonBytes,
      { contentType: "application/json" },
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      }
    );
  });
}
