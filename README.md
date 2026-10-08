# excel2map

PWA permettant de charger un fichier Excel (XLS / XLSX) contenant des lieux et de les afficher sur une carte OpenStreetMap (Leaflet).

## Format d'entrée

| Colonne 1       | Colonne 2              |
|-----------------|------------------------|
| Intitulé du lieu| latitude,longitude     |

Exemple :

```
Tour Eiffel	48.858370,2.294481
Colisée	41.890210,12.492231
```

- La première ligne peut être un en-tête (détecté automatiquement).
- Les coordonnées acceptent `,` ou `;` ou espace comme séparateur.
- Les lignes invalides sont ignorées.

## Fonctionnalités

- Affichage des points avec épingles et intitulés (popup + tooltip)
- Zoom automatique sur l'ensemble des points
- Export :
  - **JSON** – tableau d'objets `{ name, latitude, longitude }`
  - **GPX** – waypoints
  - **KML** – placemarks
- PWA installable (manifest + service worker)
- Service worker avec cache versionné (cache-busting)

## Utilisation

1. Ouvrir `index.html` (ou servir le dossier via un serveur HTTP pour le SW).
2. Charger un fichier Excel.
3. Les points apparaissent sur la carte.
4. Exporter au format souhaité.

## Icônes

Placeholders fournis :
- `icons/icon192.png`
- `icons/icon512.png`

Remplacez-les par vos propres icônes si besoin.

## Dépendances (CDN)

- Leaflet 1.9.4
- SheetJS (xlsx) 0.20.3

## Licence

Usage libre.
