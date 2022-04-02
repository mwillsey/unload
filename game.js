let loading = document.getElementById("loading");
let cash = document.getElementById("cash");

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

const sec = 1000; // ms

const game0 = {
    cash: 0,
    rate: 5 / sec,
    rate2: 0.1 / sec,
    chippers: 0,
}

let game = { ...game0 }

function take(n) {
    n = Math.min(n, loading.value);
    loading.value -= n;
    game.cash += n;
    return n;
}

// dt in milliseconds
function tick(dt) {
    loading.value += game.rate * dt;
    game.rate += game.rate2;

    take(game.chippers);

    if (game.cash) {
        cash.textContent = game.cash.toFixed();
    }

    if (loading.value >= loading.max) {
        gameOver()
    }
}

function gameOver() {
    console.log("Game over");
    loading.value = 0;
    game = { ...game0 }
    location.reload(true)
}

function unload() {
    game.cash += loading.value;
    loading.value = 0;
}

function buyChipper() {
    let cost = 100;
    if (game.cash < cost) { return }
    game.cash -= cost;
    game.chippers += 1;
}

window.requestAnimationFrame(step);


