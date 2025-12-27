# TNvZA_Map
A map of the case of TN v. Zachary Adams.

## GitHub Pages

This repository includes an interactive map showing the location of Parsons, TN with animated rain radar overlay.

**View the live map:** [https://012090120901209.github.io/TNvZA_Map/](https://012090120901209.github.io/TNvZA_Map/)

### Features

- Interactive Leaflet map centered on Parsons, TN (35.75°N, 88.15°W)
- Animated rain radar using RainViewer API
- Time dimension controls for viewing historical and current weather patterns
- Toggle between radar and satellite imagery
- Location marker at the case location

### Enabling GitHub Pages

To enable GitHub Pages for this repository:

1. Go to the repository Settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select the branch you want to deploy (e.g., `main` or `copilot/create-github-page-parsons-tn`)
4. Select "/ (root)" as the folder
5. Click "Save"

The site will be available at `https://012090120901209.github.io/TNvZA_Map/`

### Local Development

To view the map locally:

```bash
# Start a local web server in the repository directory
python3 -m http.server 8080

# Open your browser to http://localhost:8080/
```

### Technologies Used

- [Leaflet](https://leafletjs.com/) - Interactive map library
- [Leaflet.TimeDimension](https://github.com/socib/Leaflet.TimeDimension) - Time dimension control for Leaflet
- [RainViewer API](https://www.rainviewer.com/api.html) - Weather radar and satellite imagery
- Based on [Leaflet.TimeDimension.Rainviewer](https://github.com/KrausMatthias/Leaflet.TimeDimension.Rainviewer) implementation
