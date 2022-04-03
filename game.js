// @ts-check

let loading = /**@type HTMLProgressElement */ (document.getElementById("loading"));
let loadingLabel = document.getElementById("loading-label");
let cash = document.getElementById("cash");
let panel = document.getElementById("panel");

let firstTimestamp, previousTimestamp;
let paused = false;

let game;

const sec = 1000; // ms

/**
 * @param {boolean} cond
 */
function assert(cond) {
    if (!cond) {
        paused = true;
        console.trace()
        debugger;
        throw "Assertion failed."
    }
}

/**
 * @param {number} timestamp
 */
function step(timestamp) {
    let dt = 0;
    if (firstTimestamp === undefined) {
        firstTimestamp = timestamp;
        console.log("First timestamp", timestamp);
    } else {
        dt = timestamp - previousTimestamp;
    }
    game.tick(dt)
    previousTimestamp = timestamp;
    if (!paused) {
        window.requestAnimationFrame(step);
    }
}

function pause() {
    if (paused) {
        paused = false;
        previousTimestamp = window.performance.now();
        window.requestAnimationFrame(step);
    } else {
        paused = true;
    }
}

class Game {
    constructor() {
        loading.value = 0;

        this.startTime = window.performance.now();

        this.cash = 0;
        this.rate = 15 / sec;
        this.rate2 = 0.5 / sec / sec;

        panel.innerHTML = '';
        this.sections = [
            new Unload(),
            new Chipper(),
        ];

        this.sections.forEach(section => {
            if (section.div) {
                panel.append(section.div)
            }
        })
    }

    /**
     * @param {number} n
     */
    unload(n) {
        n = Math.min(n, loading.value);
        loading.value -= n;
        this.cash += n;
        return n;
    }

    // dt in milliseconds
    /**
     * @param {number} dt
     */
    tick(dt) {
        loading.value += this.rate * dt;
        this.rate += this.rate2 * dt;

        this.sections.forEach(section => {
            section.tick(dt);
        })

        if (this.cash) {
            cash.textContent = this.cash.toFixed();
        }
        loadingLabel.textContent = `Loading ${(this.rate * sec).toFixed()}% / second...`;

        if (loading.value >= loading.max) {
            this.gameOver()
        }
    }

    gameOver() {
        let time = (window.performance.now() - this.startTime) / sec;
        alert(`Game over! You made it: ${time}s, ${game.rate * sec}%/s`);
        location.reload()
        game = new Game();
    }

    /**
     * @param {number} amt
     */
    spend(amt) {
        assert(typeof amt == 'number')
        if (this.cash >= amt) {
            this.cash -= amt;
            return true;
        } else {
            return false;
        }
    }
}

class Section {
    constructor() {
        let name = this.constructor.name.toLowerCase();

        this.div = document.createElement("div");
        this.div.classList.add(name);

        this.qty = 0;
        this.cost = 0;
    }

    /**
     * @param {number} dt
     */
    tick(dt) { }

    buy(n = 1) {
        if (game.spend(this.cost * n)) {
            this.qty += n;
        }
    }
}

class Unload extends Section {
    constructor() {
        super()

        this.button = document.createElement("button");
        this.button.textContent = "Unload";
        this.button.onclick = () => this.unload();
        this.div.append(this.button);
    }

    unload() {
        console.log("unload");
        game.unload(Infinity);
    }
}

class Chipper extends Section {
    constructor() {
        super()

        this.cost = 100;
        this.qty = 0;

        this.sinceChip = 0;
        this.chipTime = 1 * sec;
        this.chipAmount = 1;

        this.button = document.createElement("button");
        this.button.onclick = () => this.buy(1);
        this.div.append(this.button);
    }

    /**
     * @param {number} dt
     */
    tick(dt) {
        this.button.textContent = `Buy Chipper (${this.qty} - ${this.cost}%)`;
        this.sinceChip += dt;
        if (this.sinceChip > this.chipTime) {
            this.sinceChip = 0;
            game.unload(this.qty);
        }
    }
}

game = new Game();
window.requestAnimationFrame(step);


