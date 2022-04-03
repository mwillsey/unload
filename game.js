// @ts-check

let loading = /**@type HTMLProgressElement */ (document.getElementById("loading"));
let loadingLabel = document.getElementById("loading-label");
let panel = document.getElementById("panel");

let paused = false;

// let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// let oscillator = audioCtx.createOscillator();
// oscillator.type = 'square';
// oscillator.connect(audioCtx.destination);
// oscillator.start();
// function playNote(value) {
//     let exp = value / 100 * 3;
//     oscillator.frequency.value = 220 * 2 ** exp;
// }


/** @type Game */
let game;

const sec = 1000; // ms

/** @param {boolean} cond */
function assert(cond) {
    if (!cond) {
        paused = true;
        console.trace()
        debugger;
        throw "Assertion failed."
    }
}

function pause() {
    if (paused) {
        paused = false;
        // oscillator.start()
    } else {
        paused = true;
        // oscillator.stop()
    }
}

document.body.onkeydown = function (event) {
    let pick;
    if (event.key == "1") {
        pick = 0;
    } else if (event.key == "2") {
        pick = 1;
    } else if (event.key == "3") {
        pick = 2;
    } else if (event.key == "4") {
        pick = 3;
    } else if (event.key == "p") {
        pause()
    }
    let buttons = Object.values(game.buttons);
    if (pick !== undefined && pick < buttons.length) {
        buttons[pick].buy()
    }
}

class Game {
    constructor() {
        loading.value = 0;

        this.startTime = window.performance.now();
        this.prevTimestamp = this.startTime;
        this.elapsed = 0;

        this.value = 0;
        this.cash = 0;
        this.rate = 20 / sec;
        this.rate2 = 1.2 / sec / sec;

        panel.innerHTML = '';
        this.buttons = {
            unload: new Unload(),
            auto: new AutoUnloader(),
            upgrade: new Upgrade(),
        };

        for (let b in this.buttons) {
            if (this.buttons[b].label) {
                panel.append(this.buttons[b].label);
            }
            panel.append(this.buttons[b].button);
        }
    }

    /** @param {number} n */
    unload(n) {
        n = Math.min(n, this.value);
        this.value -= n;
        return n;
    }

    tick(timestamp) {
        let dt = timestamp - this.prevTimestamp;
        this.prevTimestamp = timestamp;
        this.elapsed = timestamp - this.startTime;

        if (paused) {
            return
        }

        this.value += this.rate * dt;
        this.cash += this.rate * dt;

        this.rate += this.rate2 * dt;

        // playNote(this.value);

        for (let b in this.buttons) {
            this.buttons[b].tick(dt);
        }

        loadingLabel.textContent = `${this.cash.toFixed()}%`;

        loading.value = this.value;
        if (this.value >= loading.max) {
            this.gameOver()
        }
    }

    gameOver() {
        // paused = true;
        let time = (window.performance.now() - this.startTime) / sec;
        alert(`Game over! You made it ${time.toFixed()} seconds; final speed ${(game.rate * sec).toFixed()}% per second.`);
        game = new Game();
    }

    /** @param {number} amt */
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

class Button {
    constructor(label = false) {
        let name = this.constructor.name;

        this.button = document.createElement("button");
        this.button.textContent = name;
        this.button.onclick = () => this.buy();
        this.button.style.opacity = "0";

        // if (label) {
        //     this.label = document.createElement("label");
        //     this.button.textContent = name;
        //     this.button.onclick = () => this.buy();
        //     this.button.style.opacity = "0";
        // }

        this.hidden = true;
        this.unhideTime = 0;
        this.qty = 0;
        this.cost = 0;
    }

    unhide() {
        return game.elapsed >= this.unhideTime
    }

    /** @param {number} dt */
    tick(dt) {
        if (this.hidden && this.unhide()) {
            this.hidden = false;
            this.button.style.opacity = "1";
        }
        this.button.disabled = game.cash < this.cost;
    }

    buy() {
        if (game.spend(this.cost)) {
            this.qty += 1;
            this.onbuy()
        }
    }

    onbuy() { }
}

class Unload extends Button {
    constructor() {
        super()
        this.unhideTime = 1 * sec;
    }

    buy() {
        super.buy();
        game.unload(Infinity);
    }
}

class AutoUnloader extends Button {
    constructor() {
        super()
        this.unhideTime = 6 * sec;
        this.cost = 100;

        this.version = 0;

        this.sinceChip = 0;
        this.chipTime = 1 * sec;
        this.chipAmount = 1;

        this.names = [
            "AutoUnloader",
            "AutoUnloader 3G",
            "AutoUnloader X",
            "AutoUnloader XS",
            "AutoUnloader Pro",
            "AutoUnloader Pro Max",
            "AutoUnloader Studio",
        ];
        this.name = this.names[0];
    }

    canUpgrade() {
        return this.version < this.names.length - 1;
    }

    upgrade() {
        this.version += 1;
        assert(this.version < this.names.length);
        this.name = this.names[this.version];
        this.cost *= 2;
        this.chipTime *= .66;
        console.log(`Chipping every ${this.chipTime} ms`)
    }

    tick(dt) {
        super.tick(dt);
        this.button.textContent = `${this.cost}% - Buy ${this.name} (${this.qty})`
        this.sinceChip += dt;
        while (this.sinceChip >= this.chipTime) {
            this.sinceChip -= this.chipTime;
            game.unload(this.qty * this.chipAmount);
        }
    }
}

class Upgrade extends Button {
    constructor() {
        super()
        this.cost = 1000;
        this.unhideTime = 20 * sec;
    }

    tick(dt) {
        super.tick(dt);
        if (game.buttons.auto.canUpgrade()) {
            this.button.textContent = `${this.cost}% - Upgrade Autoloaders`;
        } else {
            this.button.disabled = true;
            this.button.textContent = "Unloaders maxed out!"
        }
    }

    onbuy() {
        game.buttons.auto.upgrade();
        this.cost *= 2;
    }
}

// now actually start things

game = new Game();

/** @param {number} timestamp */
function step(timestamp) {
    game.tick(timestamp);
    window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);


