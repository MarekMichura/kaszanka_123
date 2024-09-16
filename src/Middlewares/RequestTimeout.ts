import { NextFunction, Request, Response } from "express";
import { Browser } from "puppeteer";

export const RequestTimeout = (timeLimit: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let browser: Browser | null = null;

    res.locals.browser = {
      set: (br: Browser) => {
        browser = br;
      },
      close: async () => {
        if (browser) {
          await browser.close();
        }
      },
    };

    const timeoutId = setTimeout(async () => {
      if (!res.headersSent) {
        res.status(503).json({ error: "Request timed out" });
        if (browser) {
          await browser.close();
        }
      }
    }, timeLimit);

    res.on("finish", () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};
