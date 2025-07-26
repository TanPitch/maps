var modalDrag = false;
var startX = 0; // Initialize with 0 for safety
var startY = 0; // Initialize with 0 for safety

var modalX = 0; // Store the modal's current X position
var modalY = 0; // Store the modal's current Y position

var modal = null;
const modal_start = (e) => {
    if (modalDrag) return;
    startX = e.clientX;
    startY = e.clientY;

    modal = e.currentTarget.parentNode;
    const computedStyle = window.getComputedStyle(modal);
    modalX = parseFloat(computedStyle.left || 0);
    modalY = parseFloat(computedStyle.top || 0);

    // move active modal to top
    document.querySelectorAll(".modal").forEach((el) => el.classList.remove("top"));
    modal.classList.add("top");

    modalDrag = true;
};
const modal_drag = (e) => {
    if (!modalDrag) return;
    var deltaX = e.clientX - startX;
    var deltaY = e.clientY - startY;

    var newModalX = Math.min(Math.max(modalX + deltaX, 0), window.innerWidth - modal.offsetWidth);

    var newModalY = Math.min(Math.max(modalY + deltaY, 0), window.innerHeight - modal.offsetHeight);

    modal.style.left = `${newModalX}px`;
    modal.style.top = `${newModalY}px`;
};
const modal_up = (e) => {
    modalDrag = false;
};

const modals = document.querySelectorAll(".modal");
modals.forEach((el) => {
    el.querySelector("div").addEventListener("mousedown", (e) => modal_start(e));

    // move active modal to top
    el.addEventListener("click", () => {
        document.querySelectorAll(".modal").forEach((mo) => mo.classList.remove("top"));
        el.classList.add("top");
    });
});
document.addEventListener("mousemove", (e) => modal_drag(e));
document.addEventListener("mouseup", (e) => modal_up());

document.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".modal")) {
        document.querySelectorAll(".modal").forEach((mo) => mo.classList.remove("top"));
    }
});
