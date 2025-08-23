import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {
  getRedisClientInstance
} from "../../../../chunk-2TWFUMQU.js";
import "../../../../chunk-5JE7E5SU.js";
import "../../../../chunk-DVHMHG4X.js";
import {
  init_esm_shims
} from "../../../../chunk-SB7UONON.js";

// src/modules/tools/definitions/web/browser.tool.ts
init_esm_shims();
import { z } from "zod";
var getBrowser = null;
var getPageContent = null;
try {
  const browserManager = await import("./browserManager.js");
  getBrowser = browserManager.getBrowser;
  getPageContent = async (page) => {
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector("main") || document.body;
      return main.innerText;
    });
    return mainContent.replace(/\s\s+/g, " ").trim();
  };
} catch (error) {
  console.error("Failed to import Playwright dependencies:", error);
}
var parameters = z.object({
  url: z.string().url().describe("The URL to navigate to.")
});
var browserOutput = z.union([
  z.object({
    content: z.string(),
    url: z.string()
  }),
  z.object({
    erreur: z.string()
  })
]);
var sendEvent = async (ctx, type, data) => {
  if (ctx.job?.id) {
    const channel = `job:${ctx.job.id}:events`;
    const event = JSON.stringify({ data, type });
    await getRedisClientInstance().publish(channel, event);
    ctx.log.info({ channel, event }, "Published event to Redis");
  }
};
var browserTool = {
  description: "Navigates to a URL using a headless Chromium browser and returns its textual content. Ideal for modern websites with JavaScript.",
  execute: async (args, ctx) => {
    if (!getBrowser || !getPageContent) {
      return {
        erreur: "Browser tool is not available due to missing Playwright dependencies."
      };
    }
    ctx.log.info(`Navigating to URL: ${args.url}`);
    await sendEvent(ctx, "browser.navigating", { url: args.url });
    let page;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      ctx.log.info("New page created.");
      await sendEvent(ctx, "browser.page.created", {});
      ctx.log.info(`Going to ${args.url}...`);
      await page.goto(args.url, {
        timeout: 3e4,
        // 30 seconds
        waitUntil: "domcontentloaded"
      });
      ctx.log.info(`Page loaded: ${args.url}`);
      await sendEvent(ctx, "browser.page.loaded", { url: args.url });
      const content = await getPageContent(page);
      ctx.log.info(
        `Successfully retrieved content from ${args.url}. Length: ${content.length}`
      );
      await sendEvent(ctx, "browser.content.extracted", {
        length: content.length
      });
      await page.close();
      return {
        content,
        url: args.url
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ctx.log.error({ err }, `Failed to browse ${args.url}`);
      await sendEvent(ctx, "browser.error", {
        message: err.message,
        url: args.url
      });
      if (page) {
        await page.close();
      }
      return { erreur: `Error while Browse ${args.url}: ${err.message}` };
    }
  },
  name: "browser",
  parameters
};
export {
  browserOutput,
  browserTool,
  parameters
};
