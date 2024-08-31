//placed tracks
const tracks = [
    { x: 0n, y: 0n, type: "straight", rotation: 0n, tags: ["none", "none", "none", "none"], signs: ["none", "none", "none", "none"] }
];

//the directions the car can leave this piece
const trackConnections = {
    cross: [0n, 1n, 2n, 3n],
    crossing: [[0n], [1n], [2n], [3n]],
    straight: [0n, 2n],
    splitCenter: [[3n], [0n, 2n], [3n], [0n, 2n, 3n]],
    splitLeft: [[0n, 3n], [2n], [2n], [0n, 2n, 3n]],
    splitRight: [[0n, 1n], [0n, 1n, 2n], [2n], [2n]],
    tee: [0n, 2n, 3n],
    turn: [2n, 3n]
}

//the number of unique orientations, used in rotation select and rotate transformation
const trackOrientationMod = {
    cross: 1n,
    crossing: 1n,
    straight: 2n,
    splitCenter: 4n,
    splitLeft: 4n,
    splitRight: 4n,
    tee: 4n,
    turn: 4n
}

//cardinal directions (-Y is north, +X is east)
const directions = ["east", "south", "west", "north"];

//drawing context
const contex = canvas.getContext("2d");

//car specific variables (potential todo: have multiple cars)
let turning = "straight";
let carX = 0n;
let carY = 0n;
let carIndex = -1n;
let carDir = 0n;
let carTurning = 0n;
let carProgress = 50n;
let turnQueue = [];

//timers
let stopTimer = 0n;
let speedTimer = 0n;

//booleans
const headlightFlag = 1n;
const policeLightFlag = 2n;
let flags = 0n;

//camera 
let cameraX = 0n;
let cameraY = 0n;

//canvas variables
let mouseDownX = 0;
let mouseDownY = 0;
let mouseDownTime = -1;
let selectX = 0n;
let selectY = 0n;
let selectIndex = -1n;
let selecting = false;

function setup() {
    //copy tags and menus for each direction
    let tagDivHtml = tagDiv.innerHTML;
    let signDivHtml = signDiv.innerHTML;
    let newTagDivHtml = "";
    let newSignDivHtml = "";
    for (let i = 0n; i <= 3n; i++) {
        let dir = directions[(i + 3n) % 4n];
        let capitalizedDir = dir[0].toUpperCase() + dir.substring(1);
        newTagDivHtml += tagDivHtml.replaceAll("[dir]", dir).replaceAll("[Dir]", capitalizedDir);
        newSignDivHtml += signDivHtml.replaceAll("[dir]", dir).replaceAll("[Dir]", capitalizedDir);
    }
    tagDiv.innerHTML = "<p>Tags</p>" + newTagDivHtml;
    signDiv.innerHTML = "<p>Signs</p>" + newSignDivHtml;
    //add all the events
    setupEvents();
    //ensure the ui is in correct state
    updateUI("all");
    //update loop
    setInterval(loop, 15);
    //draw loop
    window.requestAnimationFrame(draw);
}

function modulus(a, b) {
    //modulus operator without negative results
    let r = a % b;
    if (r < 0n) {
        r += b;
    }
    return r
}

function trackIndexOf(x, y) {
    //basically track.indexOf()
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
    //draw signs above car
    drawSigns();
    window.requestAnimationFrame(draw);
}

function drawRoads() {
    //for each track piece...
    for (const track of tracks) {
        // get its relative position
        let x = 51n * track.x + 399n - cameraX;
        let y = 51n * track.y + 399n - cameraY;
        //if offscreen, ignore it
        if (x < -25n || x > 825n || y < -25n || y > 825n) continue;
        //translate to center
        contex.translate(Number(x) + 0.5, Number(y) + 0.5);
        //rotate
        contex.rotate(Number(track.rotation % 4n) * Math.PI / 2);
        //translate slightly offcenter
        contex.translate(-0.5, -0.5);
        //draw the correct image in this orientaion
        contex.drawImage(images.trackAtlas, trackAtlasPositions[track.type].x, trackAtlasPositions[track.type].y, 51, 51, -25, -25, 51, 51);
        contex.resetTransform();
        // draw tag strips
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
        //reset for next track
        contex.resetTransform();
    }
}

