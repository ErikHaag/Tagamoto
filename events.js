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
            northTagSelect.value = "none";
            eastTagSelect.value = "none";
            southTagSelect.value = "none";
            westTagSelect.value = "none";
        } else {
            trackTypeSelect.value = tracks[index].type;
            trackRotationSelect.value = tracks[index].rotation;
            eastTagSelect.value = tracks[index].tags[0n];
            southTagSelect.value = tracks[index].tags[1n];
            westTagSelect.value = tracks[index].tags[2n];
            northTagSelect.value = tracks[index].tags[3n];
        }
    } else {
        cameraX += offX;
        cameraY += offY;
    }
    e.stopPropagation();
    updateUI("trackDialog");
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

northTagSelect.addEventListener("change", () => {
    modifyTracks();
});

eastTagSelect.addEventListener("change", () => {
    modifyTracks();
});

southTagSelect.addEventListener("change", () => {
    modifyTracks();
});

westTagSelect.addEventListener("change", () => {
    modifyTracks();
});