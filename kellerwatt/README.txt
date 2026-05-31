KellerWatt — Landing Page Package
=================================

CONTENTS
  index.html                          The landing page (open this)
  KellerWatt Film (standalone).html   The 60-second film (embedded + standalone)
  tweaks-panel.jsx                    Tweaks panel used by the landing page
  assets/colors_and_type.css          Brand colors & type
  assets/hero.png                     Hero background image

HOW TO USE
  Upload the entire folder to your web host, keeping the structure intact
  (index.html and the film file in the same folder, assets/ alongside).
  The landing page loads index.html; the "Play the film" button loads
  "KellerWatt Film (standalone).html" in place.

NOTES
  - Internet connection required on first load: fonts (Google Fonts) and the
    React runtime load from public CDNs.
  - The film has no audio by design.
  - Everything is static HTML/CSS/JS — no build step, no server code needed.
