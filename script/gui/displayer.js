/* --- IMPORTS --- */
//import Random from "../lib/random.js";
import Direction from "../game/direction.js";
import Game from "../game/game.js";
import Canvas from "./canvas.js";

/* --- EXPORTS --- */
export { Displayer as default };

/*--- CONFIGURATION --- */
const DisplayerConfiguration = {
  slotWidth: 15,
  slotHeight: 15,
};
// Object.freeze(DisplayerConfiguration);

/* --- CONSTANTS --- */
const SNAKE_BODY_STROKE_STYLE = "black";
const SNAKE_BODY_FILL_STYLE = "#6CBB3C"; // color code for green snake
const SNAKE_EYE_OFFSET = 4;
const SNAKE_EYE_RADIUS = 2;
const SNAKE_EYE_STROKE_STYLE = "black";
const SNAKE_EYE_FILL_STYLE = "black";

const FRUIT_STROKE_STYLE = "black";
const FRUIT_FILL_STYLE = "#C7372F"; // color code for red apple

const PAUSE_TEXT = "Pause";
const PAUSE_FONT = "bold 32px Cursive";
const PAUSE_COLOR = "red";
const GAME_OVER_TEXT = "Game Over";
const GAME_OVER_FONT = "bold 32px Cursive";
const GAME_OVER_COLOR = "blue";
const GAME_WIN_TEXT = "You Won!";
const GAME_WIN_FONT = "bold 32px Cursive";
const GAME_WIN_COLOR = "blue";

/*
 * CLASS: Displayer
 *****************************************************************************/
const Displayer = class {
  #canvas = null;

  static CONFIGURATION = DisplayerConfiguration;

  /* --- C'TOR: constructor --- */
  constructor(canvas) {
    this.#canvas = new Canvas(canvas);
  }

  /* --- METHOD: clear --- */
  clear() {
    this.#canvas.clear();
  }

  /* --- METHOD: displayNone --- */
  displayNone() {
    this.clear();
  }

  /* --- METHOD: displayIdle --- */
  displayIdle() {
    const imageSource = document.querySelector("#cover-image");
    this.#canvas.fillCanvas("teal");
    this.#canvas.backgroundImage(imageSource);
  }

  /* --- METHOD: displayPlaying --- */
  displayPlaying(gstate) {
    if (!(gstate instanceof Game.State)) {
      throw TypeError(`input ${gstate} is not a Game.State object`);
    }
    // console.log(gstate);

    this.#displaySnake(gstate.snakeBody, gstate.snakeDirection);
    this.#displayFruit(gstate.fruitPosition);
    // this.#displayScore();
  }

  /* --- METHOD: #getSlotSize --- */
  #getSlotSize() {
    return [
      Displayer.CONFIGURATION.slotWidth,
      Displayer.CONFIGURATION.slotHeight,
    ];
  }

  /* --- METHOD: displaySnake --- */
  #displaySnake(snakeBody, snakeDirection) {
    this.#displaySnakeBody(snakeBody);
    this.#drawSnakeHead(snakeBody.peekFront(), snakeDirection);
  }

  /* --- METHOD: #displaySnakeBody --- */
  #displaySnakeBody(snakeBody) {
    const [slotWidth, slotHeight] = this.#getSlotSize();
    snakeBody.forEach((pos) => {
      const [x, y] = [pos.x * slotWidth, pos.y * slotHeight];
      this.#canvas.fillStrokeRect(
        x,
        y,
        slotWidth,
        slotHeight,
        SNAKE_BODY_FILL_STYLE,
        // Random.getRandomColor(),
        SNAKE_BODY_STROKE_STYLE
      );
    });
  }

  /* --- METHOD: #drawSnakeHead --- */
  #drawSnakeHead(headPos, snakeDirection) {
    const [slotWidth, slotHeight] = this.#getSlotSize();
    const [offset, radius] = [SNAKE_EYE_OFFSET, SNAKE_EYE_RADIUS];

    // draw snake eyes
    const [x0, y0] = [headPos.x * slotWidth, headPos.y * slotHeight];
    let [x1, y1] = [null, null];
    let [x2, y2] = [null, null];
    switch (snakeDirection) {
      case Direction.UP:
        [x1, y1] = [x0 + offset, y0 + offset];
        [x2, y2] = [x0 + slotWidth - offset, y0 + offset];
        break;
      case Direction.DOWN:
        [x1, y1] = [x0 + offset, y0 + slotHeight - offset];
        [x2, y2] = [x0 + slotWidth - offset, y0 + slotHeight - offset];
        break;
      case Direction.LEFT:
        [x1, y1] = [x0 + offset, y0 + offset];
        [x2, y2] = [x0 + offset, y0 + slotHeight - offset];
        break;
      case Direction.RIGHT:
        [x1, y1] = [x0 + slotWidth - offset, y0 + offset];
        [x2, y2] = [x0 + slotWidth - offset, y0 + slotHeight - offset];
        break;
      default:
        console.assert(false); // sanity check
    }
    this.#canvas.fillStrokeCircle(
      x1,
      y1,
      radius,
      SNAKE_EYE_FILL_STYLE,
      SNAKE_EYE_STROKE_STYLE
    );
    this.#canvas.fillStrokeCircle(
      x2,
      y2,
      radius,
      SNAKE_EYE_FILL_STYLE,
      SNAKE_EYE_STROKE_STYLE
    );
  }

  /* --- METHOD: displayFruit --- */
  #displayFruit(fruitPosition) {
    if (fruitPosition === null) return;
    const [slotWidth, slotHeight] = this.#getSlotSize();
    const radius = Math.min(slotWidth, slotHeight) / 2;
    const [x, y] = [
      fruitPosition.x * slotWidth + radius,
      fruitPosition.y * slotHeight + radius,
    ];
    this.#canvas.fillStrokeCircle(
      x,
      y,
      radius - 1,
      FRUIT_FILL_STYLE,
      FRUIT_STROKE_STYLE
    );
  }

  /* --- METHOD: #announce --- */
  #announce(text, font, color) {
    const [width, height] = this.#canvas.getSize();
    const textWidth = this.#canvas.measureText(text, font).width;
    this.#canvas.fillText(
      text,
      (width - textWidth) / 2,
      height / 2,
      font,
      color
    );
  }

  /* --- METHOD: displayPaused --- */
  displayPaused() {
    this.#announce(PAUSE_TEXT, PAUSE_FONT, PAUSE_COLOR);
  }

  /* --- METHOD: displayGameOver --- */
  displayGameOver() {
    this.#announce(GAME_OVER_TEXT, GAME_OVER_FONT, GAME_OVER_COLOR);
  }

  /* --- METHOD: displayGameWin --- */
  displayGameWin() {
    this.#announce(GAME_WIN_TEXT, GAME_WIN_FONT, GAME_WIN_COLOR);
  }
};
