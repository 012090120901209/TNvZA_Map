/**
 * KML Location Loader for Leaflet TimeDimension
 * Parses locations from KML file and creates time-animated markers
 */

// Base date constant: April 13, 2011 at 6:00 AM
// Month is 0-indexed, so 3 = April
const BASE_DATE = new Date(2011, 3, 13, 6, 0, 0, 0);

// Parse coordinates from KML coordinate string
function parseCoordinates(coordString) {
    const coords = coordString.trim().split(',');
    return {
        lng: parseFloat(coords[0]),
        lat: parseFloat(coords[1]),
        alt: coords[2] ? parseFloat(coords[2]) : 0
    };
}

// Parse time string like "8:11 AM" or "9:02am" to a Date object on 04/13/2011
function parseTimeOnDate(timeStr, baseDate) {
    if (!timeStr) return null;
    
    // Normalize the time string
    timeStr = timeStr.toLowerCase().trim();
    
    // Match patterns like "8:11 am", "9:02am", "7:45–7:50 a.m."
    // Requires colon and minutes when present, or just hours with am/pm
    const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3] || 'am';
    
    // Convert to 24-hour format
    if (period.toLowerCase().includes('pm') && hours !== 12) {
        hours += 12;
    } else if (period.toLowerCase().includes('am') && hours === 12) {
        hours = 0;
    }
    
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Extract time from description text
function extractTimeFromDescription(description) {
    if (!description) return null;
    
    // Look for time patterns in the description
    // Patterns: "at X:XX AM", "X:XX AM", "near X:XX AM", "Time: X:XXam"
    const patterns = [
        /at\s+(\d{1,2}:\d{2}\s*(?:am|pm|a\.m\.|p\.m\.))/i,
        /Time:\s*(\d{1,2}:\d{2}\s*(?:am|pm|a\.m\.|p\.m\.))/i,
        /(\d{1,2}:\d{2}\s*(?:am|pm|a\.m\.|p\.m\.))/i,
        /~(\d{1,2}:\d{2})/i,  // ~7:45
        /approx\.\s*(\d{1,2}:\d{2})/i
    ];
    
    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

// Main function to parse KML content and create location data
async function parseKmlLocations(kmlUrl) {
    const response = await fetch(kmlUrl);
    const kmlText = await response.text();
    
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    const locations = [];
    const placemarks = kmlDoc.getElementsByTagName('Placemark');
    
    for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        
        // Get name
        const nameElement = placemark.getElementsByTagName('name')[0];
        const name = nameElement ? nameElement.textContent : 'Unknown';
        
        // Get description
        const descElement = placemark.getElementsByTagName('description')[0];
        const description = descElement ? descElement.textContent : '';
        
        // Get styleUrl
        const styleElement = placemark.getElementsByTagName('styleUrl')[0];
        const styleUrl = styleElement ? styleElement.textContent : '';
        
        // Get Point coordinates
        const pointElement = placemark.getElementsByTagName('Point')[0];
        if (pointElement) {
            const coordElement = pointElement.getElementsByTagName('coordinates')[0];
            if (coordElement) {
                const coords = parseCoordinates(coordElement.textContent);
                
                // Try to extract time from description
                const timeStr = extractTimeFromDescription(description);
                const timestamp = parseTimeOnDate(timeStr, BASE_DATE);
                
                locations.push({
                    type: 'point',
                    name: name,
                    description: description,
                    coords: coords,
                    timestamp: timestamp,
                    timeStr: timeStr,
                    style: styleUrl
                });
            }
        }
        
        // Get LineString coordinates (for GPS trails)
        const lineElements = placemark.getElementsByTagName('LineString');
        for (let j = 0; j < lineElements.length; j++) {
            const lineElement = lineElements[j];
            const coordElement = lineElement.getElementsByTagName('coordinates')[0];
            if (coordElement) {
                const coordsText = coordElement.textContent.trim();
                const coordLines = coordsText.split(/\s+/).filter(c => c.length > 0);
                const lineCoords = coordLines.map(parseCoordinates);
                
                locations.push({
                    type: 'line',
                    name: name,
                    description: description,
                    coords: lineCoords,
                    timestamp: null,
                    style: styleUrl
                });
            }
        }
        
        // Get Polygon coordinates (for areas)
        const polygonElements = placemark.getElementsByTagName('Polygon');
        for (let j = 0; j < polygonElements.length; j++) {
            const polyElement = polygonElements[j];
            const coordElement = polyElement.getElementsByTagName('coordinates')[0];
            if (coordElement) {
                const coordsText = coordElement.textContent.trim();
                const coordLines = coordsText.split(/\s+/).filter(c => c.length > 0);
                const polyCoords = coordLines.map(parseCoordinates);
                
                locations.push({
                    type: 'polygon',
                    name: name,
                    description: description,
                    coords: polyCoords,
                    timestamp: null,
                    style: styleUrl
                });
            }
        }
    }
    
    return locations;
}

