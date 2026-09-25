# Single Speed Arizona 2027 — "The Sequel"

A one-off static site for SSAZ 2027: Feb 5–7, 2027, at Bumble Bee Ranch Adventures and Event Center in Bumble Bee, AZ.

It's plain HTML, CSS, and vanilla JS, with no build step and no dependencies beyond Google Fonts. Every path is relative, so the folder works unchanged at a domain root or in any subfolder.

## Pages

| File | What it is |
|---|---|
| `index.html` | The porta-john gate. It has the age/narc check, the hit counter, and a knock-creak-flush sound when you click the door. |
| `narc.html` | The dead end you get for clicking "I'm a narc". |
| `camp.html` | The clickable campsite. This is the main navigation. |
| `itinerary.html` | The plan (loosely). |
| `register.html` | The Cleator Yacht Club postcard: $120 cash, by mail. |
| `gear.html` | Rigs & kit. |
| `gallery.html` + `js/gallery.js` | Past years. |
| `guestbook.html` | The Atabook guestbook embed. |
| `404.html` | For GitHub Pages. |

## Preview locally

Any static server works. From this folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/.

To test it as a subfolder the way it'll run at `/ssaz/`, serve the **parent** folder instead and browse to the subfolder:

```bash
cd ..
python -m http.server 8000
```

Then open http://localhost:8000/ssaz2027/ (or whatever this folder is named).

Opening `index.html` straight from disk (`file://`) mostly works too, but the Atabook iframe behaves better over http.

## Deploy to GitHub Pages

1. Push this folder to the root of a GitHub repo (it's already set up as one).
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch", **Branch** to `main`, and the folder to `/ (root)`. Then click **Save**.
4. Wait a minute. The site will be at `https://<account>.github.io/<repo>/`.

The `.nojekyll` file tells Pages to serve the files as-is.

About "semi-secret": the GitHub Pages site is public to anyone who has the URL. The repo is public too, unless it's private on a paid plan. The `noindex` tags keep it out of search results, but they don't hide it. Don't put anything in here you wouldn't want a stranger to read.

## Drop it into `/ssaz/` on another host (e.g. drunkcyclist.com)

1. Copy the entire contents of this folder, including the hidden `.nojekyll` (harmless), into a folder called `ssaz` on the web host.
2. That's it. Every link and asset is relative, so it runs at `https://drunkcyclist.com/ssaz/` without changes.

You can skip `README.md` and `.git/` when copying.

**Robots:** crawlers only read `robots.txt` at a domain root (`/robots.txt`), so the copy inside `/ssaz/` is ignored there. The site doesn't depend on it, because every page carries `<meta name="robots" content="noindex, nofollow">`. If you control the host's root `robots.txt`, you can also add `Disallow: /ssaz/` there.

## Guestbook setup (Atabook)

Atabook (https://atabook.org) is a free guestbook service that lots of Neocities sites use. It was live and free as of Sept 2026.

1. Go to https://atabook.org and sign up. Pick a guestbook name, e.g. `ssaz2027`.
2. Your guestbook will live at `https://<name>.atabook.org/`.
3. In Atabook's settings, turn on moderation and pick a theme you like.
4. Open `guestbook.html` and find the block marked **GUESTBOOK CONFIG**. Paste the URL into it:

   ```js
   var GUESTBOOK_URL = "https://ssaz2027.atabook.org/";
   ```
5. Commit, push, and done. It loads inside the page in an iframe.

Until the URL is filled in, the page shows a fake DOS error explaining that the guestbook isn't plugged in yet.

## Adding gallery photos

1. Drop the images into `assets/photos/`. Resize them to around 1200px wide first, because phones at camp are on one bar of signal.
2. Open `js/gallery.js` and edit the `PHOTOS` array at the top. Each photo is one line:

   ```js
   { file: "2019-bonfire.jpg", caption: "Nobody remembers this", year: 2019 },
   ```
3. Delete the `placeholder-XX.png` lines, and the placeholder files, once you have real ones.

The small "snapshot strips" at the bottom of each page also use `assets/photos/placeholder-01.png` through `placeholder-12.png`. You can replace those files with real photos under the same names, or edit the `STRIPS` captions and file logic in `js/site.js`.

## Placeholder art still needed

All of these are crude generated placeholders, drawn MS Paint-style on purpose. To swap one in, save the real art over the file using the **same filename**. Keep the proportions close and keep the cutouts on transparent backgrounds.

| File | Placeholder size | Notes |
|---|---|---|
| `assets/door-portajohn.png` | 600×1000 | The gate door. Tall. The "PLEASE KNOCK" text is overlaid by the page. |
| `assets/camp-bg.png` | 1600×800 (2:1) | The campsite. Keep it **2:1**, because the hotspots are positioned in percentages of this box. |
| `assets/obj-van.png` | 520×280 | Transparent. Links to gear. |
| `assets/obj-weather.png` | 260×220 | Transparent. Links to NOAA. |
| `assets/obj-guestbook.png` | 220×380 | Transparent. Links to guestbook. |
| `assets/photos/placeholder-01…12.png` | 400×300 | Stand-ins for gallery photos and the snapshot strips. |

Real art already in place on the campsite (camp.html):

| File | Links to |
|---|---|
| `assets/obj-bonfire-jump.png` | Itinerary. Also the hero image on the itinerary page. |
| `assets/howdy-cleator.jpg` | Register. Also used in the Management rail on the register page. |
| `assets/obj-photoset.png` | Gallery. |
| `assets/obj-rider.png` | Trailforks. |

`assets/obj-postcard.png` is the old cartoon postcard. Nothing uses it anymore.

If real art comes in at different proportions, adjust the hotspot positions in the `<style>` block at the top of `camp.html`. Look for `.h-bonfire`, `.h-van`, and so on. The values are `left`, `top`, and `width`, in % of the scene.

`assets/logo.png` is the real logo, resized from `ssaz27.png`. The page colors were sampled from it:

| Role | Hex |
|---|---|
| Navy | `#2E3351` |
| Berry | `#A03263` |
| Rose | `#B57CAE` |
| Lavender | `#A79CCA` |
| Ridge blue-gray | `#B8C3D6` |
| Paper | `#F4F1E8` |

The GIFs in `assets/gif/` are original, generated for this site, and free to use.

## Sound

There's no background music. The only sound is the knock-creak-flush effect when someone clicks the porta-john door. `js/site.js` synthesizes it with the Web Audio API (`sfxDoor`), so there's no audio file. To remove it, delete the `window.SSAZ.sfxDoor()` call in `index.html`.

## Facts checklist

- Dates: Fri Feb 5 – Sun Feb 7, 2027
- Venue: Bumble Bee Ranch Adventures and Event Center, Bumble Bee, AZ, on the Black Canyon Trail
- Fee: $120, cash only, by mail to Kaolin, 6061 E Cave Creek Rd Ste 7, Cave Creek, AZ 85331. Include the registrant name(s) and a neatly written email.
- Weather: https://forecast.weather.gov/MapClick.php?lat=34.2059&lon=-112.1488. These coordinates are within about 200 m of Bumble Bee's town center (34.2047, -112.1481), and NOAA serves it from the Flagstaff office.
- Trails: https://www.trailforks.com/region/black-canyon-city/
