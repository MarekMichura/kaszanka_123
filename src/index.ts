import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import { RequestTimeout } from "./Middlewares/RequestTimeout";
import { AuthenticationCheck } from "./Middlewares/AuthenticationCheck";
dotenv.config();
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
app.use(RequestTimeout(240000));
app.use(AuthenticationCheck);

app.use("/Api/V1/librus", require("./Routes/Librus"));
app.use("/Api/V1/zstio", require("./Routes/ZSTIO"));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
