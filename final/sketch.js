// 3D Snake Program
// Dave Briccetti

const CELLS_PER_DIMENSION = 11;
const CELLS_RIGHT_OF_CENTER = (CELLS_PER_DIMENSION - 1) / 2;
const STARTING_NUM_SEGMENTS = 3;
const MS_PER_MOVE = 1000;
const AUTO_MS_PER_MOVE = 100;
const SPEEDUP_FACTOR = 3;
let food;
let foodImage;
let direction;
let segments;
let keyMappings;
let arenaWidth;
let cellWidth;
let zeroVector;
let nextMoveTime;
let autoDriving = false;
let rightmostCellCenter;

function preload() {
  foodImage = loadImage('apple.png');
}

function setup() {
  const len = min(windowWidth - 10, windowHeight - 50);
  createCanvas(len, len, WEBGL);
  zeroVector = createVector(0, 0, 0);
  arenaWidth = round(width * 0.6);
  cellWidth = round(arenaWidth / CELLS_PER_DIMENSION);
  rightmostCellCenter = cellWidth * CELLS_RIGHT_OF_CENTER;
  mapKeys();
  setUpState();
}

function draw() {
  if (millis() > nextMoveTime) {
    if (autoDriving)
      autoSetDirection();
    moveSnake();
    const ms = autoDriving ? AUTO_MS_PER_MOVE : MS_PER_MOVE;
    nextMoveTime += keyIsDown(SHIFT) ? ms / SPEEDUP_FACTOR : ms;
  }

  moveCameraTo(map(sin(frameCount / 50), -1, 1, 0, -arenaWidth * 0.8), -arenaWidth * 0.8);
  background(255);
  smooth();
  drawArena();
  drawSnake();
  drawFood();
}

function mapKeys() {
  const v = createVector;
  const up      = v( 0, -1,  0);
  const down    = v( 0,  1,  0);
  const left    = v(-1,  0,  0);
  const right   = v( 1,  0,  0);
  const away    = v( 0,  0, -1);
  const towards = v( 0,  0,  1);
  keyMappings = {
    'w':          away,
    's':          towards,
    'ArrowLeft':  left,
    'ArrowRight': right,
    'ArrowUp':    up,
    'ArrowDown':  down,
  };
}

function setUpState() {
  direction = createVector(0, 0, 0);
  food = newFoodPosition();
  segments = Array.from({length: STARTING_NUM_SEGMENTS}, (v, i) =>
    createVector(-i * cellWidth, 0, 0));
}

function moveCameraTo(x, y) {
  camera(x, y, (height / 2.0) / tan(PI * 30.0 / 180.0), 0, 0, 0, 0, 1, 0);
}

function keyPressed() {
  if (key === 'a') {
    if (autoDriving = !autoDriving)
      nextMoveTime = millis();
  } else {
    const requestedDir = keyMappings[key];
    if (requestedDir) {
      const oppositeOfCurrentDir = p5.Vector.mult(direction, -1);
      if (!requestedDir.equals(oppositeOfCurrentDir)) {
        direction = requestedDir;
        if (!nextMoveTime)
          nextMoveTime = millis();
      }
    }
  }
}

function newFoodPosition() {
  const m = CELLS_RIGHT_OF_CENTER;
  const c = () => round(random(-m, m)) * cellWidth;
  return createVector(c(), c(), c());
}

function moveSnake() {
  if (autoDriving || !direction.equals(zeroVector)) {
    const newHeadPos = p5.Vector.add(segments[0], p5.Vector.mult(direction, cellWidth));
    if (collides(newHeadPos)) {
      setUpState();
    } else {
      if (newHeadPos.equals(food))
        food = newFoodPosition();
      else
        segments.pop(); // Discard last
      segments.unshift(newHeadPos); // Put new head on front
    }
  }
}

function collides(pos) {
  const inBounds = pos.array().every(coord => abs(coord) < arenaWidth / 2);
  const collidesWithSelf = segments.some((segment, i) => i > 0 && segment.equals(pos));
  return collidesWithSelf || !inBounds;
}

function autoSetDirection() {
  const head = segments[0];
  const toFoodAxisDistances = p5.Vector.sub(food, head).array();
  let newDir;

  const validDirs = validMoveDirections(head);

  for (let i = 0; i < 3; i++) {
    const d = toFoodAxisDistances[i];
    const a = [0, 0, 0];
    a[i] = d / abs(d); // -1, 0, or 1
    const candidateDir = createVector(...a);
    if (validDirs.some(d => d.equals(candidateDir))) {
      newDir = candidateDir;
      break;
    }
  }
  if (newDir)
    direction = newDir;
  else {
    if (validDirs.length) {
      direction = random(validDirs);
    }
  }
}

function validMoveDirections(head) {
  const validDirs = [];
  [-1, 1].forEach(n => {
    for (let axis = 0; axis < 3; axis++) {
      const dirArray = [0, 0, 0];
      dirArray[axis] = n;
      const candidateDir = createVector(...dirArray);
      const candidatePos = p5.Vector.add(head, p5.Vector.mult(candidateDir, cellWidth));
      if (!collides(candidatePos))
        validDirs.push(candidateDir);
    }
  });
  return validDirs;
}

function drawArena() {
  stroke('gray');
  const l = rightmostCellCenter + cellWidth / 2;
  const s = -l;
  const q = TAU / 4;

  [
    [[0, 0, s], 0, 0],
    [[l, 0, 0], 0, q],
    [[0, l, 0], q, 0],
  ].forEach(xf => {
    const [pos, xRot, yRot] = xf;
    at(...pos, () => {
      rotateX(xRot);
      rotateY(yRot);
      for (let v = s; v <= l; v += cellWidth) {
        line(s, v, 0, l, v, 0);
        line(v, s, 0, v, l, 0);
      }
    });
  });
}

function drawSnake() {
  const segmentWidth = cellWidth * 0.9;
  segments.forEach((segment, i) => {
    stroke('gray');
    fill(i === 0 ? 255 : 0, 255, 0, 70);
    at(...segment.array(), () => box(map(i, 0, segments.length, segmentWidth, segmentWidth * 0.5)));

    stroke(0, 255, 0);
    fill(0, 255, 0, 60);
    drawReferenceStructures(segments[0], segmentWidth);
  });
}

function drawFood() {
  noStroke();
  texture(foodImage);
  const itemWidth = cellWidth * 0.8;
  at(...food.array(), () => box(itemWidth));

  stroke(255, 0, 0);
  fill(255, 0, 0, 60);
  drawReferenceStructures(food, itemWidth);
}

function drawReferenceStructures(pos, objWidth) {
  const l = arenaWidth / 2; // Largest coordinate value
  const s = -l; // Smallest
  const {x, y, z} = pos;
  line(x, y, z,  l, y, z);
  line(x, y, z,  x, l, z);
  line(x, y, z,  x, y, s);

  noStroke();
  const w = objWidth;
  const f = 0.1; // Length on flat dimension
  at(l, y, z, () => box(f, w, w));
  at(x, l, z, () => box(w, f, w));
  at(x, y, s, () => box(w, w, f));
}

function at(x, y, z, fn) {
  push();
  translate(x, y, z);
  fn();
  pop();
}
