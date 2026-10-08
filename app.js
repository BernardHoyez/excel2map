(function () {
  'use strict';

  const map = L.map('map', {
    zoomControl: true,
    attributionControl: true
  }).setView([46.603354, 1.888334], 6); // France center by default

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  let markersLayer = L.layerGroup().addTo(map);
  let places = []; // { name, lat, lon }

  const excelInput = document.getElementById('excelFile');
  const statusEl = document.getElementById('status');
  const exportButtons = document.getElementById('exportButtons');
  const btnJson = document.getElementById('btnJson');
  const btnGpx = document.getElementById('btnGpx');
  const btnKml = document.getElementById('btnKml');
  const btnClear = document.getElementById('btnClear');

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function parseLatLon(str) {
    if (typeof str !== 'string') str = String(str || '');
    str = str.trim().replace(/\s+/g, '');
    // Accept "lat,lon" or "lat;lon" or "lat lon"
    const parts = str.split(/[,;\s]+/).filter(Boolean);
    if (parts.length < 2) return null;
    const lat = parseFloat(parts[0].replace(',', '.'));
    const lon = parseFloat(parts[1].replace(',', '.'));
    if (isNaN(lat) || isNaN(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { lat, lon };
  }

  function clearMap() {
    markersLayer.clearLayers();
    places = [];
    exportButtons.hidden = true;
    setStatus('');
  }

  function addMarkers() {
    markersLayer.clearLayers();
    if (!places.length) return;

    const bounds = [];
    places.forEach((p) => {
      const marker = L.marker([p.lat, p.lon]);
      marker.bindPopup(`<strong>${escapeHtml(p.name)}</strong><br>${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}`);
      marker.bindTooltip(p.name, { permanent: false, direction: 'top' });
      markersLayer.addLayer(marker);
      bounds.push([p.lat, p.lon]);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function processWorkbook(wb) {
    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (!rows.length) {
      setStatus('Feuille vide.', 'error');
      return;
    }

    const parsed = [];
    let skipped = 0;

    // Skip potential header if first row looks like text labels
    let start = 0;
    if (rows.length > 1) {
      const first = rows[0];
      const c0 = String(first[0] || '').toLowerCase();
      const c1 = String(first[1] || '').toLowerCase();
      if (
        (c0.includes('lieu') || c0.includes('nom') || c0.includes('name') || c0.includes('intitulé') || c0.includes('titre') || c0.includes('label')) &&
        (c1.includes('lat') || c1.includes('coord') || c1.includes('gps') || c1.includes('position'))
      ) {
        start = 1;
      }
    }

    for (let i = start; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) {
        skipped++;
        continue;
      }
      const name = String(row[0] || '').trim();
      if (!name) {
        skipped++;
        continue;
      }
      const coords = parseLatLon(row[1]);
      if (!coords) {
        skipped++;
        continue;
      }
      parsed.push({ name, lat: coords.lat, lon: coords.lon });
    }

    if (!parsed.length) {
      setStatus('Aucun point valide trouvé. Vérifiez le format (col1 = intitulé, col2 = lat,lon).', 'error');
      return;
    }

    places = parsed;
    addMarkers();
    exportButtons.hidden = false;
    let msg = `${places.length} lieu${places.length > 1 ? 'x' : ''} affiché${places.length > 1 ? 's' : ''}`;
    if (skipped) msg += ` (${skipped} ligne${skipped > 1 ? 's' : ''} ignorée${skipped > 1 ? 's' : ''})`;
    setStatus(msg, 'success');
  }

  excelInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('Lecture en cours…');
    clearMap();

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        processWorkbook(wb);
      } catch (err) {
        console.error(err);
        setStatus('Erreur de lecture du fichier Excel.', 'error');
      }
    };
    reader.onerror = () => setStatus('Impossible de lire le fichier.', 'error');
    reader.readAsArrayBuffer(file);

    // Reset input so same file can be re-selected
    excelInput.value = '';
  });

  btnClear.addEventListener('click', () => {
    clearMap();
    setStatus('Carte effacée.');
  });

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  btnJson.addEventListener('click', () => {
    if (!places.length) return;
    const data = places.map((p) => ({
      name: p.name,
      latitude: p.lat,
      longitude: p.lon
    }));
    download('excel2map-points.json', JSON.stringify(data, null, 2), 'application/json');
  });

  btnGpx.addEventListener('click', () => {
    if (!places.length) return;
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="excel2map" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>excel2map export</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
`;
    places.forEach((p) => {
      gpx += `  <wpt lat="${p.lat}" lon="${p.lon}">
    <name>${escapeXml(p.name)}</name>
  </wpt>
`;
    });
    gpx += '</gpx>';
    download('excel2map-points.gpx', gpx, 'application/gpx+xml');
  });

  btnKml.addEventListener('click', () => {
    if (!places.length) return;
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>excel2map export</name>
`;
    places.forEach((p) => {
      kml += `    <Placemark>
      <name>${escapeXml(p.name)}</name>
      <Point>
        <coordinates>${p.lon},${p.lat},0</coordinates>
      </Point>
    </Placemark>
`;
    });
    kml += `  </Document>
</kml>`;
    download('excel2map-points.kml', kml, 'application/vnd.google-earth.kml+xml');
  });

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
})();