// Define the timeline events with specific timestamps from the case
// Comprehensive cell phone timeline data from court documents and post-conviction filings
function getTimelineEvents() {
    
    const events = [
        // Timeline start
        { time: '6:00', label: 'Timeline Start', lat: 35.6792874, lng: -88.1758007, phone: 'timeline' },
        
        // Abduction events
        { time: '7:45', label: 'Abduction - Screaming heard at Bobo Residence', lat: 35.6785775930745, lng: -88.17477273224679, phone: 'event' },
        { time: '7:50', label: 'Holly Bobo seen walking into woods', lat: 35.6792874, lng: -88.1758007, phone: 'event' },
        
        // HOLLY BOBO'S CELL PHONE - Source: Cell phone tracking exhibit
        { time: '8:00', label: '[Holly] Cell phone departs Bobo Residence', lat: 35.67957104790676, lng: -88.17468256470195, phone: 'holly' },
        { time: '8:11', label: '[Holly] CR 1253 Sector 1 - Henderson County area', lat: 35.76346036385862, lng: -88.19034415007265, phone: 'holly' },
        { time: '8:16', label: '[Holly] CR 1096 Sector 2 - Moving northward', lat: 35.78, lng: -88.15, phone: 'holly' },
        { time: '8:26', label: '[Holly] CR 1096 Shiloh Road Tower Sector 1 (start) - Natchez Trace area', lat: 35.80728968907157, lng: -88.1216288597432, phone: 'holly' },
        { time: '8:30', label: '[Holly] Phone pings near remains site - undermines State theory', lat: 35.8215758, lng: -88.16926100000001, phone: 'holly' },
        { time: '8:56', label: '[Holly] CR 1096 Shiloh Road Tower Sector 1 (end) - 30 min in area', lat: 35.80728968907157, lng: -88.1216288597432, phone: 'holly' },
        { time: '9:00', label: '[Holly] Exit route: CR 1096 Sec 1 → CR 3152 Sec 3', lat: 35.83, lng: -88.13, phone: 'holly' },
        { time: '9:02', label: '[Holly] CR 3152 Sector 3 - Benton County', lat: 35.842345623928, lng: -88.1276129764545, phone: 'holly' },
        { time: '9:06', label: '[Holly] CR 3152 Sector 3 - Continuing in area', lat: 35.82094274393113, lng: -88.13629720440629, phone: 'holly' },
        { time: '9:10', label: '[Holly] CR 3152 Sector 2 - Near marker 17', lat: 35.8285377036733, lng: -88.0218543180404, phone: 'holly' },
        { time: '9:25', label: '[Holly] CR 1257 Sector 3 - Creek Gooch Road (lunchbox/notebook found)', lat: 35.75837617082156, lng: -88.17459209850702, phone: 'holly' },
        
        // ZACHARY ADAMS & JASON AUTRY CELL PHONES - Source: Reeves Affidavit
        { time: '9:42', label: '[Adams/Autry] Birdsong Tower East Sector 39077 - First recorded use', lat: 35.8680952, lng: -87.9434109, phone: 'adams' },
        { time: '9:50', label: '[Adams/Autry] Birdsong Tower East Sector 39077 - NE of dividing line', lat: 35.8680952, lng: -87.9434109, phone: 'adams' },
        { time: '10:32', label: '[Adams/Autry] Birdsong Tower East Sector 39077 - Last east sector use', lat: 35.8680952, lng: -87.9434109, phone: 'adams' },
        { time: '10:35', label: '[Adams/Autry] Birdsong Tower West Sector 39079 - Bypassed south 39078!', lat: 35.8680952, lng: -87.9434109, phone: 'adams' },
        { time: '10:37', label: '[Adams/Autry] Birdsong Tower West Sector 39079 - Last west sector use', lat: 35.8680952, lng: -87.9434109, phone: 'adams' },
        { time: '10:38', label: '[Adams] Home tower - Only possible via I-40, not backroads', lat: 35.8214583, lng: -88.0837789, phone: 'adams' },
        
        // ATM VIDEO EVIDENCE - Source: Post-Conviction Filing
        { time: '11:12', label: '[Adams] ATM Video - Adams, Dylan Adams, Shayne Austin at CB&S Bank', lat: 35.6492403, lng: -88.1279471, phone: 'evidence' },
        
        // Continued activity
        { time: '12:35', label: '[Adams] Cell phone still in Parsons area', lat: 35.6492403, lng: -88.1279471, phone: 'adams' },
    ];
    
    return events.map(event => {
        const [hours, minutes] = event.time.split(':').map(Number);
        const timestamp = new Date(BASE_DATE);
        timestamp.setHours(hours, minutes, 0, 0);
        return {
            ...event,
            timestamp: timestamp
        };
    });
}

