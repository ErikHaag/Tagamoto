const tracks = [
    { x: 0n, y: 0n, type: "straight", rotation: 0n, tags: ["none", "none", "none", "none"] }
];

const trackConnections = {
    cross: [0n, 1n, 2n, 3n],
    straight: [0n, 2n],
    splitCenter: [[3n],[0n,2n],[3n],[0n,2n,3n]],
    tee: [0n, 2n, 3n],
    turn: [2n, 3n]
}

const trackOrientationMod = {
    cross: 1n,
    straight: 2n,
    splitCenter: 4n,
    tee: 4n,
    turn: 4n
}

const directions = ["east", "south", "west", "north"];

const contex = canvas.getContext("2d");

let turning = "straight";
let carX = 0n;
let carY = 0n;
let carIndex = -1n;
let carDir = 0n;
let carTurning = 0n;
let carProgress = 50n;
let turnQueue = [];

// timers
let stopTimer = 0n;
let speedTimer = 0n;

// booleans
let headlights = false;

let cameraX = 0n;
let cameraY = 0n;

let mouseDownX = 0;
let mouseDownY = 0;
let mouseDownTime = -1;
let selectX = 0n;
let selectY = 0n;
let selecting = false;

function setup() {
    let hasTouchScreen = navigator?.maxTouchPoints > 0 || navigator?.msMaxTouchPoints > 0;
    if (hasTouchScreen && window.confirm("Touch screen detected,\nwould you like to use this?")) {
        canvas.addEventListener("pointerdown", pointerDown);
        canvas.addEventListener("pointerup", pointerUp);
        document.addEventListener("pointerup", () => {
            selecting = false;
            updateUI("trackDialog");
        });
        menuDiv.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
        });
        menuDiv.addEventListener("pointerup", (e) => {
            e.stopPropagation();
        });
    } else {
        canvas.addEventListener("mousedown", pointerDown);
        canvas.addEventListener("mouseup", pointerUp);       
        document.addEventListener("mouseup", () => {
            selecting = false;
            updateUI("trackDialog");
        });     
        menuDiv.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });
        menuDiv.addEventListener("mouseup", (e) => {
            e.stopPropagation();
        });
    }
    let options = document.getElementById("northTag").innerHTML
    for (let i = 0n; i < 3n; i++) {
        document.getElementById(directions[i] + "Tag").innerHTML = options;
    }
    updateUI("all");
    setInterval(loop, 15);
    window.requestAnimationFrame(draw);
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
    updateCar();
}

function draw() {
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
    //color corners of selected
    if (selecting) {
        contex.fillStyle = "red";
        contex.fillRect(gSX, gSY, 3, 3);
        contex.fillRect(gSX + 48, gSY, 3, 3);
        contex.fillRect(gSX, gSY + 48, 3, 3);
        contex.fillRect(gSX + 48, gSY + 48, 3, 3);
    }
    drawCar();
    contex.resetTransform()
    window.requestAnimationFrame(draw);
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
        contex.fillStyle = "white";
        contex.translate(Number(x), Number(y));
        for (let i = 0n; i <= 3n; i++) {
            if (track.tags[i] != "none") {
                contex.fillRect(-25, 9, 8, 5);
            }
            contex.translate(0.5, 0.5);
            contex.rotate(Math.PI / 2);
            contex.translate(-0.5, -0.5);
        }
        contex.resetTransform();
    }
}

function resetCar() {
    carX = 0n;
    carY = 0n;
    carDir = 0n
    carProgress = 50n;
    turning = "straight";
    turnQueue = [];
    updateUI("carControls");
    stopTimer = 0n;
    speedTimer = 0n;
    headlights = false;
    carIndex = trackIndexOf(carX, carY);
    if (carIndex == -1) {
        tracks.unshift({ x: 0n, y: 0n, type: "straight", rotation: 0n, tags: ["none", "none", "none", "none"] });
        carIndex = 0n;
    }
    updateTurning();
}