function drawCar() {
    //find grid location
    let x = 51n * carX + 399n - cameraX;
    let y = 51n * carY + 399n - cameraY;
    //if offscreen, don't draw it
    if (x < -25n || x > 825n || y < -25n || y > 825n) return;
    let p = Number(carProgress) / 100;
    contex.translate(Number(x) + 0.5, Number(y) + 0.5);
    contex.rotate(Number(carDir) * Math.PI / 2);
    contex.translate(-0.5, -0.5);
    //epic animation skills here
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
        //draw light on sides
        contex.drawImage(images.navigation, -10, -7);
    }
    if (flags & headlightFlag) {
        //draw beams
        contex.drawImage(images.light, 10, -7);
    }
    if (flags & policeLightFlag) {
        let policeBarFlipped = document.timeline.currentTime % 2000 >= 1000;
        let transform = contex.getTransform();
        contex.translate(0.5, 0.5);
        if (policeBarFlipped) {
            contex.rotate(Math.PI);
        }
        contex.translate(-0.5, -0.5);
        contex.drawImage(images.policeLight, -1, -5);
        contex.setTransform(transform);
    }
    contex.resetTransform();
}

function drawSigns() {
    for (const track of tracks) {
        // get its relative position
        let x = 51n * track.x + 399n - cameraX;
        let y = 51n * track.y + 399n - cameraY;
        //if offscreen, ignore it
        if (x < -25n || x > 825n || y < -25n || y > 825n) continue;
        // draw signs
        contex.translate(Number(x), Number(y));
        contex.fillStyle = "blue";
        for (let i = 0n; i <= 3n; i++) {
            let sign = track.signs[i];
            if (sign != "none") {
                contex.drawImage(images[sign], -29, 15);
            }
            contex.translate(0.5, 0.5);
            contex.rotate(Math.PI / 2);
            contex.translate(-0.5, -0.5);
        }
        //reset for next track
        contex.resetTransform();
    }
}

function resetCar() {
    // set position and direction to (0,0, east)
    carX = 0n;
    carY = 0n;
    carDir = 0n
    //start halfway
    carProgress = 50n;
    //prefer not turning
    turning = "straight";
    //stop navigation
    turnQueue = [];
    //ensure UI is updated with turning
    updateUI("carControls");
    //reset timers and flags
    stopTimer = 0n;
    speedTimer = 0n;
    flags = 0n;
    //reset index
    carIndex = trackIndexOf(carX, carY);
    if (carIndex == -1) {
        //if no piece at origin, place a straight track going east-west
        tracks.unshift({ x: 0n, y: 0n, type: "straight", rotation: 0n, tags: ["none", "none", "none", "none"], signs: ["none", "none", "none", "none"] });
        carIndex = 0n;
    }
    //update carTurning
    updateTurning();
}

function updateCar() {
    if (!driveEnable.checked) {
        return;
    }
    //for later check
    let prevProgress = carProgress;
    if (stopTimer > 0n) {
        //don't move if stopped
        stopTimer--;
    } else {
        //double velocity if speeding
        let inc = 1n;
        if (speedTimer > 0n) {
            speedTimer--;
            inc = 2n;
        }
        carProgress += inc;
        if (carTurning == 1n) {
            //double speed for right turn
            carProgress += inc;
        }
    }
    if (prevProgress < 50n && carProgress >= 50n) {
        //run over tag
        processTag();
    }
    if (carProgress >= 100n) {
        //move to next track piece
        carProgress = 0n;
        let nextDir = (carDir + carTurning) % 4n;
        [carX, carY] = headInDir(carX, carY, nextDir);
        carIndex = trackIndexOf(carX, carY);
        if (carIndex == -1) {
            // if fell of track
            resetCar();
        } else {
            carDir = nextDir;
        }
        //update carTurning
        updateTurning();
    }
}

