import { env } from "./env";
import { createApp } from "./app";
import { logger } from "./lib/logger";

const app = createApp();

app.listen(env.API_PORT, () => {
  logger.info("Lightsite API listening", {
    url: `http://localhost:${env.API_PORT}`,
  });
});