function updateCar() {
    if (!driveEnable.checked) {
        return;
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
        processTag();
    }
    if (carProgress >= 100n) {
        carProgress = 0n;
        let nextDir = (carDir + carTurning) % 4n;
        [carX, carY] = headInDir(carX, carY, nextDir);
        carIndex = trackIndexOf(carX, carY);
        if (carIndex == -1) {
            resetCar();
        } else {
            carDir = nextDir;
        }
        updateTurning();
    }
}

function headInDir(x, y, dir) {
    switch (dir) {
        case 0n:
            return [x + 1n, y];
        case 1n:
            return [x, y + 1n];
        case 2n:
            return [x - 1n, y];
        case 3n:
            return [x, y - 1n];
        default:
            return [x, y];
    }
}

function processTag() {
    // normal tags
    switch (tracks[carIndex].tags[carDir]) {
        case "stop":
            stopTimer = 60n;
            break;
        case "speed":
            speedTimer = 500n;
            break;
        case "left":
            if (navTagEnable.checked) {
                turning = "left";
                updateUI("carControls");
            }
            break;
        case "straight":
            if (navTagEnable.checked) {
                turning = "straight";
                updateUI("carControls");
            }
            break;
        case "right":
            if (navTagEnable.checked) {
                turning = "right";
                updateUI("carControls");
            }
            break;
        case "returnToOrigin":
            navigateTo(0n, 0n);
            break;
        case "headlightsOn":
            headlights = true;
            break;
        case "headlightsOff":
            headlights = false;
            break;
        case "none":
        default:
            break;
    }
    if (typeof tracks[carIndex].tags[carDir] == "object") {
        // special tags
        let tagData = tracks[carIndex].tags[carDir]
        switch (tagData.type) {
            case "driveTo":
                if (navTagEnable.checked) {
                    navigateTo(tagData.x, tagData.y, tagData.dir);
                }
                break;
            default:
                break;
        }
    }
}

function updateTurning() {
    if (turnQueue.length > 1) {
        carTurning = turnQueue.shift()
        switch (carTurning) {
            case 1n:
                turning = "right";
                break;
            case 0n:
                turning = "straight";
                break;
            case 3n:
                turning = "left";
                break;
            default:
                break;
        }
        updateUI("carControls");
    } else if (turnQueue.length == 1) {
        turning = turnQueue.shift();
        updateUI("carControls");
    }
    let straight = modulus(carDir - tracks[carIndex].rotation, 4n);
    let right = (straight + 1n) % 4n;
    let left = (straight + 3n) % 4n;
    let trackType = tracks[carIndex].type;
    let c = structuredClone(trackConnections[trackType]);
    if (typeof c[0] != "bigint") {
        c = c[straight];
    }
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
    if (turnQueue.length) {
        contex.drawImage(images.navigation, -10, -7);
    }
    if (headlights) {
        contex.drawImage(images.light, 10, -7);
    }
}

function modifyTracks() {
    let index = trackIndexOf(selectX, selectY);
    if (index >= 0n) {
        if (trackTypeSelect.value == "empty") {
            tracks.splice(Number(index), 1);
        } else {
            tracks[index].type = trackTypeSelect.value;
            tracks[index].rotation = BigInt(trackRotationSelect.value);
            for (let i = 0n; i < 4n; i++) {
                let tagDir = directions[i];
                let tag = document.getElementById(tagDir + "Tag").value
                switch (tag) {
                    case "driveTo":
                        tracks[index].tags[i] = {
                            type: "driveTo",
                            x: BigInt(document.getElementById(tagDir + "DriveToX").value),
                            y: -BigInt(document.getElementById(tagDir + "DriveToY").value),
                            dir: BigInt(document.getElementById(tagDir + "DriveToDir").value)
                        };
                        break;
                    default:
                        tracks[index].tags[i] = tag;
                        break;
                }
            }
        }
    } else if (trackTypeSelect.value != "empty") {
        tracks.push({ x: selectX, y: selectY, type: trackTypeSelect.value, rotation: BigInt(trackRotationSelect.value), tags: ["none", "none", "none", "none"] });
    } else {
        trackRotationSelect.value = "0";
    }
    updateUI("tagMenu");
}