// Create a TimeDimension layer for KML locations
L.TimeDimension.Layer.KmlLocations = L.TimeDimension.Layer.extend({
    
    initialize: function(locations, timelineEvents, options) {
        L.TimeDimension.Layer.prototype.initialize.call(this, L.layerGroup(), options);
        
        this._locations = locations;
        this._timelineEvents = timelineEvents;
        this._markers = {};
        this._staticLayers = L.layerGroup();
        this._animatedMarkers = L.layerGroup();
        this._gpsTrailLayer = L.layerGroup();
        this._currentMarker = null;
        this._trailPolyline = null;
        this._trailPoints = [];
        
        // Sort timeline events by time
        this._timelineEvents.sort((a, b) => a.timestamp - b.timestamp);
        
        // Extract GPS trail coordinates from locations
        this._extractGpsTrail();
        
        // Create available times from events
        this._availableTimes = this._timelineEvents.map(e => e.timestamp.getTime());
    },
    
    _extractGpsTrail: function() {
        // Find all line segments that are GPS trails
        this._gpsTrailCoords = [];
        this._locations.forEach(loc => {
            if (loc.type === 'line' && loc.name && loc.name.includes('GPS TRAIL')) {
                loc.coords.forEach(coord => {
                    this._gpsTrailCoords.push([coord.lat, coord.lng]);
                });
            }
        });
    },
    
    onAdd: function(map) {
        L.TimeDimension.Layer.prototype.onAdd.call(this, map);
        
        // Add static layers (polygons, all point markers)
        this._addStaticLayers();
        map.addLayer(this._staticLayers);
        map.addLayer(this._animatedMarkers);
        map.addLayer(this._gpsTrailLayer);
        
        // Set available times
        if (this._timeDimension) {
            this._timeDimension.setAvailableTimes(this._availableTimes, 'replace');
            if (this._availableTimes.length > 0) {
                this._timeDimension.setCurrentTime(this._availableTimes[0]);
            }
        }
    },
    
    onRemove: function(map) {
        map.removeLayer(this._staticLayers);
        map.removeLayer(this._animatedMarkers);
        map.removeLayer(this._gpsTrailLayer);
        L.TimeDimension.Layer.prototype.onRemove.call(this, map);
    },
    
    _addStaticLayers: function() {
        const self = this;
        
        // Add all point markers
        this._locations.forEach(loc => {
            if (loc.type === 'point') {
                const marker = L.circleMarker([loc.coords.lat, loc.coords.lng], {
                    radius: 8,
                    fillColor: self._getMarkerColor(loc),
                    color: '#333',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                
                // Create popup content
                let popupContent = `<b>${loc.name}</b>`;
                if (loc.timeStr) {
                    popupContent += `<br><em>Time: ${loc.timeStr}</em>`;
                }
                if (loc.description) {
                    // Only truncate and add ellipsis if description is longer than 200 chars
                    if (loc.description.length > 200) {
                        popupContent += `<br>${loc.description.substring(0, 200)}...`;
                    } else {
                        popupContent += `<br>${loc.description}`;
                    }
                }
                marker.bindPopup(popupContent);
                
                self._staticLayers.addLayer(marker);
            }
            
            // Add polygons
            if (loc.type === 'polygon') {
                const latlngs = loc.coords.map(c => [c.lat, c.lng]);
                const polygon = L.polygon(latlngs, {
                    color: '#0000ff',
                    fillColor: '#0000ff',
                    fillOpacity: 0.2,
                    weight: 2
                });
                polygon.bindPopup(`<b>${loc.name}</b><br>${loc.description || ''}`);
                self._staticLayers.addLayer(polygon);
            }
            
            // Add lines (GPS trails will be animated separately)
            if (loc.type === 'line' && !loc.name.includes('GPS TRAIL')) {
                const latlngs = loc.coords.map(c => [c.lat, c.lng]);
                const polyline = L.polyline(latlngs, {
                    color: '#ff5500',
                    weight: 4,
                    opacity: 0.8
                });
                polyline.bindPopup(`<b>${loc.name}</b><br>${loc.description || ''}`);
                self._staticLayers.addLayer(polyline);
            }
        });
    },
    
    _getMarkerColor: function(loc) {
        const style = loc.style || '';
        const name = loc.name || '';
        
        // Color based on location type/name
        if (name.includes('ABDUCTION') || name.includes('BOBO')) {
            return '#ef5350'; // Red
        }
        if (name.includes('CELL') || name.includes('TOWER')) {
            return '#fbc235'; // Yellow
        }
        if (name.includes('BODY') || name.includes('REMAINS')) {
            return '#d32f2f'; // Dark red
        }
        if (name.includes('ATM')) {
            return '#4caf50'; // Green
        }
        if (name.includes('Marker')) {
            return '#fbc02d'; // Yellow
        }
        
        return '#1976d2'; // Blue default
    },
    
    _onNewTimeLoading: function(ev) {
        // Called when time changes
    },
    
    isReady: function(time) {
        return true;
    },
    
    _update: function() {
        if (!this._map || !this._timeDimension) return;
        
        const currentTime = this._timeDimension.getCurrentTime();
        this._updateAnimatedElements(currentTime);
    },
    
    _updateAnimatedElements: function(currentTime) {
        const self = this;
        
        // Clear animated markers
        this._animatedMarkers.clearLayers();
        this._gpsTrailLayer.clearLayers();
        
        // Find current event based on time
        let currentEventIndex = 0;
        for (let i = 0; i < this._timelineEvents.length; i++) {
            if (this._timelineEvents[i].timestamp.getTime() <= currentTime) {
                currentEventIndex = i;
            } else {
                break;
            }
        }
        
        const currentEvent = this._timelineEvents[currentEventIndex];
        
        // Get color based on phone type
        const getPhoneColor = (phone) => {
            switch(phone) {
                case 'holly': return '#e91e63'; // Pink for Holly Bobo's phone
                case 'adams': return '#2196f3'; // Blue for Adams/Autry phones
                case 'evidence': return '#4caf50'; // Green for evidence (ATM video)
                case 'event': return '#ff5722'; // Orange for events
                case 'timeline': return '#9e9e9e'; // Gray for timeline markers
                default: return '#ff0000'; // Red default
            }
        };
        
        // Add a prominent marker for current event
        if (currentEvent) {
            const phoneColor = getPhoneColor(currentEvent.phone);
            // Convert hex to rgba for proper transparency
            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };
            
            const pulsingIcon = L.divIcon({
                className: 'pulsing-marker',
                html: `<div class="pulse-ring" style="background: ${hexToRgba(phoneColor, 0.4)};"></div><div class="pulse-core" style="background: ${phoneColor};"></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            const marker = L.marker([currentEvent.lat, currentEvent.lng], {
                icon: pulsingIcon
            });
            
            const timeStr = currentEvent.timestamp.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            
            marker.bindPopup(`<b>${currentEvent.label}</b><br>Time: ${timeStr}`).openPopup();
            this._animatedMarkers.addLayer(marker);
        }
        
        // Draw GPS trail up to current time
        if (this._gpsTrailCoords.length > 0) {
            // Calculate how much of the trail to show based on time progression
            const startTime = this._availableTimes[0];
            const endTime = this._availableTimes[this._availableTimes.length - 1];
            const progress = (currentTime - startTime) / (endTime - startTime);
            
            const pointsToShow = Math.max(1, Math.floor(this._gpsTrailCoords.length * progress));
            const visibleCoords = this._gpsTrailCoords.slice(0, pointsToShow);
            
            if (visibleCoords.length > 1) {
                const trailLine = L.polyline(visibleCoords, {
                    color: '#ff5500',
                    weight: 5,
                    opacity: 0.8
                });
                this._gpsTrailLayer.addLayer(trailLine);
            }
        }
        
        this.fire('timeload', { time: currentTime });
    }
});

L.timeDimension.layer.kmlLocations = function(locations, timelineEvents, options) {
    return new L.TimeDimension.Layer.KmlLocations(locations, timelineEvents, options);
};

// Export functions
window.parseKmlLocations = parseKmlLocations;
window.getTimelineEvents = getTimelineEvents;
