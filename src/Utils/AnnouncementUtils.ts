import { Browser, Page } from "puppeteer";
export interface MessageInterface {
  Nadawca: string;
  Temat: string;
  Data: string;
  Link: string;
  Content: string | null;
}
export const GetMessages = async (
  browser: Browser,
  filterQuery?: string | undefined
) => {
  const page = await browser.newPage();
  await page.goto("https://synergia.librus.pl/wiadomosci", {
    waitUntil: "networkidle2",
  });

  let result = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(
        "#formWiadomosci > div > div > table > tbody > tr > td:nth-child(2) > table.decorated.stretch > tbody tr"
      )
    ).map((messagesRow) => {
      const messageTdElement = Array.from(messagesRow.querySelectorAll("td"))
        .map((messageTd) => messageTd.innerText)
        .filter((tdContent) => tdContent && tdContent.length > 2);
      return {
        Nadawca: messageTdElement[0]
          .trim()
          .substring(0, messageTdElement[0].indexOf(" (")),
        Temat: messageTdElement[1].trim(),
        Data: messageTdElement[2].trim(),
        Link: messagesRow.querySelector("a")?.href,
        Content: null,
      } as MessageInterface;
    });
  });

  if (filterQuery)
    result = result.filter((z) => CompareDates(z.Data, filterQuery));
  else result = result.slice(0, 3);

  await Promise.all(
    result.map(async (message) => {
      message.Content = String(await GetMessageContent(browser, message.Link));
      return message;
    })
  );
  return result;
};

const GetMessageContent = async (browser: Browser, link: string) => {
  const page = await browser.newPage();
  await page.goto(link);
  return await page.evaluate(() => {
    return document.querySelector(
      "#formWiadomosci > div > div > table > tbody > tr > td:nth-child(2) > div"
    )?.innerHTML;
  });
};

export const GetAnnouncements = async (browser: Browser) => {
  const page = await browser.newPage();
  await page.goto("https://synergia.librus.pl/ogloszenia", {
    waitUntil: "networkidle2",
  });

  return await page.evaluate(() => {
    const tbodies = document.querySelectorAll("table tbody");
    return Array.from(tbodies).map((tb) => {
      const tds = Array.from(tb.querySelectorAll("td")).map((z) => z.innerText);
      return {
        Osoba: tds[0].trim(),
        Data: tds[1].trim(),
        Tresc: tds[2].trim(),
      };
    });
  });
};

export const GetTimeTable = async (browser: Browser) => {
  const GetTimeTable = await browser.newPage();
  await GetTimeTable.goto(
    "https://synergia.librus.pl/terminarz/dodane_od_ostatniego_logowania",
    { waitUntil: "networkidle2" }
  );

  return await GetTimeTable.evaluate(() => {
    return Array.from(document.querySelectorAll("tbody tr")).map((tr) => {
      const tds = Array.from(tr.querySelectorAll("td"))
        .map((element) => element.innerText)
        .filter((z) => z.length > 1);
      return {
        CzasDodania: tds[0].trim(),
        RodzajZdarzenia: tds[1].trim(),
        DaneZdarzenia: tds[2].trim(),
      };
    });
  });
};

export const GetLuckyNumber = async (page: Page) => {
  return await page.evaluate(() => {
    return document.querySelector("#user-section > span.luckyNumber > b")
      ?.innerHTML;
  });
};

export const GetLatestGrades = async (browser: Browser) => {
  const page = await browser.newPage();
  await page.goto("https://synergia.librus.pl/przegladaj_oceny/uczen", {
    waitUntil: "networkidle2",
  });
  await page.click(
    "#body > form:nth-child(6) > div > span:nth-child(4) > a > span.fold-start"
  );
  return await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(".grade-box > a:not(#ocenaTest)")
    ).map((res) => {
      const text = `${res.getAttribute("title")}<br>Ocena: ${res.innerHTML}`
        .replace("<br/>", "")
        .split("<br>");

      return text.reduce((acc, item) => {
        const [key, value] = item.split(":").map((str) => str.trim());
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: string });
    });
  });
};

const CompareDates = (date1: string, date2: string) =>
  new Date(date1) > new Date(date2);
