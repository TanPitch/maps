/*
  Quick search

  TODO:
  [ ] add custom data
*/

import * as map from "./map.js";

const DOMS = {
    hospital_all: document.querySelector("#btn_s_hosAll"),
    hos: document.querySelector("#btn_s_hospital"),
    clinic: document.querySelector("#btn_s_clinic"),
    dent: document.querySelector("#btn_s_dentist"),
    pharma: document.querySelector("#btn_s_pharmarcy"),

    educated_all: document.querySelector("#btn_s_eduAll"),
    kindergarten: document.querySelector("#btn_s_kindergarten"),
    school: document.querySelector("#btn_s_school"),
    university: document.querySelector("#btn_s_university"),

    utilityAll: document.querySelector("#btn_s_utilAll"),
    police: document.querySelector("#btn_s_police"),
    fire: document.querySelector("#btn_s_fire"),
    water: document.querySelector("#btn_s_water"),
    electricity: document.querySelector("#btn_s_electric"),

    transport: document.querySelector("#btn_s_transport"),
    airport: document.querySelector("#btn_s_airport"),
    train: document.querySelector("#btn_s_train"),
    metro: document.querySelector("#btn_s_metro"),
    bus: document.querySelector("#btn_s_bus"),
    port: document.querySelector("#btn_s_port"),
};

const detail = (text, type, e) => {
    if (type == "") return;

    const hover = document.querySelector("#hover_detail");
    hover.style.opacity = type == "show" ? 0.8 : 0;
    if (type == "show") hover.innerHTML = text;
    if (type == "show") {
        hover.style.top = `${e.containerPoint.y - hover.offsetHeight - 10}px`;
        hover.style.left = `${e.containerPoint.x - hover.offsetWidth / 2}px`;
    }
};

