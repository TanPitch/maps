/*
  Image overlay

  TODO:
  [x] make filter
  [x] point detail
*/

import * as map from "./map.js";
import * as flood from "./flood.js";

const DOMS = {
    rX: document.querySelector("#rX"),
    rY: document.querySelector("#rY"),
    nX: document.querySelector("#nX"),
    nY: document.querySelector("#nY"),
    rSX: document.querySelector("#rSX"),
    rSY: document.querySelector("#rSY"),
    nSX: document.querySelector("#nSX"),
    nSY: document.querySelector("#nSY"),
    rO: document.querySelector("#rO"),
    nO: document.querySelector("#nO"),
    btn_load: document.querySelector("#btn_load"),
    btn_filter: document.querySelector("#btn_filter"),
    btn_overlay: document.querySelector("#btn_overlay"),
    btn_resetOverlay: document.querySelector("#btn_ovlReset"),

    img_modal: document.querySelector("#img_modal"),
    filter_modal: document.querySelector("#filter_modal"),
    filter_content: document.querySelector("#filter_modal .content"),
};

function degToKm(lat) {
    const latRad = (lat * Math.PI) / 180;

    const kmPerLat = 111.13295 - 0.55982 * Math.cos(2 * latRad) + 0.00117 * Math.cos(4 * latRad);
    const kmPerLng = 111.32 * Math.cos(latRad);

    return {
        kmPerLat,
        kmPerLng,
    };
}

let data = [];
let imgOverlay = [];
let imgArr = [];
let pinArr = [];

// show point detail
const detail = async (el) => {
    const dom = el._icon;
    const box = dom.getBoundingClientRect();
    const index = parseInt(dom.textContent) - 1;

    const level = await flood.getElevation(el._latlng.lat, el._latlng.lng);

    const hover = document.querySelector("#click_detail");
    hover.dataset.latlng = [el._latlng.lat, el._latlng.lng];
    hover.style.opacity = 0.8;

    const jumnong = data[index][23] == 0 ? data[index][22] : data[index][23].toLocaleString("en-US");
    hover.innerHTML = `
    <div class="row"><div class="head" style="width: 80px;">no.</div><div>${index + 1}</div></div>
    <div class="row"><div class="head" style="width: 80px;">ลำดับที่</div><div>${data[index][3]}</div></div>
    <div class="row"><div class="head" style="width: 80px;">โฉนด</div><div>${data[index][9]}</div></div>
    <div class="row"><div class="head" style="width: 80px;">ขนาด</div><div>${data[index][10]} ไร่ ${
        data[index][11]
    } งาน ${data[index][12]} ตร.วา</div></div>
    <div class="row"><div class="head" style="width: 80px;">ราคา</div><div>${data[index][25].toLocaleString(
        "en-US"
    )}</div></div>
    <div class="row"><div class="head" style="width: 80px;">ราคา/ตร.</div><div>${parseInt(
        data[index][29]
    ).toLocaleString("en-US")}</div></div>
    <div class="row"><div class="head" style="width: 80px;">จำนอง</div><div>${jumnong}</div></div>
    <div class="row"><div class="head" style="width: 80px;">ความสูง</div><div>${level} m</div></div>
    <div class="row"><div class="link" style="width: 80px;">GG map</div><div><a href="${data[index][1]}" target="_blank">link</a></div>`;

    hover.style.top = `${box.top - hover.offsetHeight - 10}px`;
    hover.style.left = `${box.left - hover.offsetWidth / 2 + 5}px`;

    document.querySelectorAll(".pin_icon").forEach((icon) => icon.classList.add("inactive"));
    dom.querySelector(".pin_icon").classList.remove("inactive");
};

