// Captures the play page's opening view as the loading poster
// (assets/images/play-poster.webp) and the social preview image
// (assets/images/og.jpg). Needs puppeteer-core, Chrome, Python with Pillow,
// and the site served locally:
//   python3 -m http.server 4174
//   node tools/capture-poster.mjs http://localhost:4174
import { execFileSync } from "node:child_process";
import puppeteer from "puppeteer-core";

const base = process.argv[2] || "http://localhost:4174";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});

async function capture(width, height, path) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`${base}/play/`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__playStats, { timeout: 60000 });
  await page.addStyleTag({ content: ".playStage > :not(#world) { visibility: hidden !important; }" });
  await new Promise((r) => setTimeout(r, 500));
  const canvas = await page.$("#world");
  await canvas.screenshot({ path });
  await page.close();
}

// Wider than nearly any screen (see .playPoster in styles.css). Check the
// result: a leaf or bird can drift past the camera, so rerun if one did.
await capture(2160, 960, "/tmp/play-poster.png");
await browser.close();

execFileSync("python3", ["-c", `
from PIL import Image
p = Image.open("/tmp/play-poster.png").convert("RGB")
p.resize((1024, round(p.height * 1024 / p.width)), Image.LANCZOS).save("assets/images/play-poster.webp", quality=42, method=6)
w = round(p.height * 1200 / 630)
left = (p.width - w) // 2
p.crop((left, 0, left + w, p.height)).resize((1200, 630), Image.LANCZOS).save("assets/images/og.jpg", quality=76, optimize=True, progressive=True)
`]);
