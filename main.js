const tracks = [
    { x: 0n, y: 0n, type: "straight", rotation: 0n, tags: ["none", "none", "none", "none"] }
];

const trackConnections = {
    cross: [0n, 1n, 2n, 3n],
    straight: [0n, 2n],
    tee: [0n, 2n, 3n],
    turn: [2n, 3n]
}

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
const contex = canvas.getContext("2d", { alpha: false });

let turning = "straight";
let carX = 0n;
let carY = 0n;
let carIndex = -1n;
let carDir = 0n;
let carTurning = 0n;
let carProgress = 50n;

let stopTimer = 0n;
let speedTimer = 0n;

let cameraX = 0n;
let cameraY = 0n;

let mouseDownX = 0;
let mouseDownY = 0;
let mouseDownTime = -1;
let selectX = 0n;
let selectY = 0n;
let selecting = false;

function setup() {
    eastTagSelect.innerHTML = northTagSelect.innerHTML;
    southTagSelect.innerHTML = northTagSelect.innerHTML;
    westTagSelect.innerHTML = northTagSelect.innerHTML;
    window.requestAnimationFrame(loop);
}

function modulus(a, b) {
    let r = a % b;
    if (r < 0n) {
        r += b;
    }
    return r
}

function trackIndexOf(x, y) {
    for (const i in tracks) {
        let track = tracks[i];
        if (track.x == x && track.y == y) {
            return BigInt(i);
        }
    }
    return -1n;
}

function loop() {
    //set background
    contex.fillStyle = "white";
    contex.fillRect(0, 0, 800, 800);
    //grid
    contex.strokeStyle = "#336";
    contex.beginPath()
    for (let i = -7n; i <= 9n; i++) {
        let o = 51n * i + 374n;
        let x = Number(o - modulus(cameraX, 51n));
        let y = Number(o - modulus(cameraY, 51n));
        contex.moveTo(x, 0);
        contex.lineTo(x, 800);
        contex.moveTo(0, y);
        contex.lineTo(800, y);
    }
    contex.stroke();
    //color origin gold
    contex.fillStyle = "gold";
    contex.fillRect(Number(374n - cameraX), Number(374n - cameraY), 51, 51);
    //color selected red
    contex.fillStyle = "red";
    let gSX = Number(51n * selectX + 374n - cameraX);
    let gSY = Number(51n * selectY + 374n - cameraY);
    if (selecting) {
        contex.fillRect(gSX, gSY, 51, 51);
    }
    drawRoads();
    if (selecting) {
        contex.fillRect(gSX, gSY, 3, 3);
        contex.fillRect(gSX + 48, gSY, 3, 3);
        contex.fillRect(gSX, gSY + 48, 3, 3);
        contex.fillRect(gSX + 48, gSY + 48, 3, 3);
    }
    let prevProgress = carProgress;
    if (stopTimer > 0n) {
        stopTimer--;
    } else {
        let inc = 1n;
        if (speedTimer > 0n) {
            speedTimer--;
            inc = 2n;
        }
        carProgress += inc;
        if (carTurning == 1n) {
            //double speed for inner turn
            carProgress += inc;
        }
    }
    if (prevProgress < 50n && carProgress >= 50n) {
        //run over tag
        switch (tracks[carIndex].tags[carDir]) {
            case "stop":
                stopTimer = 60n;
                break;
            case "speed":
                speedTimer = 500n;
                break;
            case "left":
                turning = "left";
                break;
            case "straight":
                turning = "straight";
                break;
            case "right":
                turning = "right";
            case "none":
            default:
                break;
        }
    }
    if (carProgress >= 100n) {
        carProgress = 0n;
        let nextDir = (carDir + carTurning) % 4n;
        switch (nextDir) {
            case 0n:
                carX++;
                break;
            case 1n:
                carY++;
                break;
            case 2n:
                carX--;
                break;
            case 3n:
                carY--;
                break;
            default:
                break;
        }
        carIndex = trackIndexOf(carX, carY);
        if (carIndex == -1) {
            resetCar();
        } else {
            carDir = nextDir;
        }
        let straight = carDir
        let right = (carDir + 1n) % 4n;
        let left = (carDir + 3n) % 4n;
        let c = trackConnections[tracks[carIndex].type].map((v) => {
            return (v + tracks[carIndex].rotation) % 4n;
        });
        let canGoStraight = c.includes(straight);
        let canTurnRight = c.includes(right);
        let canTurnLeft = c.includes(left);
        if (turning == "right") {
            if (canTurnRight) {
                carTurning = 1n;
            } else if (canGoStraight) {
                carTurning = 0n;
            } else {
                carTurning = 3n;
            }
        } else if (turning == "left") {
            if (canTurnLeft) {
                carTurning = 3n;
            } else if (canGoStraight) {
                carTurning = 0n;
            } else {
                carTurning = 1n;
            }
        } else {
            if (canGoStraight) {
                carTurning = 0n;
            } else if (canTurnRight) {
                carTurning = 1n;
            } else {
                carTurning = 3n;
            }
        }
    }
    drawCar();
    contex.resetTransform()
    window.requestAnimationFrame(loop);
}

