/* excel2map — PWA */
(function () {
  "use strict";

  const fileInput = document.getElementById("fileInput");
  const fileNameEl = document.getElementById("fileName");
  const statusEl = document.getElementById("status");
  const btnExport = document.getElementById("btnExport");
  const btnClear = document.getElementById("btnClear");
  const placesList = document.getElementById("placesList");
  const listPanel = document.getElementById("listPanel");
  const countBadge = document.getElementById("countBadge");

  let places = []; // { name, lat, lon }
  let markers = [];
  let map = null;

  // ── Map init ──────────────────────────────────────────────
  function initMap() {
    map = L.map("map", {
      center: [46.6, 2.4], // France approx
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
  }

  // ── Status helpers ────────────────────────────────────────
  function setStatus(msg, type) {
    statusEl.textContent = msg || "";
    statusEl.className = "status" + (type ? " " + type : "");
  }

  // ── Parse lat,lon cell ────────────────────────────────────
  function parseCoords(raw) {
    if (raw == null) return null;
    const s = String(raw).trim().replace(/\s+/g, "");
    // Accept "lat,lon" or "lat;lon" or "lat lon"
    const parts = s.split(/[,;]/);
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0].replace(",", "."));
    const lon = parseFloat(parts[1].replace(",", "."));
    if (isNaN(lat) || isNaN(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
  }

  // ── Read Excel ────────────────────────────────────────────
  async function handleFile(file) {
    if (!file) return;
    fileNameEl.textContent = file.name;
    setStatus("Lecture en cours…");

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      if (!rows.length) {
        setStatus("Feuille vide.", "error");
        return;
      }

      // Detect header row (optional): if first cell looks like text header
      let start = 0;
      const firstCell = String(rows[0][0] || "").toLowerCase();
      if (
        firstCell.includes("lieu") ||
        firstCell.includes("nom") ||
        firstCell.includes("name") ||
        firstCell.includes("place") ||
        firstCell.includes("intitulé")
      ) {
        start = 1;
      }

      const parsed = [];
      const errors = [];

      for (let i = start; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        const name = String(row[0] || "").trim();
        if (!name) continue;
        const coords = parseCoords(row[1]);
        if (!coords) {
          errors.push(`Ligne ${i + 1} : coordonnées invalides (« ${row[1]} »)`);
          continue;
        }
        parsed.push({ name, lat: coords.lat, lon: coords.lon });
      }

      if (!parsed.length) {
        setStatus(
          "Aucun lieu valide trouvé. Attendu : colonne 1 = intitulé, colonne 2 = latitude,longitude",
          "error"
        );
        return;
      }

      places = parsed;
      renderPlaces();
      setStatus(
        `${places.length} lieu(x) chargé(s)` +
          (errors.length ? ` · ${errors.length} ligne(s) ignorée(s)` : ""),
        "ok"
      );
      btnExport.disabled = false;
      btnClear.disabled = false;
    } catch (err) {
      console.error(err);
      setStatus("Erreur de lecture du fichier : " + (err.message || err), "error");
    }
  }

  // ── Render markers + list ─────────────────────────────────
  function clearMarkers() {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];
  }

  function renderPlaces() {
    clearMarkers();
    placesList.innerHTML = "";

    if (!places.length) {
      listPanel.classList.add("hidden");
      countBadge.textContent = "0";
      return;
    }

    listPanel.classList.remove("hidden");
    countBadge.textContent = String(places.length);

    const bounds = [];

    places.forEach((p, idx) => {
      const marker = L.marker([p.lat, p.lon])
        .addTo(map)
        .bindPopup(`<strong>${escapeHtml(p.name)}</strong><br>${p.lat}, ${p.lon}`);
      markers.push(marker);
      bounds.push([p.lat, p.lon]);

      const li = document.createElement("li");
      li.innerHTML = `<span>${escapeHtml(p.name)}</span><span class="coords">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</span>`;
      li.addEventListener("click", () => {
        map.setView([p.lat, p.lon], Math.max(map.getZoom(), 14));
        marker.openPopup();
      });
      placesList.appendChild(li);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Export JSON ───────────────────────────────────────────
  function exportJSON() {
    if (!places.length) return;
    const data = places.map((p) => ({
      name: p.name,
      latitude: p.lat,
      longitude: p.lon,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "excel2map-points.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("JSON exporté.", "ok");
  }

  // ── Clear ─────────────────────────────────────────────────
  function clearAll() {
    places = [];
    clearMarkers();
    placesList.innerHTML = "";
    listPanel.classList.add("hidden");
    countBadge.textContent = "0";
    fileInput.value = "";
    fileNameEl.textContent = "";
    setStatus("");
    btnExport.disabled = true;
    btnClear.disabled = true;
    map.setView([46.6, 2.4], 5);
  }

  // ── Events ────────────────────────────────────────────────
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleFile(f);
  });

  btnExport.addEventListener("click", exportJSON);
  btnClear.addEventListener("click", clearAll);

  // ── Service Worker (cache-busting) ────────────────────────
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      // Bust cache with build timestamp / version
      const SW_VERSION = "excel2map-v1-" + Date.now();
      navigator.serviceWorker
        .register("./sw.js?v=" + encodeURIComponent(SW_VERSION))
        .then((reg) => {
          // Force update check
          reg.update();
          console.log("[excel2map] SW registered", reg.scope);
        })
        .catch((err) => console.warn("[excel2map] SW registration failed", err));
    });
  }

  // Boot
  initMap();
})();
