const images = {
    car: document.getElementById("carImg"),
    light: document.getElementById("lightImg"),
    navigation: document.getElementById("navigationImg"),
    policeLight: document.getElementById("policeLightImg"),
    trackAtlas: document.getElementById("trackAtlasImg")
};

const trackAtlasPositions = {
    blank: {x: 0, y: 0},
    cross: {x: 51, y: 102},
    splitCenter: {x: 51, y: 51},
    splitLeft: {x: 102, y: 51},
    splitRight: {x: 0, y: 102},
    straight: {x: 51, y: 0},
    tee: {x: 0, y: 51},
    turn: {x: 102, y: 0}
}

const menuDiv = document.getElementById("menu");
const tagDiv = document.getElementById("tags");
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