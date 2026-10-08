# excel2map

PWA (Progressive Web App) qui importe un fichier Excel (`.xls` / `.xlsx`) contenant des lieux et les affiche sur une carte OpenStreetMap (Leaflet).

## Format Excel attendu

| Colonne 1          | Colonne 2              |
|--------------------|------------------------|
| Intitulé du lieu   | latitude,longitude     |

Exemple :

| Tour Eiffel        | 48.8584,2.2945         |
| Notre-Dame         | 48.8530,2.3499         |

- Une ligne d'en-tête optionnelle (détectée automatiquement si le premier cellule contient « lieu », « nom », « name », etc.) est ignorée.
- Les coordonnées peuvent être séparées par `,` ou `;`.
- Les lignes invalides sont ignorées avec un compteur dans le statut.

## Fonctionnalités

- Import Excel (SheetJS / xlsx)
- Affichage des points sur carte OSM (Leaflet) avec épingle + popup (intitulé)
- Liste cliquable des lieux (recentre la carte)
- Export des points au format JSON (`excel2map-points.json`)
- PWA installable (manifest + service worker)
- Service worker avec **brise-caches** (suppression des anciens caches à l’activation)
- Placeholders d’icônes : `icon192.png` et `icon512.png`

## Fichiers

```
excel2map/
├── index.html
├── styles.css
├── app.js
├── sw.js
├── manifest.json
├── icon192.png
├── icon512.png
└── README.md
```

## Utilisation locale

Ouvrir via un serveur HTTP (les service workers exigent un contexte sécurisé ou localhost) :

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080` dans le navigateur.

## Dépendances CDN

- Leaflet 1.9.4
- SheetJS (xlsx) 0.20.3

Aucune build step : pure HTML/CSS/JS.

## Licence

Usage libre.
