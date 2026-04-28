/* --- IMPORTS --- */
import Random from "../lib/random.js";
import LinkedList from "../lib/linkedlist.js";
import Position from "./position.js";
import Direction from "./direction.js";

/* --- EXPORTS --- */
export { Game as default };

/*--- CONFIGURATION --- */
const GameConfiguration = {
  columns: 20,
  rows: 20,
  cyclic: true,
};
// Object.freeze(GameConfiguration);

/* --- ENUM: GameStatus --- */
const GameStatus = {
  IDLE: "IDLE",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
  GAME_WIN: "GAME_WIN",
};
Object.freeze(GameStatus);

/* --- CONSTANTS --- */
const INITIAL_SNAKE_BODY_SIZE = 5;

/*
 * CLASS: Game
 *****************************************************************************/
const Game = class {
  /// STATE
  #status = Game.Status.IDLE;
  #state = null;
  #emptySlots = null;
  #winScore = null;

  static CONFIGURATION = GameConfiguration;

  /* --- INNER: Status --- */
  static Status = GameStatus;

  /* --- INNER: State --- */
  static State = class {
    constructor(snakeBody, snakeDirection, fruitPosition, score) {
      this.snakeBody = snakeBody;
      this.snakeDirection = snakeDirection;
      this.fruitPosition = fruitPosition;
      this.score = score;
    }
  };

  /* --- C'TOR: constructor --- */
  constructor() {}

  /* --- METHOD: #setStatus --- */
  #setStatus(status) {
    console.assert(status in Game.Status); // sanity check
    this.#status = status;
  }

  /* --- METHOD: getStatus --- */
  getStatus() {
    return this.#status;
  }

  /* --- METHOD: getState --- */
  getState() {
    return this.#cloneState();
  }

  /* --- METHOD: getGridDimensions --- */
  static getGridDimensions() {
    return [Game.CONFIGURATION.rows, Game.CONFIGURATION.columns];
  }

  /// TRANSITION

  /* --- METHOD: play --- */
  play() {
    if (this.getStatus() !== Game.Status.IDLE) {
      console.error(`ERROR: Already started playing`);
      return;
    }
    this.#setWinScore();
    this.#initEmptySlots();
    this.#state = this.#getInitialState();
    this.#setStatus(Game.Status.PLAYING);
  }

  /* --- METHOD: reset --- */
  reset() {
    if (this.getStatus() !== Game.Status.IDLE) {
      this.stop();
    }
    this.play();
  }

  /* --- METHOD: stop --- */
  stop() {
    if (this.getStatus() === Game.Status.IDLE) {
      console.error(`ERROR: Already stopped`);
      return;
    }
    this.#clear();
  }

  // ... PLACE HERE METHODS FOR TRANSITIONING BETWEEN CHANGES WHILE PLAYING ...
  // DON'T FORGET TO CHECK STATUS IN EACH METHOD!

  /* --- METHOD: step --- */
  step() {
    this.move();
  }

  /* --- METHOD: #increaseScore --- */
  #increaseScore(amount) {
    this.#state.score += amount;
    if (this.#state.score >= this.#winScore) {
      this.#setStatus(Game.Status.GAME_WIN);
      this.#state.fruitPosition = null;
    } else {
      this.#state.fruitPosition = this.#getNewFruitPosition();
    }
  }

  /* --- METHOD: move --- */
  move() {
    if (this.getStatus() !== Game.Status.PLAYING) {
      console.error(`ERROR: Not playing`);
      return;
    }

    // calculate next head position and update body
    const nexthead = this.#getNextHeadPosition();
    delete this.#emptySlots[nexthead.x][nexthead.y];
    this.#state.snakeBody.pushFront(nexthead);

    // check for fruit consumption
    if (this.#checkFruitConsumption()) {
      this.#increaseScore(1);
    } else {
      const prevTail = this.#state.snakeBody.popBack();
      this.#emptySlots[prevTail.x][prevTail.y] = prevTail;
    }

    // check for collision with border
    if (this.#checkBorderCollision()) {
      console.log(`LOG: Collision with border`);
      this.#setStatus(Game.Status.GAME_OVER);
      return;
    }

    // check for collision with self
    if (this.#checkSelfCollision()) {
      console.log(`LOG: Collision with self`);
      this.#setStatus(Game.Status.GAME_OVER);
      return;
    }
  }

  /* --- METHOD: #arePerpendicular --- */
  #arePerpendicular(dir1, dir2) {
    console.assert(dir1 in Direction && dir2 in Direction); // sanity check
    const dirSets = [
      [dir1, dir2],
      [dir2, dir1],
    ];
    for (const dirs of dirSets) {
      if (
        (dirs[0] === Direction.LEFT || dirs[0] === Direction.RIGHT) &&
        (dirs[1] === Direction.UP || dirs[1] === Direction.DOWN)
      ) {
        return true;
      }
    }
    return false;
  }

  /* --- METHOD: setDirection --- */
  setDirection(direction) {
    if (this.getStatus() !== Game.Status.PLAYING) {
      console.error(`ERROR: Not playing`);
      return;
    }
    if (!(direction in Direction)) {
      console.error(`ERROR: Invalid direction ${direction}`);
      return;
    }

    const currDirection = this.#state.snakeDirection;
    if (this.#arePerpendicular(direction, currDirection)) {
      this.#state.snakeDirection = direction;
    }
  }

  /// AUXILIARY

  /* --- METHOD: #clear --- */
  #clear() {
    this.#setStatus(Game.Status.IDLE);
    this.#state = null;
    this.#emptySlots = null;
  }

  /* --- METHOD: #cloneState --- */
  #cloneState() {
    const state = this.#state;
    return new Game.State(
      state.snakeBody.map((link) => link.clone()),
      state.snakeDirection,
      state.fruitPosition === null ? null : state.fruitPosition.clone(),
      state.score
    );
  }

  /* --- METHOD: #getInitialState --- */
  #getInitialState() {
    return new Game.State(
      this.#getInitialSnakeBody(),
      Direction.RIGHT,
      this.#getNewFruitPosition(),
      0
    );
  }

  // ... PUT HERE ADDITIONAL AUXILIARY METHODS ...

  /* --- #setWinScore --- */
  #setWinScore() {
    const [rows, columns] = Game.getGridDimensions();
    this.#winScore = rows * columns - INITIAL_SNAKE_BODY_SIZE;
  }

  /* --- METHOD: #initEmptySlots --- */
  #initEmptySlots() {
    console.assert(this.#emptySlots === null); // sanity check
    this.#emptySlots = {};
    for (let x = 0; x < Game.CONFIGURATION.columns; x++) {
      this.#emptySlots[x] = {};
      for (let y = 0; y < Game.CONFIGURATION.rows; y++) {
        this.#emptySlots[x][y] = new Position(x, y);
      }
    }
  }

  /* --- METHOD: #getInitialSnakeBody --- */
  #getInitialSnakeBody() {
    const [rows, columns] = Game.getGridDimensions();
    const snakeBody = new LinkedList();
    const tail = [
      Math.floor(columns / 2) - Math.floor(INITIAL_SNAKE_BODY_SIZE / 2),
      Math.floor(rows / 2),
    ];
    for (let i = 0; i < INITIAL_SNAKE_BODY_SIZE; i++) {
      const link = new Position(tail[0] + i, tail[1]);
      delete this.#emptySlots[link.x][link.y];
      snakeBody.pushFront(link);
    }
    return snakeBody;
  }

  /* --- METHOD: #getNewFruitPosition --- */
  #getNewFruitPosition() {
    const choices = [];
    for (const x in this.#emptySlots) {
      for (const y in this.#emptySlots[x]) {
        choices.push(this.#emptySlots[x][y]);
      }
    }
    return choices.length > 0 ? Random.getRandomChoice(choices) : null;
  }

  /* --- METHOD: #getNextHeadPosition --- */
  #getNextHeadPosition() {
    const [rows, columns] = Game.getGridDimensions();
    const head = this.#state.snakeBody.peekFront();
    let nextHead = null;
    switch (this.#state.snakeDirection) {
      case Direction.UP:
        nextHead = new Position(head.x, head.y - 1);
        if (Game.CONFIGURATION.cyclic) {
          nextHead.y = (nextHead.y + rows) % rows;
        }
        break;

      case Direction.RIGHT:
        nextHead = new Position(head.x + 1, head.y);
        if (Game.CONFIGURATION.cyclic) {
          nextHead.x = nextHead.x % columns;
        }
        break;

      case Direction.DOWN:
        nextHead = new Position(head.x, head.y + 1);
        if (Game.CONFIGURATION.cyclic) {
          nextHead.y = nextHead.y % rows;
        }
        break;

      case Direction.LEFT:
        nextHead = new Position(head.x - 1, head.y);
        if (Game.CONFIGURATION.cyclic) {
          nextHead.x = (nextHead.x + columns) % columns;
        }
        break;

      default:
        console.assert(false); // sanity check
    }
    return nextHead;
  }

  /* --- METHOD: #checkBorderCollision --- */
  #checkBorderCollision() {
    const [rows, columns] = Game.getGridDimensions();
    const head = this.#state.snakeBody.peekFront();
    return head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows;
  }

  /* --- METHOD: #checkSelfCollision --- */
  #checkSelfCollision() {
    const head = this.#state.snakeBody.peekFront();
    let headCount = 0;
    this.#state.snakeBody.forEach((link) => {
      if (link.isEqualTo(head)) headCount++;
    });
    return headCount > 1;
  }

  /* --- METHOD: #checkFruitConsumption --- */
  #checkFruitConsumption() {
    const head = this.#state.snakeBody.peekFront();
    return head.isEqualTo(this.#state.fruitPosition);
  }
};
