canvas.addEventListener("mousedown", (e) => {
    mouseDownX = e.offsetX;
    mouseDownY = e.offsetY;
    mouseDownTime = document.timeline.currentTime;
});

canvas.addEventListener("mouseup", (e) => {
    let offX = BigInt(mouseDownX - e.offsetX);
    let offY = BigInt(mouseDownY - e.offsetY);
    if (offX ** 2n + offY ** 2n <= 100n && document.timeline.currentTime - mouseDownTime <= 500) {
        selecting = true;
        let x = BigInt(e.offsetX) + cameraX - 374n;
        let y = BigInt(e.offsetY) + cameraY - 374n;
        x -= modulus(x, 51n);
        y -= modulus(y, 51n);
        x /= 51n;
        y /= 51n;
        selectX = x;
        selectY = y;
        let index = trackIndexOf(selectX, selectY);
        if (index == -1n) {
            trackTypeSelect.value = "empty";
            trackRotationSelect.value = "0";
            for (const dir of directions) {
                document.getElementById(dir + "Tag").value = "none";
            }
        } else {
            trackTypeSelect.value = tracks[index].type;
            trackRotationSelect.value = tracks[index].rotation;
            let tagType = "";
            for (let i = 0n; i < 4n; i++) {
                tagType = tracks[index].tags[i];
                let tagDir = directions[i];
                if (typeof tagType == "object") {
                    tagType = tracks[index].tags[i].type;
                    if (tagType == "driveTo") {
                        document.getElementById(tagDir + "DriveToX").value = tracks[index].tags[i].x;
                        document.getElementById(tagDir + "DriveToY").value = -tracks[index].tags[i].y;
                        document.getElementById(tagDir + "DriveToDir").value = tracks[index].tags[i].dir;
                    } else {
                        document.getElementById(tagDir + "DriveToX").value = "0";
                        document.getElementById(tagDir + "DriveToY").value = "0";
                        document.getElementById(tagDir + "DriveToDir").value = "-1";
                    }
                }
                document.getElementById(tagDir + "Tag").value = tagType;
            }
        }
    } else {
        cameraX += offX;
        cameraY += offY;
    }
    e.stopPropagation();
    updateUI("trackDialog", "specialTagMenus");
});

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

resetCameraButton.addEventListener("click", () => {
    cameraX = 0n;
    cameraY = 0n;
    selecting = false;
    updateUI("trackDialog");
});

resetCarButton.addEventListener("click", () => {
    resetCar();
})

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
});

trackRotationSelect.addEventListener("change", () => {
    modifyTracks();
});

for (const dir of directions) {
    document.getElementById(dir + "Tag").addEventListener("change", () => {
        modifyTracks();
    });
    document.getElementById(dir + "DriveToX").addEventListener("change", () => {
        modifyTracks();
    });
    document.getElementById(dir + "DriveToY").addEventListener("change", () => {
        modifyTracks();
    });
    document.getElementById(dir + "DriveToDir").addEventListener("change", () => {
        modifyTracks();
    });
}

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
        tracks[i].rotation = (tracks[i].rotation + 1n) % 4n;
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