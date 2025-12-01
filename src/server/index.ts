import amqp from "amqplib";
import type { ConfirmChannel } from "amqplib";
import { publishJSON } from "../internal/pubsub/publishjson.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";

let channel: ConfirmChannel;

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  channel = await conn.createConfirmChannel();
  console.log("Peril game server connected to RabbitMQ!");

  await channel.assertExchange("game", "direct", { durable: true });
  await channel.assertExchange(ExchangePerilDirect, "direct", {
    durable: true,
  });

  ["SIGINT", "SIGTERM"].forEach((signal) =>
    process.on(signal, async () => {
      try {
        await conn.close();
        console.log("RabbitMQ connection closed.");
      } catch (err) {
        console.error("Error closing RabbitMQ connection:", err);
      } finally {
        process.exit(0);
      }
    })
  );

  await publishJSON(channel, "game", "game", { hello: "world" });
}

main().catch(async (err) => {
  const playingState: PlayingState = { isPaused: true };
  await publishJSON(channel, ExchangePerilDirect, PauseKey, playingState);
  console.error("Fatal error:", err);
  process.exit(1);
});