var search_result = [];
const search_type = async (type) => {
    if (!type) return;

    const bounDOMS = map.getBound();
    const bbox = `${bounDOMS.getSouth()},${bounDOMS.getWest()},${bounDOMS.getNorth()},${bounDOMS.getEast()}`;

    let query, pretext;
    const dict = {
        hospital: `
            node["amenity"="hospital"](${bbox});
            way["amenity"="hospital"](${bbox});
            relation["amenity"="hospital"](${bbox});
            way["building"="hospital"](${bbox});
            relation["building"="hospital"](${bbox});`,
        ambulance: `
            node["amenity"="ambulance_station"](${bbox});
            way["amenity"="ambulance_station"](${bbox});
            relation["amenity"="ambulance_station"](${bbox});`,
        clinic: `
            node["amenity"~"clinic|doctors"](${bbox});
            way["amenity"~"clinic|doctors"](${bbox});
            relation["amenity"~"clinic|doctors"](${bbox});
            way["building"~"clinic|doctors"](${bbox});
            relation["building"~"clinic|doctors"](${bbox});`,
        dentist: `
            node["amenity"="dentist"](${bbox});
            way["amenity"="dentist"](${bbox});
            relation["amenity"="dentist"](${bbox});`,
        pharmacy: `
            node["amenity"="pharmacy"](${bbox});
            way["amenity"="pharmacy"](${bbox});
            relation["amenity"="pharmacy"](${bbox});`,
        kindergarten: `
            node["amenity"="kindergarten"](${bbox});
            way["amenity"="kindergarten"](${bbox});
            relation["amenity"="kindergarten"](${bbox});`,
        school: `
            node["amenity"="school"](${bbox});
            way["amenity"="school"](${bbox});
            relation["amenity"="school"](${bbox});`,
        university: `
            node["amenity"~"university|college"](${bbox});
            way["amenity"~"university|college"](${bbox});
            relation["amenity"~"university|college"](${bbox});`,
        townhall: `
            node["office"="townhall"](${bbox});
            way["office"="townhall"](${bbox});
            relation["office"="townhall"](${bbox});`,
        government: `
            node["office"="government"](${bbox});
            way["office"="government"](${bbox});
            relation["office"="government"](${bbox});`,
        police: `
            node["amenity"="police"](${bbox});
            way["amenity"="police"](${bbox});
            relation["amenity"="police"](${bbox});`,
        firestation: `
            node["amenity"="fire_station"](${bbox});
            way["amenity"="fire_station"](${bbox});
            relation["amenity"="fire_station"](${bbox});`,
        waterwork: `
            node["man_made"="water_works"](${bbox});
            way["man_made"="water_works"](${bbox});
            relation["man_made"="water_works"](${bbox});

            node["office"="water_utility"](${bbox});
            way["office"="water_utility"](${bbox});
            relation["office"="water_utility"](${bbox});`,
        electricity: `
            node["office"="energy_supplier"](${bbox});
            way["office"="energy_supplier"](${bbox});
            relation["office"="energy_supplier"](${bbox});

            node["power"="station"](${bbox});
            way["power"="station"](${bbox});
            relation["power"="station"](${bbox});`,
        airport: `
            node["aeroway"~"aerodrome|airport|helipad"](${bbox});
            way["aeroway"~"aerodrome|airport|helipad"](${bbox});
            relation["aeroway"~"aerodrome|airport|helipad"](${bbox});`,
        train: `
            node["railway"~"station|halt|stop"](${bbox});
            way["railway"~"station|halt|stop"](${bbox});`,
        metro: `
            node["railway"~"subway_entrance|tram_stop"](${bbox});
            node["station"="subway"](${bbox});`,
        bus: `
            node["highway"="bus_stop"](${bbox});
            node["amenity"="bus_station"](${bbox});
            way["amenity"="bus_station"](${bbox});`,
        port: `
            // ⛴ Ferry terminals
            node["amenity"="ferry_terminal"](${bbox});
            way["amenity"="ferry_terminal"](${bbox});
            relation["amenity"="ferry_terminal"](${bbox});

            // 🛳 Ports / piers / ship terminals
            node["man_made"="pier"](${bbox});
            way["man_made"="pier"](${bbox});`,
    };

    switch (type) {
        case "medical":
            pretext = dict.hospital + dict.clinic + dict.dentist + dict.pharmacy;
            break;
        case "hospital":
            pretext = dict.hospital;
            break;
        case "clinic":
            pretext = dict.clinic;
            break;
        case "dentist":
            pretext = dict.dentist;
            break;
        case "pharmacy":
            pretext = dict.pharmacy;
            break;
        case "education":
            pretext = dict.kindergarten + dict.school + dict.university;
            break;
        case "kindergarten":
            pretext = dict.kindergarten;
            break;
        case "school":
            pretext = dict.school;
            break;
        case "university":
            pretext = dict.university;
            break;
        case "municipal offices":
            pretext = dict.townhall + dict.government;
            break;
        case "utility":
            pretext = dict.police + dict.firestation + dict.waterwork + dict.electricity;
            break;
        case "police":
            pretext = dict.police;
            break;
        case "firestation":
            pretext = dict.firestation;
            break;
        case "waterwork":
            pretext = dict.waterwork;
            break;
        case "electricity":
            pretext = dict.electricity;
            break;
        case "transport":
            pretext = dict.airport + dict.train + dict.metro + dict.bus + dict.port;
            break;
        case "airport":
            pretext = dict.airport;
            break;
        case "train":
            pretext = dict.train;
            break;
        case "metro":
            pretext = dict.metro;
            break;
        case "bus":
            pretext = dict.bus;
            break;
        case "port":
            pretext = dict.port;
            break;
    }
    query = `[out:json][timeout:25];(${pretext});out center;`;

    const url = "https://overpass-api.de/api/interpreter";
    const response = await fetch(url, {
        method: "POST",
        body: query,
    });
    const data = await response.json();

    if (search_result.length > 0) {
        search_result.forEach((el) => map.remove(el));
        search_result = [];
    }

    data.elements.forEach((el) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const name = el.tags?.name || null;
        if (lat && lon && name) {
            const icon = L.divIcon({
                className: "custom-div-icon",
                html: `<div class="search_icon"><span class="material-symbols-outlined">location_on</span></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });
            const marker = L.marker([lat, lon], { icon: icon });
            search_result.push(marker);
            map.addTo(marker);
            marker.addEventListener("mouseover", (e) => {
                detail(`<div class="head">${name}</div>${el.tags?.amenity}`, "show", e);
            });
            marker.addEventListener("mouseout", () => {
                detail("", "hide");
            });
            // .bindPopup(`<strong>${name}</strong><br>${el.tags?.amenity}`);
        }
    });
};

DOMS.hospital_all.addEventListener("click", () => {
    search_type("medical");
});
DOMS.hos.addEventListener("click", () => {
    search_type("hospital");
});
DOMS.clinic.addEventListener("click", () => {
    search_type("clinic");
});
DOMS.dent.addEventListener("click", () => {
    search_type("dentist");
});
DOMS.pharma.addEventListener("click", () => {
    search_type("pharmacy");
});

DOMS.educated_all.addEventListener("click", () => {
    search_type("education");
});
DOMS.kindergarten.addEventListener("click", () => {
    search_type("kindergarten");
});
DOMS.school.addEventListener("click", () => {
    search_type("school");
});
DOMS.university.addEventListener("click", () => {
    search_type("university");
});

document.querySelector("#btn_s_city").addEventListener("click", () => {
    search_type("municipal offices");
});

DOMS.utilityAll.addEventListener("click", () => {
    search_type("utility");
});
DOMS.police.addEventListener("click", () => {
    search_type("police");
});
DOMS.fire.addEventListener("click", () => {
    search_type("firestation");
});
DOMS.water.addEventListener("click", () => {
    search_type("waterwork");
});
DOMS.electricity.addEventListener("click", () => {
    search_type("electricity");
});

DOMS.transport.addEventListener("click", () => {
    search_type("transport");
});
DOMS.airport.addEventListener("click", () => {
    search_type("airport");
});
DOMS.train.addEventListener("click", () => {
    search_type("train");
});
DOMS.metro.addEventListener("click", () => {
    search_type("metro");
});
DOMS.bus.addEventListener("click", () => {
    search_type("bus");
});
DOMS.port.addEventListener("click", () => {
    search_type("port");
});
