/* --- IMPORTS --- */
import Direction from "../game/direction.js";
import Game from "../game/game.js";
import Events from "./events.js";
import Displayer from "./displayer.js";
import Timer from "./timer.js";

/* --- EXPORTS --- */
export { GUI as default };

/*--- CONFIGURATION --- */
const GUIConfiguration = {
  info: true,
  audio: true,
};
// Object.freeze(GUIConfiguration);

/* --- ENUM: GUIStatus --- */
const GUIStatus = {
  NONE: "NONE",
  IDLE: "IDLE",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
  GAME_WIN: "GAME_WIN",
};
Object.freeze(GUIStatus);

/*--- CONSTANTS --- */
const CANVAS_SLOT_WIDTH = 15;
const CANVAS_SLOT_HEIGHT = 15;
const TIME_DELAY = 100; // milliseconds
const SCORE_NONE_COLOR = "rgb(0, 0, 0, 0)";
const SCORE_INACTIVE_COLOR = "gray";
const SCORE_RUNNING_COLOR = "lime";
const SCORE_FINISH_COLOR = "yellow";

/*
 * CLASS: GUI
 *****************************************************************************/
const GUI = class {
  #HTML = null;
  #displayer = null;
  #status = GUI.Status.NONE;
  #game = null;
  #timeJobId = null;
  #pendingArrowKey = null;

  static CONFIGURATION = GUIConfiguration;

  /* --- INNER: Status --- */
  static Status = GUIStatus;

  /// INIT

  /* --- C'TOR: constructor --- */
  constructor(load = true) {
    this.#init();
    if (load) this.load();
  }

  /* --- METHOD: #init --- */
  #init() {
    this.#setHTML();
    this.#configure();
    this.#setDisplay();
    this.#bindEvents();
  }

  /* --- METHOD: #configure --- */
  #configure() {
    Displayer.CONFIGURATION.slotWidth = CANVAS_SLOT_WIDTH;
    Displayer.CONFIGURATION.slotHeight = CANVAS_SLOT_HEIGHT;
    Game.CONFIGURATION.columns =
      this.#HTML.gameCanvas.width / CANVAS_SLOT_WIDTH;
    Game.CONFIGURATION.rows = this.#HTML.gameCanvas.height / CANVAS_SLOT_HEIGHT;
  }

  /// STATUS

  /* --- METHOD: #setStatus --- */
  #setStatus(status) {
    console.assert(status in GUI.Status); // sanity check
    GUI.#consoleInfo(`${this.#status} -> ${status}`);
    this.#status = status;
    this.#refresh();
  }

  /* --- METHOD: getStatus --- */
  getStatus() {
    return this.#status;
  }

  /// HTML

  /* --- METHOD: #setHTML --- */
  #setHTML() {
    this.#HTML = {};

    // panel buttons
    this.#HTML.playButton = document.querySelector("#play-btn");
    this.#HTML.pauseButton = document.querySelector("#pause-btn");
    this.#HTML.resetButton = document.querySelector("#reset-btn");
    this.#HTML.stopButton = document.querySelector("#stop-btn");

    // game score
    this.#HTML.gameScore = document.querySelector("#game-score");
    this.#HTML.scoreInactiveColor = this.#HTML.gameScore.style.color;

    // game canvas
    this.#HTML.gameCanvas = document.querySelector("#game-canvas");

    // audio
    this.#HTML.playAudio = document.querySelector("#play-audio");
    this.#HTML.pauseAudio = document.querySelector("#pause-audio");
    this.#HTML.resumeAudio = document.querySelector("#resume-audio");
    this.#HTML.gameoverAudio = document.querySelector("#gameover-audio");
    this.#HTML.gamewinAudio = document.querySelector("#gamewin-audio");
    this.#HTML.resetAudio = document.querySelector("#reset-audio");
    this.#HTML.stopAudio = document.querySelector("#stop-audio");
  }

  /// DISPLAY

  /* --- METHOD: #setDisplay --- */
  #setDisplay() {
    this.#displayer = new Displayer(this.#HTML.gameCanvas);
  }

  /* --- METHOD: #refresh --- */
  #refresh() {
    this.#refreshCanvasDisplay();
    this.#refreshScoreDisplay();
  }

  /* --- METHOD: #refreshCanvasDisplay --- */
  #refreshCanvasDisplay() {
    const status = this.getStatus();

    switch (status) {
      case GUI.Status.NONE:
        this.#displayNone();
        break;

      case GUI.Status.IDLE:
        this.#displayIdle();
        break;

      case GUI.Status.PLAYING:
        this.#displayPlaying();
        break;

      case GUI.Status.PAUSED:
        this.#displayPaused();
        break;

      case GUI.Status.GAME_OVER:
        this.#displayGameOver();
        break;

      case GUI.Status.GAME_WIN:
        this.#displayGameWin();
        break;

      default:
        console.assert(false); // sanity check
    }
  }

  /* --- METHOD: #displayNone --- */
  #displayNone() {
    this.#displayer.clear();
    this.#displayer.displayNone();
  }

  /* --- METHOD: #displayIdle --- */
  #displayIdle() {
    this.#displayer.clear();
    this.#displayer.displayIdle();
  }

  /* --- METHOD: #displayPlaying --- */
  #displayPlaying() {
    this.#displayer.clear();
    const gstate = this.#game.getState();
    this.#displayer.displayPlaying(gstate);
  }

  /* --- METHOD: #displayPaused --- */
  #displayPaused() {
    this.#displayer.displayPaused();
  }

  /* --- METHOD: #displayGameOver --- */
  #displayGameOver() {
    // this.#displayer.clear();
    this.#displayer.displayGameOver();
  }

  /* --- METHOD: #displayGameWin --- */
  #displayGameWin() {
    this.#displayPlaying();
    this.#displayer.displayGameWin();
  }

  /* --- METHOD: #refreshScoreDisplay --- */
  #refreshScoreDisplay() {
    const status = this.getStatus();
    let [score, scoreColor] = [0, null];
    switch (status) {
      case GUI.Status.NONE:
        scoreColor = SCORE_NONE_COLOR;
        break;

      case GUI.Status.IDLE:
        score = 0;
        scoreColor = SCORE_INACTIVE_COLOR;
        break;

      case GUI.Status.PLAYING:
      case GUI.Status.PAUSED:
        score = this.#game.getState().score;
        scoreColor = SCORE_RUNNING_COLOR;
        break;

      case GUI.Status.GAME_OVER:
      case GUI.Status.GAME_WIN:
        score = this.#game.getState().score;
        scoreColor = SCORE_FINISH_COLOR;
        break;

      default:
        console.assert(false); // sanity check
    }

    // update HTML & CSS
    this.#HTML.gameScore.innerText = `Score: ${score}`;
    this.#HTML.gameScore.style.color = scoreColor;
  }

  /// EVENTS

  /* --- METHOD: #bindEvents --- */
  #bindEvents() {
    // LOAD
    // NOTE: '() => this.load()' instead of 'this.load' to access this.
    Events.bindKey("l", () => this.load());

    // QUIT
    Events.bindKey("q", () => this.quit());

    // PLAY
    Events.bindKey("p", () => this.#play());
    Events.bindElement(this.#HTML.playButton, "click", () => this.#play());

    // PAUSE/RESUME
    Events.bindKey(" ", () => {
      const status = this.getStatus();
      if (status === GUI.Status.PLAYING) {
        this.#pause();
      } else if (status === GUI.Status.PAUSED) {
        this.#play();
      }
    });
    Events.bindElement(this.#HTML.pauseButton, "click", () => this.#pause());

    // RESET
    Events.bindKey("r", () => this.#reset());
    Events.bindElement(this.#HTML.resetButton, "click", () => this.#reset());

    // STOP
    Events.bindKey("s", () => this.#stop());
    Events.bindElement(this.#HTML.stopButton, "click", () => this.#stop());

    // ESCAPE
    Events.bindKey("Escape", () => {
      const status = this.getStatus();
      if (status === GUI.Status.IDLE) {
        this.quit();
      } else {
        this.#stop();
      }
    });

    // ... BIND HERE USER EVENTS ...
    const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    for (const key of arrowKeys) {
      Events.bindKey(key, () => {
        if (this.#pendingArrowKey === null) {
          this.#pendingArrowKey = key;
        }
      });
    }
  }

  /* --- METHOD: #tick --- */
  #tick() {
    const callback = () => {
      GUI.#consoleInfo(`TICK`);

      if (this.#pendingArrowKey !== null) {
        this.#processArrowKey(this.#pendingArrowKey);
        this.#checkGameStatus();
        this.#pendingArrowKey = null;
      }
      this.#game.step();
      this.#checkGameStatus();

      if (this.#game.getStatus() === Game.Status.PLAYING) {
        this.#timeJobId = Timer.setTimeout(callback, TIME_DELAY);
      }
    };
    this.#timeJobId = Timer.setTimeout(callback, TIME_DELAY);
  }

  /* --- METHOD: #tick --- */
  #tock() {
    if (this.#timeJobId === null) {
      GUI.#consoleInfo(`Got tock request without an active job`);
      return;
    }
    Timer.clearTimeout(this.#timeJobId);
    this.#timeJobId = null;
  }

  /* --- METHOD: #processArrowKey --- */
  #processArrowKey(key) {
    if (this.getStatus() !== GUI.Status.PLAYING) {
      return;
    }

    switch (key) {
      case "ArrowLeft":
        this.#game.setDirection(Direction.LEFT);
        break;
      case "ArrowRight":
        this.#game.setDirection(Direction.RIGHT);
        break;
      case "ArrowUp":
        this.#game.setDirection(Direction.UP);
        break;
      case "ArrowDown":
        this.#game.setDirection(Direction.DOWN);
        break;
      default:
        console.assert(false); // sanity check
    }
  }

  /// LOAD/QUIT

  /* --- METHOD: load --- */
  load() {
    if (this.getStatus() !== GUI.Status.NONE) {
      GUI.#consoleInfo(`Already loaded`);
      return;
    }

    this.#game = new Game();
    this.#setStatus(GUI.Status.IDLE);
  }

  /* --- METHOD: quit --- */
  quit() {
    const status = this.getStatus();
    if (status === GUI.Status.NONE) {
      GUI.#consoleInfo(`Not loaded`);
      return;
    }

    if (status !== GUI.Status.IDLE) {
      this.#tock();
      this.#game.stop();
    }
    this.#game = null;
    this.#setStatus(GUI.Status.NONE);
  }

  /// PLAYING - PLAY/PAUSE/RESET/STOP

  /* --- METHOD: play --- */
  #play() {
    const status = this.getStatus();
    switch (status) {
      case GUI.Status.IDLE:
      case GUI.Status.PAUSED:
        break;
      default:
        GUI.#consoleInfo(`Got play request while in status ${status}`);
        return;
    }

    if (status === GUI.Status.IDLE) {
      this.#game.play();
      GUI.#playAudio(this.#HTML.playAudio);
    } else {
      GUI.#playAudio(this.#HTML.resumeAudio);
    }
    this.#tick();
    this.#setStatus(GUI.Status.PLAYING);
  }

  /* --- METHOD: pause --- */
  #pause() {
    const status = this.getStatus();
    if (status !== GUI.Status.PLAYING) {
      GUI.#consoleInfo(`Got pause request while in status ${status}`);
      return;
    }

    this.#tock();
    this.#setStatus(GUI.Status.PAUSED);
    GUI.#playAudio(this.#HTML.pauseAudio);
  }

  /* --- METHOD: reset --- */
  #reset() {
    const status = this.getStatus();
    switch (status) {
      case GUI.Status.PLAYING:
      case GUI.Status.PAUSED:
      case GUI.Status.GAME_OVER:
      case GUI.Status.GAME_WIN:
        break;
      default:
        GUI.#consoleInfo(`Got reset request while in status ${status}`);
        return;
    }

    this.#tock();
    this.#game.reset();
    this.#tick();
    this.#setStatus(GUI.Status.PLAYING);
    GUI.#playAudio(this.#HTML.resetAudio);
  }

  /* --- METHOD: stop --- */
  #stop() {
    const status = this.getStatus();
    switch (status) {
      case GUI.Status.PLAYING:
      case GUI.Status.PAUSED:
      case GUI.Status.GAME_OVER:
      case GUI.Status.GAME_WIN:
        break;
      default:
        GUI.#consoleInfo(`Got stop request while in status ${status}`);
        return;
    }

    this.#tock();
    this.#game.stop();
    this.#setStatus(GUI.Status.IDLE);
    GUI.#playAudio(this.#HTML.stopAudio);
  }

  /// GAME STATUS

  /* --- METHOD: #checkGameStatus --- */
  #checkGameStatus() {
    const gameStatus = this.#game.getStatus();
    if (gameStatus === Game.Status.GAME_OVER) {
      this.#gameOver();
    } else if (gameStatus === Game.Status.GAME_WIN) {
      this.#gameWin();
    } else {
      console.assert(gameStatus === Game.Status.PLAYING); // sanity check
      this.#refresh();
    }
  }

  /* --- METHOD: #gameOver --- */
  #gameOver() {
    this.#setStatus(GUI.Status.GAME_OVER);
    GUI.#playAudio(this.#HTML.gameoverAudio);
  }

  /* --- METHOD: #gameWin --- */
  #gameWin() {
    this.#setStatus(GUI.Status.GAME_WIN);
    GUI.#playAudio(this.#HTML.gamewinAudio);
  }

  /// AUXILIARY

  /* --- METHOD: #consoleInfo --- */
  static #consoleInfo(message) {
    if (GUI.CONFIGURATION.info) {
      // const now = new Date(Date.now()).toLocaleTimeString();
      // const now = new Date(Date.now()).toUTCString();
      const now = new Date(Date.now()).toISOString();
      console.info(`INFO: [${now}] ${message}`);
    }
  }

  /* --- METHOD: #playAudio --- */
  static #playAudio(audio) {
    if (GUI.CONFIGURATION.audio) {
      audio.play();
    }
  }

  /// PLAYING - USER ACTIONS
  // ... PUT HERE METHODS TO HANDLE USER ACTIONS ...
};
