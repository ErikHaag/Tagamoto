let turnQueue = [];

function navigateTo(goalX, goalY, goalDir = -1n) {
    turnQueue = [];
    if (trackIndexOf(goalX, goalY) == -1n) {
        return false;
    }
    //A* psuedocode from Wikipedia
    let startDir = (carDir + carTurning) % 4n;
    let [startX, startY] = headInDir(carX, carY, startDir);
    let startKey = arrayToKey([startX, startY, startDir]);
    let openSet = new Set();
    openSet.add(startKey);
    let comeFrom = new Map();
    let gScore = new Map();
    gScore.set(startKey, 0n);
    let fScore = new Map();
    fScore.set(startKey, taxicabDistance(startX, startY, startDir, goalX, goalY, goalDir));
    while (openSet.size > 0) {
        let current = "";
        let minF = -1n;
        for (const key of openSet.values()) {
            let f = fScore.get(key);
            if (f < minF || minF == -1n) {
                current = key;
                minF = f;
            }
        }
        let currentA = keyToArray(current);
        if (currentA[0] == goalX && currentA[1] == goalY && (goalDir == -1n || currentA[2] == goalDir)) {
            // reconstruct
            turnQueue = [turning];
            let dir = currentA[2];
            while (comeFrom.has(current)) {
                let previous = comeFrom.get(current);
                let pDir = previous[2];
                turnQueue.unshift(modulus(dir - pDir, 4n));
                dir = pDir;
                current = arrayToKey(previous);
            }
            return true;
        }
        openSet.delete(current);
        let [x, y, dir] = currentA;
        let index = trackIndexOf(x, y);
        if (index == -1n) {
            continue;
        }
        let trackType = tracks[index].type;
        let c = trackConnections[trackType];
        for (const turn of [1n, 0n, 3n]) {
            let nextDir = (dir + turn) % 4n;
            let dirRel = modulus(nextDir - tracks[index].rotation, 4n);
            if (!c.includes(dirRel)) {
                continue;
            }
            let [nextX, nextY] = headInDir(x, y, nextDir);
            let nextKey = arrayToKey([nextX, nextY, nextDir]);
            let g = gScore.get(current) + 1n;
            if (!gScore.has(nextKey) || g < gScore.get(nextKey)) {
                comeFrom.set(nextKey, currentA);
                gScore.set(nextKey, g);
                fScore.set(nextKey, g + taxicabDistance(nextX, nextY, nextDir, goalX, goalY, goalDir));
                openSet.add(nextKey)
            }
        }
    }
    return false;
}

function absoluteValue(int) {
    return int >= 0n ? int : -int;
}

function taxicabDistance(startX, startY, startDir, goalX, goalY, goalDir = -1n) {
    if (goalDir == -1n) {
        return absoluteValue(goalX - startX) + absoluteValue(goalY - startY);
    } else {
        let turnDiff = modulus(goalDir - startDir, 4n);
        return absoluteValue(goalX - startX) + absoluteValue(goalY - startY) + (turnDiff == 3n ? 1n : turnDiff);
    }
}

function keyToArray(key) {
    return key.split(",").map((element) => BigInt(element));
}

function arrayToKey(array) {
    return array.join(",");
}