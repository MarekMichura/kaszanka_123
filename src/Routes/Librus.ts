import { Router, Request, Response } from "express";
import puppeteer, { Browser, executablePath } from "puppeteer";
import {
  GetAnnouncements,
  GetLatestGrades,
  GetLuckyNumber,
  GetMessages,
  GetTimeTable,
} from "../Utils/AnnouncementUtils";
import { BrowserParams } from "../Utils/BrowserParams";
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  let browser: Browser | null = null;

  try {
    const startTime = performance.now();
    browser = await puppeteer.launch(BrowserParams);
    res.locals.browser.set(browser);

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36"
    );

    await page.goto("https://portal.librus.pl/rodzina/", {
      waitUntil: "networkidle2",
    });

    // Przykład dalszego procesu - kliknięcia, wypełniania formularza itd.
    await page.click(
      "#consent-categories-description > div.modal-footer.justify-content-end > div > div > button.modal-button__primary"
    );
    await page.waitForNavigation();

    await page.waitForSelector("#dropdownTopRightMenuButton");
    await page.click("#dropdownTopRightMenuButton");
    await page.click("#dropdownSynergiaMenu > a:nth-child(2)");

    let iframe;
    for (let i = 0; i < 3; ++i) {
      try {
        await page.waitForSelector("iframe");
        const iframeHandle = await page.$("iframe");
        if (!iframeHandle) {
          throw new Error("Iframe not found");
        }
        iframe = await iframeHandle.contentFrame();
        if (!iframe) {
          throw new Error("Could not get iframe content");
        }
        await iframe.waitForSelector("#Login", { timeout: 5000 });
        const login = await iframe.$("#Login");
        await iframe.waitForSelector("#Pass", { timeout: 5000 });
        const pass = await iframe.$("#Pass");
        await iframe.waitForSelector("#LoginBtn");
        const loginBtn = await iframe.$("#LoginBtn");
        if (login && pass && loginBtn) {
          await login.type(process.env.LibrusLogin ?? "");
          await pass.type(process.env.LibrusPassword ?? "");
          await page.keyboard.press("Enter");
          await page.waitForNavigation({ waitUntil: "load" });

          const results = await Promise.all([
            GetAnnouncements(browser),
            GetMessages(
              browser,
              req.query.LastMessageTime as string | undefined
            ),
            GetTimeTable(browser),
            GetLuckyNumber(page),
            GetLatestGrades(browser),
          ]);
          const endTime = performance.now();

          res.status(200).json({
            LuckyNumber: results[3],
            Announcements: results[0],
            Messages: results[1],
            TimeTable: results[2],
            Grades: results[4],
            Debug: {
              Duration: ((endTime - startTime) / 1000).toFixed(2) + "s",
              Date: new Date().toLocaleString(),
              RequestUrl:
                req.protocol + "://" + req.get("host") + req.originalUrl,
            },
          });
          await browser.close();
          return;
        }
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

module.exports = router;