function updateUI(...sections) {
    let index = trackIndexOf(selectX, selectY);
    for (const s of sections) {
        let updateOne = s != "all";
        switch (s) {
            case "all":
            case "carControls":
                leftButton.className = turning == "left" ? "highlight" : "";
                straightButton.className = turning == "straight" ? "highlight" : "";
                rightButton.className = turning == "right" ? "highlight" : "";
                if (updateOne) break;
            case "trackDialog":
                selectedCoordinatesP.innerText = "X: " + selectX + ", Y: " + -selectY;
                let gSX = 51n * selectX + 374n - cameraX;
                let gSY = 51n * selectY + 425n - cameraY;
                if (gSX < 0n || gSX > 800n || gSY < 0n || gSY > 800n) {
                    selecting = false;
                }
                if (selecting) {
                    let boundingRect = canvas.getBoundingClientRect();
                    let s = boundingRect.width / 800;
                    gSX = s * Number(gSX) + boundingRect.left + window.scrollX;
                    gSY = s * Number(gSY) + boundingRect.top + window.scrollY;
                    menuDiv.style.left = gSX + "px";
                    menuDiv.style.top = gSY + "px";
                }
                menuDiv.hidden = !selecting;
                if (updateOne) break;
            case "rotationSelect":
                if (index != -1n) {
                    let rotationMod = trackOrientationMod[tracks[index].type];
                    trackRotationSelect.children[1].hidden = rotationMod == 1n;
                    trackRotationSelect.children[2].hidden = rotationMod != 4n;
                    trackRotationSelect.children[3].hidden = rotationMod != 4n;
                    if (trackRotationSelect.value == "3" && rotationMod != 4n) {
                        trackRotationSelect.value = "1";
                    }
                    if (trackRotationSelect.value == "2" && rotationMod != 4n) {
                        trackRotationSelect.value = "0";
                    }
                    if (trackRotationSelect.value == "1" && rotationMod == 1n) {
                        trackRotationSelect.value = "0";
                    }
                } else {
                    trackRotationSelect.children[1].hidden = true;
                    trackRotationSelect.children[2].hidden = true;
                    trackRotationSelect.children[3].hidden = true;
                    trackRotationSelect.value = "0";
                }
                if (updateOne) break;
            case "tagMenu":
                tagDiv.hidden = index == -1n;
                let trackTag = "";
                for (let i = 0n; i < 4n; i++) {
                    let tagDir = directions[i];
                    if (index != -1n) {
                        trackTag = tracks[index].tags[i];
                        if (typeof trackTag == "object") {
                            trackTag = trackTag.type;
                        }
                        if (trackTag == "driveTo") {
                            document.getElementById(tagDir + "DriveToX").value = tracks[index].tags[i].x;
                            document.getElementById(tagDir + "DriveToY").value = -tracks[index].tags[i].y;
                            document.getElementById(tagDir + "DriveToDir").value = tracks[index].tags[i].dir;
                        } else {
                            document.getElementById(tagDir + "DriveToX").value = "0";
                            document.getElementById(tagDir + "DriveToY").value = "0";
                            document.getElementById(tagDir + "DriveToDir").value = "-1";
                        }
                    } else {
                        trackTag = "none";
                    }
                    document.getElementById(tagDir + "DriveTo").hidden = trackTag != "driveTo";
                }
            default:
                break;
        }
        if (!updateOne) {
            break;
        }
    }
}

document.addEventListener("DOMContentLoaded", setup);