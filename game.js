loading = document.getElementById("loading");

let firstTimestamp, previousTimestamp;
let stop = false;

function step(timestamp) {
    let dt = 0;
    if (firstTimestamp === undefined) {
        firstTimestamp = timestamp;
        console.log("First timestamp", timestamp);
    } else {
        dt = timestamp - previousTimestamp;
    }
    tick(dt)
    previousTimestamp = timestamp;
    if (!stop) {
        window.requestAnimationFrame(step);
    }
}

function pause() {
    if (stop) {
        stop = false;
        previousTimestamp = window.performance.now();
        window.requestAnimationFrame(step);
    } else {
        stop = true;
    }
}

const ms = 1 / 1000;
let rate = 10 * ms;

// dt in milliseconds
function tick(dt) {
    loading.value += rate * dt;

    if (loading.value >= loading.max) {
        gameover()
    }
}

function gameover() {
    console.log("Game over");
    loading.value = 0;
    location.reload(true)
}

window.requestAnimationFrame(step);