const genImg = () => {
    const filterArr = filter();

    for (let i = 0; i < imgOverlay.length; i++) {
        const el = imgOverlay[i];
        if (!filterArr.includes(el.idx + 1)) continue;

        const pin = el.pin;
        const url = el.url;

        /////////////////////////////

        const k = degToKm(pin[0]);
        const [offsetX, offsetY] = [-6 + (DOMS.rX.value - 50) * 0.01, -1.787 + (DOMS.rY.value - 50) * 0.01];
        const scaleFactor = 0.00042;
        const imgRatio = [1321.8 + (DOMS.rSX.value - 50) * 1, 758.8 + (DOMS.rSY.value - 50) * 1];

        //////////////////////////////

        const deltaLng = (imgRatio[0] * scaleFactor) / k.kmPerLng; // Convert pixel width to degrees longitude
        const deltaLat = (imgRatio[1] * scaleFactor) / k.kmPerLat;

        const south = [pin[0] + offsetY * scaleFactor, pin[1] + offsetX * scaleFactor];
        const north = [south[0] + deltaLat, south[1] + deltaLng];

        const imageBounds = [south, north];

        const SIZE = 20;
        const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div class="pin_icon">${el.idx + 1}</div>`,
            iconSize: [SIZE, SIZE],
            iconAnchor: [SIZE / 2, SIZE / 2],
        });
        const img = L.imageOverlay(url, imageBounds, { opacity: DOMS.rO.value });
        const marker = L.marker(pin, { icon: icon });

        if (DOMS.rO.value !== 0) imgArr.push(img);
        pinArr.push(marker);
    }
    imgArr.forEach((el) => map.addTo(el));
    pinArr.forEach((el) => {
        map.addTo(el);
        el.addEventListener("click", () => detail(el));
    });

    function average(arr) {
        if (arr.length === 0) {
            return 0; // Handle empty array case to avoid division by zero
        }
        const sum = arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        return sum / arr.length;
    }

    const center = [
        average(pinArr.map((el) => el._latlng.lat)),
        average(pinArr.map((el) => el._latlng.lng)),
    ];
    return center;
};
const clearImg = () => {
    imgArr.forEach((el) => map.remove(el));
    pinArr.forEach((el) => map.remove(el));
    imgArr = [];
    pinArr = [];
};

const genFilter = () => {
    let row = `<div class="row" style="background: var(--white); position: sticky; top: 0;"><div id="toggleChecked">&nbsp;</div><div>&nbsp;</div>
        <div>เลขที่</div>
        <div>ไร่</div>
        <div>งาน</div>
        <div>ตร.วา</div>
        <div>ราคา</div>
        <div>ราคา/ตร.</div>
        <div>ตำบล</div>
        <div>อำเภอ</div>
        <div>จังหวัด</div>
    </div>`;
    for (const el of data) {
        if (el[42] === undefined || el[43] === undefined) continue;

        row += `<div class="row">
        <input type="checkbox" checked>
        <div>${el[0]}</div>
        <div>${el[9]}</div>
        <div>${el[10]}</div>
        <div>${el[11]}</div>
        <div>${el[12]}</div>
        <div>${el[25].toLocaleString("en-US")}</div>
        <div>${el[28].toLocaleString("en-US")}</div>
        <div>${el[14]}</div>
        <div>${el[15]}</div>
        <div>${el[16]}</div>
        </div>`;
    }
    DOMS.filter_content.innerHTML = row;
    DOMS.filter_content.querySelectorAll("input").forEach((el) => {
        el.addEventListener("input", () => {
            clearImg();
            genImg();
        });
    });
    DOMS.filter_content.querySelector("#toggleChecked").addEventListener("click", () => {
        const allChecked = [...DOMS.filter_content.querySelectorAll("input")].every(
            (input) => input.checked
        );
        [...DOMS.filter_content.querySelectorAll("input")].forEach((el) => (el.checked = !allChecked));
        clearImg();
        genImg();
    });
};
const filter = () => {
    const filtered = [];
    DOMS.filter_content.querySelectorAll(".row").forEach((el) => {
        if (el.querySelector("input")?.checked) {
            const no = parseInt(el.querySelector("div").textContent);
            filtered.push(no);
        }
    });
    return filtered;
};

DOMS.rX.addEventListener("input", () => {
    clearImg();
    genImg();
    imgArr.forEach((el) => map.addTo(el));
    DOMS.nX.value = DOMS.rX.value - 50;
});
DOMS.rY.addEventListener("input", () => {
    clearImg();
    genImg();
    imgArr.forEach((el) => map.addTo(el));
    DOMS.nY.value = DOMS.rY.value - 50;
});
DOMS.rSX.addEventListener("input", () => {
    clearImg();
    genImg();
    imgArr.forEach((el) => map.addTo(el));
    DOMS.nSX.value = DOMS.rSX.value - 50;
});
DOMS.rSY.addEventListener("input", () => {
    clearImg();
    genImg();
    imgArr.forEach((el) => map.addTo(el));
    DOMS.nSY.value = DOMS.rSY.value - 50;
});
DOMS.rO.addEventListener("input", () => {
    clearImg();
    genImg();
    imgArr.forEach((el) => map.addTo(el));
    DOMS.nO.value = DOMS.rO.value;
});

DOMS.btn_filter.addEventListener("click", () => {
    document.querySelectorAll(".modal").forEach((mo) => mo.classList.remove("top"));

    DOMS.filter_modal.style.display = "flex";
    DOMS.filter_modal.classList.add("top");
    DOMS.filter_modal.style.top = (window.innerHeight - DOMS.filter_modal.offsetHeight) / 2 + "px";
    DOMS.filter_modal.style.left = (window.innerWidth - DOMS.filter_modal.offsetWidth) / 2 + "px";
});
DOMS.btn_load.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.setAttribute("multiple", "*");
    input.click();

    let arrImg = [];
    let arrCord = [];
    input.addEventListener("change", async (e) => {
        let files = input.files;
        if (files.length <= 0) return;

        function readExcelFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: "array" });

                        const sheetName = workbook.SheetNames[0];
                        const sheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                        resolve(json);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        }

        for (const file of files) {
            if (file.type.includes("png")) {
                const match = file.name.match(/M (\d+)\s*\(/);
                if (!match) return;
                const no = parseInt(match[1]);

                const imgURL = URL.createObjectURL(file);
                arrImg.push({ no: no, url: imgURL });
            } else if (file.type.includes("openxmlformats-officedocument.spreadsheetml.sheet")) {
                const json = await readExcelFile(file);
                const cleaned = json.slice(3).map((el) => {
                    return [el[42]?.toString().trim(), el[43]?.toString().trim()];
                });
                data.push(...json.slice(3));
                arrCord.push(...cleaned); // merge to single array
            }
        }

        // combine and make img data
        if (arrCord.length <= 0) {
            console.log("no xlsx");
            return;
        }
        // if (arrImg.length < arrCord.length) {
        //     console.log("error : img less than xlsx data");
        //     return;
        // }

        const combineArr = [];
        for (let i = 0; i < arrCord.length; i++) {
            const el = arrCord[i];
            if (el[0] == undefined || el[1] == undefined) continue;

            const found = arrImg.find((item) => item.no == i + 1);

            combineArr.push({
                pin: el.map((elm) => parseFloat(elm)),
                url: found.url,
                idx: i,
            });
        }
        // console.log(arrImg, arrCord);
        imgOverlay = combineArr;

        genFilter();
        clearImg();
        map.setView(genImg());
    });
});
DOMS.btn_overlay.addEventListener("click", () => {
    document.querySelectorAll(".modal").forEach((mo) => mo.classList.remove("top"));

    DOMS.img_modal.classList.add("top");
    DOMS.img_modal.style.display = "flex";
    DOMS.img_modal.style.top = (window.innerHeight - DOMS.img_modal.offsetHeight) / 2 + "px";
    DOMS.img_modal.style.left = (window.innerWidth - DOMS.img_modal.offsetWidth) / 2 + "px";
});
DOMS.btn_resetOverlay.addEventListener("click", () => {
    DOMS.rX.value = 50;
    DOMS.rY.value = 50;
    DOMS.rSX.value = 50;
    DOMS.rSY.value = 50;
    DOMS.rO.value = 0;

    DOMS.nX.value = 0;
    DOMS.nY.value = 0;
    DOMS.nSX.value = 0;
    DOMS.nSY.value = 0;
    DOMS.nO.value = 0;
    clearImg();
    genImg();
});