function headInDir(x, y, dir) {
    //used with destructuring assignments
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
            flags |= headlightFlag;
            break;
        case "headlightsOff":
            flags &= ~headlightFlag;
            break;
        case "policeLightOn":
            flags |= policeLightFlag;
            break;
        case "policeLightOff":
            flags &= ~policeLightFlag;
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
                if (navTagEnable.checked && turnQueue.length == 0) {
                    navigateTo(tagData.x, tagData.y, tagData.dir);
                }
                break;
            default:
                break;
        }
    }
}

function updateTurning() {
    //I know this is scuffed, but it works ok.
    if (turnQueue.length > 1) {
        switch (turnQueue.shift()) {
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
    //remember those objects from the top of the script? this is where those come in
    let straight = modulus(carDir - tracks[carIndex].rotation, 4n);
    let right = (straight + 1n) % 4n;
    let left = (straight + 3n) % 4n;
    let trackType = tracks[carIndex].type;
    let c = structuredClone(trackConnections[trackType]);
    if (typeof c[0] != "bigint") {
        //this is a directional track piece
        c = c[straight];
    }
    let canGoStraight = c.includes(straight);
    let canTurnRight = c.includes(right);
    let canTurnLeft = c.includes(left);
    //prioritize certain directions
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

function modifyTracks() {
    //use UI to set track piece
    if (selectIndex != -1n) {
        if (trackTypeSelect.value == "empty") {
            tracks.splice(Number(selectIndex), 1);
            selectIndex = -1n;
            if (carIndex == selectIndex) {
                resetCar();
            }
        } else {
            tracks[selectIndex].type = trackTypeSelect.value;
            tracks[selectIndex].rotation = BigInt(trackRotationSelect.value);
            for (let i = 0n; i < 4n; i++) {
                let dir = directions[i];
                let tag = document.getElementById(dir + "Tag").value
                switch (tag) {
                    case "driveTo":
                        tracks[selectIndex].tags[i] = {
                            type: "driveTo",
                            x: BigInt(document.getElementById(dir + "DriveToX").value),
                            y: -BigInt(document.getElementById(dir + "DriveToY").value),
                            dir: BigInt(document.getElementById(dir + "DriveToDir").value)
                        };
                        break;
                    default:
                        tracks[selectIndex].tags[i] = tag;
                        break;
                }
                let sign = document.getElementById(dir + "Sign").value
                tracks[selectIndex].signs[i] = sign;
            }
        }
    } else if (trackTypeSelect.value != "empty") {
        tracks.unshift({ x: selectX, y: selectY, type: trackTypeSelect.value, rotation: BigInt(trackRotationSelect.value), tags: ["none", "none", "none", "none"], signs: ["none", "none", "none", "none"] });
        selectIndex = 0n;
    } else {
        trackRotationSelect.value = "0";
    }
    updateUI("tagMenu");
}

function updateUI(...sections) {
    for (const s of sections) {
        let updateOne = s != "all";
        switch (s) {
            case "all":
            case "carControls":
                //underline turning direction button
                leftButton.className = turning == "left" ? "highlight" : "";
                straightButton.className = turning == "straight" ? "highlight" : "";
                rightButton.className = turning == "right" ? "highlight" : "";
                if (updateOne) break;
            case "trackDialog":
                //correctly position track dialog
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
                //hide unneeded options in rotation select
                if (selectIndex != -1n) {
                    let rotationMod = trackOrientationMod[tracks[selectIndex].type];
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
                //hide context menus of special tags
                tagDiv.hidden = selectIndex == -1n;
                signDiv.hidden = selectIndex == -1n;
                let trackTag = "";
                for (let i = 0n; i < 4n; i++) {
                    let tagDir = directions[i];
                    if (selectIndex != -1n) {
                        trackTag = tracks[selectIndex].tags[i];
                        if (typeof trackTag == "object") {
                            trackTag = trackTag.type;
                        }
                        if (trackTag == "driveTo") {
                            document.getElementById(tagDir + "DriveToX").value = tracks[selectIndex].tags[i].x;
                            document.getElementById(tagDir + "DriveToY").value = -tracks[selectIndex].tags[i].y;
                            document.getElementById(tagDir + "DriveToDir").value = tracks[selectIndex].tags[i].dir;
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