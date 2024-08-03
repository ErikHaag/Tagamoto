const images = {
    car: document.getElementById("carImg"),
    cross: document.getElementById("crossImg"),
    straight: document.getElementById("straightImg"),
    tee: document.getElementById("teeImg"),
    turn: document.getElementById("turnImg")
};

const menuDiv = document.getElementById("menu");
const northTagSelect = document.getElementById("northTag");
const eastTagSelect = document.getElementById("eastTag");
const southTagSelect = document.getElementById("southTag");
const westTagSelect = document.getElementById("westTag");
const canvas = document.getElementById("grid");
const trackTypeSelect = document.getElementById("type");
const trackRotationSelect = document.getElementById("rotation");
const resetCameraButton = document.getElementById("resetCamera");
const resetCarButton = document.getElementById("resetCar");
const rightButton = document.getElementById("right");
const straightButton = document.getElementById("straight");
const leftButton = document.getElementById("left");
const navTagEnable = document.getElementById("enableNav");