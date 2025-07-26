/*
  Flood map

  TODO:
  [ ] add 2x sea level btn
  [ ] preview box before analyse
*/

import * as map from "./map.js";

const DOMS = {
    hover_flood: document.querySelector("#hover_flood"),
    btn_flood: document.querySelector("#btn_flood"),
    flood_modal: document.querySelector("#flood_modal"),
    range_level: document.querySelector("#r_sea"),
    number_level: document.querySelector("#n_sea"),
    grid_size: document.querySelector("#gridSize"),
    range_opacity: document.querySelector("#r_seaOpacity"),
    number_opacity: document.querySelector("#n_seaOpacity"),
    log: document.querySelector("#log"),
    btn_floodAnalyze: document.querySelector("#btn_floodAnalyze"),
    btn_floodReset: document.querySelector("#btn_floodReset"),
};

DOMS.btn_flood.addEventListener("click", () => {
    document.querySelectorAll(".modal").forEach((mo) => mo.classList.remove("top"));

    DOMS.flood_modal.style.display = "flex";
    DOMS.flood_modal.classList.add("top");
    DOMS.flood_modal.style.top = (window.innerHeight - DOMS.flood_modal.offsetHeight) / 2 + "px";
    DOMS.flood_modal.style.left = (window.innerWidth - DOMS.flood_modal.offsetWidth) / 2 + "px";
});

DOMS.range_level.addEventListener("input", () => {
    DOMS.number_level.value = DOMS.range_level.value;
    drawRect();
});
DOMS.number_level.addEventListener("input", () => {
    DOMS.range_level.value = DOMS.number_level.value;
    drawRect();
});
DOMS.range_opacity.addEventListener("input", () => {
    DOMS.number_opacity.value = DOMS.range_opacity.value;
    drawRect();
});
DOMS.number_opacity.addEventListener("input", () => {
    DOMS.range_opacity.value = DOMS.number_opacity.value;
    drawRect();
});

// let map;
let elevationLayer = [];
let isAnalyzing = false;

// Get elevation data for a point
export const getElevation = async (lat, lon) => {
    try {
        const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        const data = await response.json();
        return data.results[0].elevation;
    } catch (error) {
        console.error("Error fetching elevation:", error);
        return null;
    }
};

// draw rect
const drawRect = () => {
    const seaLevel = parseFloat(DOMS.number_level.value);
    if (elevationLayer) clearRect();

    pointData.forEach((el) => {
        const isFlooded = el.elevation < seaLevel;
        const color = isFlooded ? "#3498db" : "#27ae60";
        const opacity = isFlooded ? 0.6 : 0.2;

        const rect = L.rectangle(el.rect, {
            color: color,
            fillColor: color,
            fillOpacity: opacity * DOMS.range_opacity.value,
            weight: 0,
        });
        elevationLayer.push(rect);
        map.addTo(rect);

        rect.addEventListener("mouseover", (e) => {
            const box = e.target._path.getBoundingClientRect();

            DOMS.hover_flood.style.opacity = 0.3;
            DOMS.hover_flood.style.top = `${box.top}px`;
            DOMS.hover_flood.style.left = `${box.left}px`;
            DOMS.hover_flood.style.width = `${box.width}px`;
            DOMS.hover_flood.style.height = `${box.height}px`;
            DOMS.hover_flood.textContent = `${el.elevation} m`;
        });

        rect.addEventListener("mouseout", (e) => {
            DOMS.hover_flood.style.opacity = 0;
        });
    });
};
const clearRect = () => {
    if (!elevationLayer) return;
    elevationLayer.forEach((el) => map.remove(el));
    elevationLayer = [];
};

