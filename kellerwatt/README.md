# KellerWatt — film page

This folder holds the KellerWatt landing page and its "film". The page is shown
as-is (it intentionally does **not** match the rest of the portfolio styling).

## The film: why it's an MP4 (and not the original animation)

The original "film" (`kw-film.html`) is **not** a video — it is a self-contained
React / DOM animation (a ~1 MB bundle of React + JSX scenes, gzip+base64 embedded
and reconstructed in the browser). It plays fine on desktop, but on real iPhones
it crashes both Safari and Chrome-for-iOS with **"Can't open this page."**

Root cause: iOS gives each browser tab a hard memory budget and kills the page's
render process when a page allocates too much, too fast. The live animation
(React mount + bundle reconstruction + DOM scenes) trips that budget on iPhone-class
devices. Shrinking it (removing Babel, swapping dev→prod React) reduced memory ~16×
but **still** crashed, because the whole DOM-animation architecture is the problem,
not its size.

**Fix:** render the animation once into a real `kw-film.mp4` and play it with a plain
`<video controls playsinline>` tag — exactly how video is normally delivered on the
web. A decoded MP4 streams frame-by-frame and never spikes memory, so it plays on
every iPhone and Android. (The site already self-hosts MP4s elsewhere, e.g.
`assets/images/spider.mp4`.)

## Files

| File | Purpose |
|------|---------|
| `index.html`        | The landing page. Plays `kw-film.mp4` in a `<video>` tag. |
| `kw-film.mp4`       | The rendered film (H.264, 1280×720, 30 fps, ~72 s, silent). **Served to users.** |
| `film-poster.jpg`   | Poster frame shown before the video plays. |
| `kw-film.html`      | Original React/DOM animation. **Kept only as the render source** — no longer loaded by visitors. |
| `tools/render-film.mjs` | Script that captures the animation to PNG frames (see below). |

## How `kw-film.mp4` was generated

The film is **screen-recorded during real-time playback**, then normalised to a
clean 72 s / 30 fps MP4.

> Why not capture frame-by-frame by seeking? Several scenes animate with CSS
> transitions (e.g. the battery shrinking + sliding right at ~47 s). Those only
> tween during continuous playback — seeking jumps straight to the end state, so
> a seek-based capture drops the in-between frames and the motion looks like it
> abruptly "jumps". Recording real-time playback reproduces every transition.

1. **Serve the repo locally** (from the repo root):
   ```sh
   python3 -m http.server 8000
   ```
2. **Record real-time playback** with headless Chrome (needs `npm install
   puppeteer-core`, Google Chrome, and ffmpeg). From `kellerwatt/tools/`:
   ```sh
   node render-film.mjs              # writes kw-film.webm (1280×720)
   ```
   The script plays the film start-to-finish and screen-records it, hiding the
   animation's built-in transport bar so it doesn't appear in the recording.
3. **Normalise to 72 s @ 30 fps and encode to MP4.** Puppeteer's screencast keeps
   the *content* correct but writes slow frame timestamps, so the raw `.webm` runs
   ~86 s. Read its real duration, then retime uniformly back to 72 s:
   ```sh
   REC=$(ffprobe -v error -select_streams v:0 -show_entries format=duration \
                 -of default=noprint_wrappers=1:nokey=1 kw-film.webm)   # e.g. 86.44
   ffmpeg -y -i kw-film.webm \
          -vf "setpts=(72/${REC})*PTS,fps=30" -an \
          -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 \
          -movflags +faststart kw-film.mp4
   ```
   - `setpts=(72/REC)*PTS` → compresses the stretched timeline back to 72 s.
   - `-pix_fmt yuv420p` + `-profile:v high` → plays on all modern iOS/Android.
   - `-movflags +faststart` → playback starts before the whole file downloads.
   - The film is silent, so `-an` drops the (empty) audio track.
4. **Make the poster** from a representative frame (the opening title card ~4 s):
   ```sh
   ffmpeg -y -ss 4 -i kw-film.mp4 -frames:v 1 -q:v 3 film-poster.jpg
   ```
5. Copy `kw-film.mp4` and `film-poster.jpg` into this `kellerwatt/` folder.

### Smoothing fast transitions (optional)

Some scenes change faster than the screencast reliably captures (e.g. the battery
shrinking/fading into the grid at ~47 s), so they can look like they "skip". To
fix one window, slow it slightly and motion-interpolate just that span to 60 fps,
leaving the rest at normal speed — then concat. Example (slow 47.0–48.2 s by 2.3×):

```sh
ffmpeg -y -i kw-film.mp4 -filter_complex "
[0:v]trim=0:47.0,setpts=PTS-STARTPTS,fps=60[a];
[0:v]trim=47.0:48.2,setpts=2.3*(PTS-STARTPTS),minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1[b];
[0:v]trim=48.2:72,setpts=PTS-STARTPTS,fps=60[c];
[a][b][c]concat=n=3:v=1[out]" -map "[out]" -r 60 \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 -movflags +faststart kw-film.mp4
```

`minterpolate` (motion-compensated) synthesises clean in-between frames; choose
cut points in low-motion moments so the speed change isn't jarring. This adds
~1.4 s, giving the published ~73 s file.

If the animation in `kw-film.html` changes, re-run steps 1–5 (plus this smoothing
step if needed) to regenerate the video.
