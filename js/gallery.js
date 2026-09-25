/* ============================================================
   GALLERY PHOTOS — the only list you need to edit.
   1. Drop the image into assets/photos/
   2. Add a line below: { file: "name.jpg", caption: "joke" }
   3. Delete the placeholder lines once real photos show up.
   Order here = order on the clothesline.
   ============================================================ */
var PHOTOS = [
  { file: "tandem.jpg", caption: "Tandems ARE singlespeeds" },
  { file: "karl1.jpg", caption: "Krazy Karl the alarm clock" },
  { file: "paul.jpg", caption: "The G.O.A.T. - Paul!" },
  { file: "wine1.jpg", caption: "Hydration strategy" },
  { file: "ranch.jpg", caption: "The Ranch" },
  { file: "saguaro.jpg", caption: "Home is where the van breaks down" },
  { file: "band1.jpg", caption: "Music for the people" },
  { file: "brd-mega.jpg", caption: "Management... managing" },
  { file: "placeholder-09.png", caption: "Group photo (nobody knows who took it)" },
  { file: "placeholder-10.png", caption: "Hosting Competition aftermath (redacted)" },
  { file: "placeholder-11.png", caption: "Cleator Yacht Club regatta" },
  { file: "placeholder-12.png", caption: "Stars, or a concussion" }
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
      '<span class="cap">' + esc(p.caption) + "</span></li>";
  }).join("");
})();
