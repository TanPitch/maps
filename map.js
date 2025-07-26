/*
  Map

  TODO:
  [ ]
*/

const DOMS = {
    mapBase_osm: document.querySelector("#mapBase_osm"),
    mapBase_esri: document.querySelector("#mapBase_esri"),
    btn_load: document.querySelector("#btn_load"),
    btn_filter: document.querySelector("#btn_filter"),
    btn_overlay: document.querySelector("#btn_overlay"),
    hover_flood: document.querySelector("#hover_flood"),
};

const tile = {
    osm: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }),
    esri: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {}
    ),
    label: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
            pane: "overlayPane",
        }
    ),
};

// init map
var map = L.map("map", { zoomControl: false }).setView([13.722861988269317, 100.57774437613564], 10);
tile.osm.addTo(map);

// map base selected
DOMS.mapBase_osm.addEventListener("click", () => {
    DOMS.mapBase_osm.classList.add("selected");
    DOMS.mapBase_esri.classList.remove("selected");

    map.removeLayer(tile.esri);
    map.removeLayer(tile.label);
    tile.osm.addTo(map);
});
DOMS.mapBase_esri.addEventListener("click", () => {
    DOMS.mapBase_osm.classList.remove("selected");
    DOMS.mapBase_esri.classList.add("selected");

    map.removeLayer(tile.osm);
    tile.esri.addTo(map);
    tile.label.addTo(map);
});

map.addEventListener("move", () => {
    DOMS.hover_flood.style.opacity = 0;
});
map.addEventListener("zoomstart", () => {
    DOMS.hover_flood.style.opacity = 0;
});

// hide hover when map click
map.addEventListener("click", () => {
    const hover = document.querySelector("#click_detail");
    hover.style.opacity = 0;

    document.querySelectorAll(".pin_icon").forEach((el) => el.classList.remove("inactive"));
});
map.addEventListener("move", (e) => {
    const hover = document.querySelector("#click_detail");
    if (hover.style.opacity == 0) return;
    const [lat, lng] = hover.dataset.latlng.split(",");
    const point = map.latLngToContainerPoint({ lat: lat, lng: lng });

    hover.style.top = `${point.y - hover.offsetHeight - 20}px`;
    hover.style.left = `${point.x - hover.offsetWidth / 2 - 5}px`;
});

export const getBound = () => {
    return map.getBounds();
};
export const addTo = (el) => {
    el.addTo(map);
};
export const remove = (el) => {
    map.removeLayer(el);
};
export const setView = (el) => {
    map.setView(el);
};