// Analyze flood zones
let pointData = [];
const analyzeFloodZones = async () => {
    if (isAnalyzing) return;
    isAnalyzing = true;
    pointData = [];

    const createGridPoints = (bounds, resolution) => {
        const points = [];
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();

        for (let lat = south; lat <= north; lat += resolution) {
            for (let lng = west; lng <= east; lng += resolution) {
                points.push({ lat: lat, lng: lng });
            }
        }

        return points;
    };
    async function getBatchElevation(points) {
        try {
            // const locations = points.map((p) => `${p.lat},${p.lng}`).join("|");
            const response = await fetch("https://api.open-elevation.com/api/v1/lookup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    locations: points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
                }),
            });
            const data = await response.json();
            return data.results.map((r) => r.elevation);
        } catch (error) {
            console.error("Error fetching batch elevation:", error);
            return points.map(() => null);
        }
    }

    try {
        // const seaLevel = parseFloat(DOMS.range_level.value);
        const gridSize = parseFloat(DOMS.grid_size.value);
        const bounds = map.getBound();

        // Clear existing layers
        if (elevationLayer) clearRect();

        // Create grid points
        const gridPoints = createGridPoints(bounds, gridSize);
        if (gridPoints.length > 500) {
            if (
                !confirm(`This will analyze ${gridPoints.length} points. This might take a while. Continue?`)
            ) {
                return;
            }
        }

        DOMS.log.innerHTML = `<span>Analyzing ${gridPoints.length} grid points...</span>`;

        // Process points in batches to avoid overwhelming the API
        const batchSize = 50;
        let processedCount = 0;

        for (let i = 0; i < gridPoints.length; i += batchSize) {
            const batch = gridPoints.slice(i, i + batchSize);

            try {
                const elevations = await getBatchElevation(batch);

                for (let j = 0; j < batch.length; j++) {
                    const point = batch[j];
                    const elevation = elevations[j];

                    if (elevation !== null) {
                        pointData.push({
                            rect: [
                                [point.lat - gridSize / 2, point.lng - gridSize / 2],
                                [point.lat + gridSize / 2, point.lng + gridSize / 2],
                            ],
                            point: point,
                            elevation: elevation,
                        });
                    }

                    // if (elevation !== null) {
                    //     const isFlooded = elevation < seaLevel;

                    //     // Create rectangle for each grid point
                    //     const rectBounds = [
                    //         [point.lat - gridSize / 2, point.lng - gridSize / 2],
                    //         [point.lat + gridSize / 2, point.lng + gridSize / 2],
                    //     ];

                    //     const color = isFlooded ? "#3498db" : "#27ae60";
                    //     const opacity = isFlooded ? 0.6 : 0.3;

                    //     const rectangle = L.rectangle(rectBounds, {
                    //         color: color,
                    //         fillColor: color,
                    //         fillOpacity: opacity,
                    //         weight: 0.5,
                    //     });

                    //     allRectangles.push(rectangle);

                    //     if (isFlooded) floodedCount++;
                    // }
                }

                processedCount += batch.length;
                DOMS.log.innerHTML = `<span>Processed ${processedCount}/${gridPoints.length}</span>`;

                // Small delay to prevent overwhelming the API
                await new Promise((resolve) => setTimeout(resolve, 200));
            } catch (error) {
                console.error("Error processing batch:", error);
            }
        }
        drawRect();

        // Add all rectangles to map
        // elevationLayer = allRectangles;
        // allRectangles.forEach((el) => map.addTo(el));

        // Update statistics
        // const coverage = ((floodedCount / processedCount) * 100).toFixed(1);
        // document.getElementById("gridPoints").textContent = processedCount;
        // document.getElementById("floodedAreas").textContent = floodedCount;
        // document.getElementById("coverage").textContent = coverage;

        DOMS.log.innerHTML = '<span class="success">Analysis complete!</span>';
    } catch (error) {
        console.error("Error during analysis:", error);
        DOMS.log.innerHTML = '<span class="error">Error during analysis. Please try again.</span>';
    } finally {
        isAnalyzing = false;
    }
};

DOMS.btn_floodAnalyze.addEventListener("click", analyzeFloodZones);
DOMS.btn_floodReset.addEventListener("click", clearRect);
