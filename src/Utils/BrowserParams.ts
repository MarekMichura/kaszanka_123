import { executablePath, PuppeteerLaunchOptions } from "puppeteer";

export const BrowserParams: PuppeteerLaunchOptions = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  headless: false,
  executablePath:
    process.env.NODE_ENV === "production"
      ? process.env.PUPETEER_EXECUTABLE_PATH
      : executablePath(),
};
