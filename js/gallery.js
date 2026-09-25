/* ============================================================
   GALLERY PHOTOS — the only list you need to edit.
   1. Drop the image into assets/photos/
   2. Add a line below: { file: "name.jpg", caption: "joke", year: 2019 }
   3. Delete the placeholder lines once real photos show up.
   Order here = order on the clothesline.
   ============================================================ */
var PHOTOS = [
  { file: "placeholder-01.png", caption: "Whose tent is this", year: 2014 },
  { file: "placeholder-02.png", caption: "Kaolin, pre-bonfire", year: 2016 },
  { file: "placeholder-03.png", caption: "He said the beer was 2 miles ago", year: 2017 },
  { file: "placeholder-04.png", caption: "Hydration strategy", year: 2018 },
  { file: "placeholder-05.png", caption: "Cactus: 1, Dave: 0", year: 2019 },
  { file: "placeholder-06.png", caption: "Home is where the van breaks down", year: 2020 },
  { file: "placeholder-07.png", caption: "Golden hour, brown bottle", year: 2021 },
  { file: "placeholder-08.png", caption: "The line, 6:45 AM", year: 2022 },
  { file: "placeholder-09.png", caption: "Group photo (nobody knows who took it)", year: 2023 },
  { file: "placeholder-10.png", caption: "Hosting Competition aftermath (redacted)", year: 2024 },
  { file: "placeholder-11.png", caption: "Cleator Yacht Club regatta", year: 2025 },
  { file: "placeholder-12.png", caption: "Stars, or a concussion", year: 2026 }
];

(function () {
  "use strict";
  var wall = document.getElementById("wall");
  if (!wall) return;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  wall.innerHTML = PHOTOS.map(function (p, i) {
    var tilt = [-4, 3, -2, 5, -5, 2, -3, 4][i % 8];
    var src = "assets/photos/" + encodeURIComponent(p.file);
    return '<li class="polaroid" style="--tilt:' + tilt + 'deg">' +
      '<span class="pin" aria-hidden="true"></span>' +
      '<a href="' + src + '" target="_blank" rel="noopener"><img src="' + src + '" alt="' + esc(p.caption) + '" loading="lazy"></a>' +
      '<span class="cap">' + esc(p.caption) + '</span>' +
      '<span class="yr">' + esc(p.year) + "</span></li>";
  }).join("");
})();
