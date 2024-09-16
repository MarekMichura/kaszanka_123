import { Router, Request, Response } from "express";
import puppeteer, { Browser, executablePath } from "puppeteer";
import { BrowserParams } from "../Utils/BrowserParams";

const router = Router();

interface ResultForm {
  day: string;
  lessons: any;
}

router.get("/", async (req: Request, res: Response) => {
  const browser = await puppeteer.launch();
  try {
    const queryParam = req.query.group ? req.query.group : req.query.teacher;
    const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];

    const page = await browser.newPage();
    await page.goto("https://zstio.edu.pl/plan/n/podzgodz/index.php", {
      waitUntil: "networkidle2",
    });

    if (req.query.group) await page.select("select", "C060DE4793092D8E");
    else {
      const optionValues = await page.evaluate((param: any) => {
        const selectElement = document.querySelector<HTMLSelectElement>(
          "body > div:nth-child(1) > form > select:nth-child(2)"
        );

        if (!selectElement) return null;

        const options = Array.from(selectElement.options);
        const matchingOption = options.find(
          (option) => option.innerText === param
        );

        return matchingOption ? matchingOption.value : null;
      }, queryParam);

      await page.select("select[name='nauczyciel']", String(optionValues));
    }

    await page.waitForNetworkIdle();
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("tr")).map((el) => {
        return Array.from(el.querySelectorAll("td")).map((z) => z.innerText);
      });
    });
    data.splice(0, 1);

    const result: ResultForm[] = [];

    for (let i = 1; i <= 5; ++i) {
      const dayLessons = data.map((row) => {
        const sub = row[i].split("\n").filter((w) => w != "");
        const tmp = [];

        for (let i = 0; i < (sub.length < 5 ? 1 : 2); ++i) {
          if (req.query.group)
            tmp.push({
              lesson: sub[i * 4 + 1],
              time: row[0].split("\n")[1],
              teacher: sub[i * 4],
              group: sub[i * 4 + 2],
              room: sub[i * 4 + 3],
            });
          else if (req.query.teacher)
            tmp.push({
              lesson: sub[1],
              group: sub[2],
              class: sub[0],
              room: sub[3],
              time: row[0].split("\n")[1],
            });
        }
        return tmp;
      });

      result.push({
        day: days[i - 1],
        lessons: req.query.group
          ? dayLessons
              .flat()
              .filter(
                (y) => y.group == "Cała klasa" || y.group == req.query.group
              )
          : req.query.teacher
          ? dayLessons.flat().filter((y) => y.room || y.lesson)
          : [],
      });
    }
    res.json(result);
    await browser.close();
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
