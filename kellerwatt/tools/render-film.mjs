// render-film.mjs
// ---------------------------------------------------------------------------
// Renders the KellerWatt "film" (kw-film.html — a React/DOM animation, NOT a
// <video>) into kw-film.webm by SCREEN-RECORDING real-time playback, which you
// then convert to kw-film.mp4 with ffmpeg.
//
// WHY real-time (and not frame-by-frame seeking): several scenes animate with
// CSS transitions (e.g. the battery shrinking and sliding right at ~47s). Those
// only tween during continuous playback — seeking to a timestamp snaps straight
// to the end state, so a seek-based capture drops the in-between frames and the
// motion looks like it abruptly "jumps". Recording the film as it actually plays
// reproduces every transition exactly as a desktop viewer sees it.
//
// WHY an MP4 at all: the live DOM animation crashes iOS Safari/Chrome ("Can't
// open this page") because it exceeds the iOS WebKit per-tab memory budget. A
// plain MP4 in a <video> tag is bulletproof on every phone. See ../README.md.
//
// PREREQUISITES
//   1. Serve the repo root:           python3 -m http.server 8000
//   2. Google Chrome + puppeteer:     npm install puppeteer-core
//   3. ffmpeg (puppeteer screencast and the convert step both use it):
//                                     brew install ffmpeg
//
// USAGE
//   node render-film.mjs              # records kw-film.webm of real-time playback
//   # then convert + normalise to exactly 72s @ 30fps (see README for why):
//   #   ffprobe ... to read the recorded duration (REC), then:
//   #   ffmpeg -y -i kw-film.webm -vf "setpts=(72/REC)*PTS,fps=30" -an \
//   #          -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 \
//   #          -movflags +faststart kw-film.mp4
// ---------------------------------------------------------------------------
import puppeteer from 'puppeteer-core';

const CHROME    = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FFMPEG    = '/opt/homebrew/bin/ffmpeg';
const FILM_URL  = 'http://127.0.0.1:8000/kellerwatt/kw-film.html';
const OUT_WEBM  = 'kw-film.webm';
const DUR       = 72;   // film length in seconds (matches the transport bar 1:12)
const W = 1280, H = 720; // 16:9, the film's native design aspect

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(FILM_URL, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 2500)); // let the bundle reconstruct + React mount

// The Stage library always renders its own built-in transport bar (inline
// styles only, no class names). Hide it so it doesn't appear in the recording.
await page.addStyleTag({ content: `
  #film-root div[style*="max-width: 680px"]{display:none !important;}
  #film-root div[style*="bottom: 0px"]{display:none !important;}
  #film-root div[style*="bottom: 0"]{display:none !important;}
` });

await page.evaluate(() => window.__seek(0));
await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

const rec = await page.screencast({ path: OUT_WEBM, ffmpegPath: FFMPEG });
await page.evaluate(() => window.__play());

// record until the film's own clock reaches the end (hard cap as a safety valve)
const t0 = Date.now();
let t = 0;
while (t < DUR - 0.1 && Date.now() - t0 < (DUR + 15) * 1000) {
  await new Promise(r => setTimeout(r, 250));
  t = await page.evaluate(() => window.__getTime());
}
await new Promise(r => setTimeout(r, 400));
await rec.stop();
console.log(`Recorded ${OUT_WEBM} (last film t=${t.toFixed(2)}s).`);
console.log('NOTE: screencast wall-clock duration ≈ real time but its frame');
console.log('timestamps run slow, so the webm is longer than 72s. Read its');
console.log('duration with ffprobe and normalise with the setpts command in');
console.log('the header / README before publishing.');
await browser.close();
