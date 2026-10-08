# excel2map

PWA statique permettant d'afficher sur une carte Leaflet/OpenStreetMap des lieux provenant d'un fichier XLS ou XLSX.

## Format du fichier Excel

Deux colonnes :
1. intitulé du lieu
2. latitude,longitude

Exemple :

| Lieu | Coordonnées |
|---|---|
| Le Havre | 49.4944,0.1079 |
| Fécamp | 49.7579,0.3749 |

La première ligne peut contenir les en-têtes.

## Utilisation

Ouvrir `index.html` via un serveur web (GitHub Pages, Cloudflare Pages, etc.), charger le fichier Excel, puis exporter les points en `points.json`.

La bibliothèque XLSX et Leaflet sont chargées depuis leurs CDN ; la lecture du fichier Excel et l'export JSON se font localement dans le navigateur.

## Publication GitHub Pages

Décompresser l'archive et déposer son contenu dans le dossier publié du dépôt. Aucun build n'est nécessaire.
