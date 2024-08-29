function pointerDown(e) {
    mouseDownX = e.offsetX;
    mouseDownY = e.offsetY;
    mouseDownTime = document.timeline.currentTime;
}

function pointerUp(e) {
    let s = 800 / canvas.getBoundingClientRect().width;
    let offX = BigInt(Math.round(s * (mouseDownX - e.offsetX)));
    let offY = BigInt(Math.round(s * (mouseDownY - e.offsetY)));
    if (offX ** 2n + offY ** 2n <= 100n && document.timeline.currentTime - mouseDownTime <= 500) {
        //this was a tap
        selecting = true;
        let x = BigInt(Math.round(s * e.offsetX)) + cameraX - 374n;
        let y = BigInt(Math.round(s * e.offsetY)) + cameraY - 374n;
        x -= modulus(x, 51n);
        y -= modulus(y, 51n);
        x /= 51n;
        y /= 51n;
        selectX = x;
        selectY = y;
        selectIndex = trackIndexOf(selectX, selectY);
        if (selectIndex == -1n) {
            trackTypeSelect.value = "empty";
            trackRotationSelect.value = "0";
            for (const dir of directions) {
                document.getElementById(dir + "Tag").value = "none";
                document.getElementById(dir + "Sign").value = "none";
            }
        } else {
            trackTypeSelect.value = tracks[selectIndex].type;
            trackRotationSelect.value = tracks[selectIndex].rotation;
            for (let i = 0n; i < 4n; i++) {
                let tagType = tracks[selectIndex].tags[i];
                let signType = tracks[selectIndex].signs[i];
                let dir = directions[i];
                if (typeof tagType == "object") {
                    tagType = tracks[selectIndex].tags[i].type;
                }
                document.getElementById(dir + "Tag").value = tagType;
                document.getElementById(dir + "Sign").value = signType;
            }
            updateUI("rotationSelect");
        }
    } else {
        cameraX += offX;
        cameraY += offY;
    }
    e.stopPropagation();
    updateUI("trackDialog", "tagMenu");
}

function setupEvents() {
    //check for a touchscreen
    let hasTouchScreen = navigator?.maxTouchPoints > 0 || navigator?.msMaxTouchPoints > 0;
    if (hasTouchScreen && window.confirm("Touch screen detected,\nwould you like to use this?")) {
        //use pointer events instead of mouse
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
        //default to mouse events
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
    //add events to tag changing elements
    for (const dir of directions) {
        document.getElementById(dir + "Tag").addEventListener("change", () => {
            modifyTracks();
        });
        document.getElementById(dir + "DriveToX").addEventListener("change", (e) => {
            e.target.value = e.target.value.replace(".", "-");
            modifyTracks();
        });
        document.getElementById(dir + "DriveToY").addEventListener("change", () => {
            modifyTracks();
        });
        document.getElementById(dir + "DriveToDir").addEventListener("change", () => {
            modifyTracks();
        });
        document.getElementById(dir + "Sign").addEventListener("change", () => {
            modifyTracks();
        })
    }
    resetCameraButton.addEventListener("click", () => {
        cameraX = 0n;
        cameraY = 0n;
        selecting = false;
        updateUI("trackDialog");
    });
    resetCarButton.addEventListener("click", () => {
        resetCar();
    });
    rightButton.addEventListener("click", () => {
        turning = "right";
        updateUI("carControls");
    });
    straightButton.addEventListener("click", () => {
        turning = "straight";
        updateUI("carControls");
    });
    leftButton.addEventListener("click", () => {
        turning = "left";
        updateUI("carControls");
    });
    trackTypeSelect.addEventListener("change", () => {
        modifyTracks();
        updateUI("rotationSelect");
    });
    trackRotationSelect.addEventListener("change", () => {
        modifyTracks();
    });
    moveUp.addEventListener("click", () => {
        for (let i in tracks) {
            tracks[i].y--;
            for(let j = 0n; j < 4n; j++) {
                switch(tracks[i].tags[j]?.type) {
                    case "driveTo":
                        tracks[i].tags[j].y--;
                        break;
                    default:
                        break;
                }
            }
        }
    });
    moveLeft.addEventListener("click", () => {
        for (let i in tracks) {
            tracks[i].x--;
            for(let j = 0n; j < 4n; j++) {
                switch(tracks[i].tags[j]?.type) {
                    case "driveTo":
                        tracks[i].tags[j].x--;
                        break;
                    default:
                        break;
                }
            }
        }
    });
    turnClockwise.addEventListener("click", () => {
        for (let i in tracks) {
            let x = tracks[i].x;
            tracks[i].x = -tracks[i].y;
            tracks[i].y = x;
            tracks[i].rotation = (tracks[i].rotation + 1n) % trackOrientationMod[tracks[i].type];
            tracks[i].tags.unshift(tracks[i].tags.pop());
            for(let j = 0n; j < 4n; j++) {
                switch(tracks[i].tags[j]?.type) {
                    case "driveTo":
                        x = tracks[i].tags[j].x;
                        tracks[i].tags[j].x = -tracks[i].tags[j].y;
                        tracks[i].tags[j].y = x;
                        tracks[i].tags[j].dir = tracks[i].tags[j].dir == -1n ? -1n : (tracks[i].tags[j].dir + 1n) % 4n;
                        break;
                    default:
                        break;
                }
            }
        }
    });
    moveRight.addEventListener("click", () => {
        for (let i in tracks) {
            tracks[i].x++;
            for(let j = 0n; j < 4n; j++) {
                switch(tracks[i].tags[j]?.type) {
                    case "driveTo":
                        tracks[i].tags[j].x++;
                        break;
                    default:
                        break;
                }
            }
        }
    });
    moveDown.addEventListener("click", () => {
        for (let i in tracks) {
            tracks[i].y++;
            for(let j = 0n; j < 4n; j++) {
                switch(tracks[i].tags[j]?.type) {
                    case "driveTo":
                        tracks[i].tags[j].y++;
                        break;
                    default:
                        break;
                }
            }
        }
    });
}