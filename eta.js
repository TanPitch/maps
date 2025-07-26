/*
  ETA

  TODO:
  [ ]
*/

let map;
let markers = [];
let routes = [];

// Initialize map
function initMap() {
    map = L.map("map").setView([13.7563, 100.5018], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
    }).addTo(map);
}

// Parse coordinate input
function parseCoordinates(input) {
    const coords = input.split(",").map((c) => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
        throw new Error("Invalid coordinates format");
    }
    return coords;
}

// Calculate route using OSRM
async function getRoute(start, end, profile) {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
            };
        } else {
            throw new Error("No route found");
        }
    } catch (error) {
        console.error(`Error getting ${profile} route:`, error);
        throw error;
    }
}

// Format time duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Format distance
function formatDistance(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    } else {
        return `${Math.round(meters)} m`;
    }
}

// Clear map
function clearMap() {
    markers.forEach((marker) => map.removeLayer(marker));
    routes.forEach((route) => map.removeLayer(route));
    markers = [];
    routes = [];
    document.getElementById("results").style.display = "none";
}

// Add markers to map
function addMarkers(pointA, pointB) {
    const markerA = L.marker(pointA).addTo(map).bindPopup("Point A");

    const markerB = L.marker(pointB).addTo(map).bindPopup("Point B");

    markers.push(markerA, markerB);

    // Fit map to show both points
    const group = new L.featureGroup([markerA, markerB]);
    map.fitBounds(group.getBounds().pad(0.1));
}

// Add route to map
function addRouteToMap(geometry, color, profile) {
    const route = L.geoJSON(geometry, {
        style: {
            color: color,
            weight: 5,
            opacity: 0.7,
        },
    }).addTo(map);

    route.bindPopup(`${profile} route`);
    routes.push(route);
}

// Main calculation function
async function calculateRoute() {
    const loadingEl = document.getElementById("loading");
    const resultsEl = document.getElementById("results");
    const routeResultsEl = document.getElementById("routeResults");

    try {
        // Parse coordinates
        const pointA = parseCoordinates(document.getElementById("pointA").value);
        const pointB = parseCoordinates(document.getElementById("pointB").value);

        // Clear previous results
        clearMap();
        loadingEl.style.display = "block";
        resultsEl.style.display = "none";

        // Add markers
        addMarkers(pointA, pointB);

        // Calculate both driving and walking routes
        const [drivingRoute, walkingRoute] = await Promise.all([
            getRoute(pointA, pointB, "driving"),
            getRoute(pointA, pointB, "foot"),
        ]);

        // Add routes to map
        addRouteToMap(drivingRoute.geometry, "#28a745", "driving");
        addRouteToMap(walkingRoute.geometry, "#17a2b8", "walking");

        // Display results
        routeResultsEl.innerHTML = `
                    <div class="result-item driving">
                        <div>
                            <strong>🚗 Driving</strong><br>
                            Distance: ${formatDistance(drivingRoute.distance)}<br>
                            ETA: ${formatDuration(drivingRoute.duration)}
                        </div>
                        <div style="text-align: right; color: #666;">
                            ${(drivingRoute.distance / 1000).toFixed(2)} km<br>
                            ${Math.round(drivingRoute.duration / 60)} min
                        </div>
                    </div>
                    <div class="result-item walking">
                        <div>
                            <strong>🚶 Walking</strong><br>
                            Distance: ${formatDistance(walkingRoute.distance)}<br>
                            ETA: ${formatDuration(walkingRoute.duration)}
                        </div>
                        <div style="text-align: right; color: #666;">
                            ${(walkingRoute.distance / 1000).toFixed(2)} km<br>
                            ${Math.round(walkingRoute.duration / 60)} min
                        </div>
                    </div>
                `;

        resultsEl.style.display = "block";
    } catch (error) {
        routeResultsEl.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        resultsEl.style.display = "block";
    } finally {
        loadingEl.style.display = "none";
    }
}

// Initialize map when page loads
document.addEventListener("DOMContentLoaded", function () {
    initMap();
});

// Allow Enter key to trigger calculation
document.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        calculateRoute();
    }
});