function drawRoads() {
    for (const track of tracks) {
        let x = 51n * track.x + 399n - cameraX;
        let y = 51n * track.y + 399n - cameraY;
        if (x < -25n || x > 825n || y < -25n || y > 825n) continue;
        contex.translate(Number(x) + 0.5, Number(y) + 0.5);
        contex.rotate(Number(track.rotation % 4n) * Math.PI / 2);
        contex.translate(-0.5, -0.5);
        contex.drawImage(images[track.type], -25, -25);
        contex.resetTransform();
    }
}

function resetCar() {
    carX = 0n;
    carY = 0n;
    carDir = 0n
    carProgress = 50n;
    turning = "straight";
    stopTimer = 0n;
    speedTimer = 0n;
    carIndex = trackIndexOf(carX, carY);
    if (carIndex == -1) {
        tracks.unshift({ x: 0n, y: 0n, type: "straight", rotation: 0n, tags: ["none", "none", "none", "none"] });
        carIndex = 0n;
    }
}

function drawCar() {
    let x = 51n * carX + 399n - cameraX;
    let y = 51n * carY + 399n - cameraY;
    if (x < -25n || x > 825n || y < -25n || y > 825n) return;
    let p = Number(carProgress) / 100;
    contex.translate(Number(x) + 0.5, Number(y) + 0.5);
    contex.rotate(Number(carDir) * Math.PI / 2);
    contex.translate(-0.5, -0.5);
    if (carTurning == 0n) {
        contex.translate(51 * p - 25, 11);
    } else if (carTurning == 1n) {
        contex.translate(-25, 26);
        contex.rotate(Math.PI / 2 * p);
        contex.translate(0, -15);
    } else if (carTurning == 3n) {
        contex.translate(-25, -25);
        contex.rotate(-Math.PI / 2 * p);
        contex.translate(0, 36);
    }
    contex.drawImage(images.car, -10, -7);
}

function modifyTracks() {
    let index = trackIndexOf(selectX, selectY);
    if (index >= 0n) {
        if (trackTypeSelect.value == "empty") {
            tracks.splice(Number(index), 1);
        } else {
            tracks[index].type = trackTypeSelect.value;
            tracks[index].rotation = BigInt(trackRotationSelect.value);
            tracks[index].tags[0n] = eastTagSelect.value;
            tracks[index].tags[1n] = southTagSelect.value;
            tracks[index].tags[2n] = westTagSelect.value;
            tracks[index].tags[3n] = northTagSelect.value;
        }
    } else if (trackTypeSelect.value != "empty") {
        tracks.push({ x: selectX, y: selectY, type: trackTypeSelect.value, rotation: BigInt(trackRotationSelect.value), tags: ["none", "none", "none", "none"] });
    } else {
        trackRotationSelect.value = "0";
    }
    drawUI();
}

function drawUI() {
    let gSX = 51n * selectX + 374n - cameraX
    let gSY = 51n * selectY + 425n - cameraY
    if (gSX < 0n || gSX > 800n || gSY < 0n || gSY > 800n) {
        selecting = false;
    }
    if (!selecting) {
        menuDiv.hidden = true;
        return;
    }
    let boundingRect = canvas.getBoundingClientRect();
    gSX = Number(gSX) + boundingRect.left - window.scrollX;
    gSY = Number(gSY) + boundingRect.top - window.scrollY;
    menuDiv.style.left = gSX + "px";
    menuDiv.style.top = gSY + "px";
    menuDiv.hidden = false;
}

setup();