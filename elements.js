const images = {
    car: document.getElementById("carImg"),
    cross: document.getElementById("crossImg"),
    light: document.getElementById("lightImg"),
    straight: document.getElementById("straightImg"),
    tee: document.getElementById("teeImg"),
    turn: document.getElementById("turnImg"),
    navigation: document.getElementById("navigationImg")
};

const menuDiv = document.getElementById("menu");
const selectedCoordinatesP = document.getElementById("selectedCoords");
const canvas = document.getElementById("grid");
const trackTypeSelect = document.getElementById("type");
const trackRotationSelect = document.getElementById("rotation");
const resetCameraButton = document.getElementById("resetCamera");
const resetCarButton = document.getElementById("resetCar");
const rightButton = document.getElementById("right");
const straightButton = document.getElementById("straight");
const leftButton = document.getElementById("left");
const driveEnable = document.getElementById("enableDrive")
const navTagEnable = document.getElementById("enableNav");
const moveUp = document.getElementById("moveUp");
const moveLeft = document.getElementById("moveLeft");
const turnClockwise = document.getElementById("turnClockwise");
const moveRight = document.getElementById("moveRight");
const moveDown = document.getElementById("moveDown");