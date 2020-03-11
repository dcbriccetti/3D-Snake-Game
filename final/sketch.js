// 3D Snake Program
// Dave Briccetti

const STARTING_NUM_SEGMENTS = 3;
const SPEEDUP_FACTOR = 3;
let msPerMove = 1000;
let cellsPerDimension = 11;
let food;
let direction;
let segments;
let keyMappings;
let arenaWidth;
let cellWidth;
let zeroVector;
let nextMoveTime;
let autoDriving = false;
let rightmostCellCenter;
let sliderCellsPerDimension;

function setup() {
  const len = min(windowWidth, windowHeight - 50);
  createCanvas(len, len, WEBGL);
  zeroVector = createVector(0, 0, 0);
  arenaWidth = round(width * 0.5);
  resizeFromSlider();
  mapKeys();
  setUpState();
  createControls();
}

function draw() {
  if (millis() > nextMoveTime) {
    if (autoDriving)
      autoSetDirection();
    moveSnake();
    nextMoveTime += autoDriving ? 0 : keyIsDown(SHIFT) ? msPerMove / SPEEDUP_FACTOR : msPerMove;
  }

  moveCameraTo(map(sin(frameCount / 50), -1, 1, 0, -arenaWidth * 0.8), -arenaWidth * 0.8);
  background(255);
  smooth();
  drawArena();
  drawSnake();
  drawFood();
}

function createControls() {
  sliderCellsPerDimension = select('#numCells');
  sliderCellsPerDimension.value(cellsPerDimension);

  sliderCellsPerDimension.changed(() => {
    cellsPerDimension = sliderCellsPerDimension.value();
    resizeFromSlider();
    setUpState();
  });
  
  sliderMsPerMove = select('#msPerMove');
  sliderMsPerMove.value(msPerMove);

  sliderMsPerMove.changed(() => {
    msPerMove = sliderMsPerMove.value();
  });
}

function resizeFromSlider() {
  cellWidth = round(arenaWidth / cellsPerDimension);
  rightmostCellCenter = cellWidth * cellsRightOfCenter();
}

let cellsRightOfCenter = () => (cellsPerDimension - 1) / 2;

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
  const m = cellsRightOfCenter();
  const c = () => round(random(-m, m)) * cellWidth;
  return createVector(c(), c(), c());
}

function moveSnake() {
  if (autoDriving || !direction.equals(zeroVector)) {
    const newHeadPos = p5.Vector.add(segments[0], p5.Vector.mult(direction, cellWidth));
    if (newPositionWouldLeaveArena(newHeadPos)) {
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

function newPositionWouldLeaveArena(pos) {
  return !pos.array().every(coord => abs(coord) < arenaWidth / 2);
}

function autoSetDirection() {
  const to = p5.Vector.sub(segments[0], food).array();
  const toAbs = to.map(n => abs(n));
  const greatestDistanceAxis = toAbs.indexOf(max(toAbs));
  const a = [0, 0, 0];
  a[greatestDistanceAxis] = to[greatestDistanceAxis] > 0 ? -1 : 1;
  direction = createVector(...a);
}

function drawArena() {
  stroke('gray');
  const cMax = rightmostCellCenter + cellWidth / 2;
  const cMin = -cMax;

  [
    '⊤↑I', // Right  horizontal
    '⊤I↑', //        vertical
    'I↑⊥', // Back   horizontal
    '↑I⊥', //        vertical
    'I⊤↑', // Bottom “horizontal”
    '↑⊤I'  //        “vertical”
  ].forEach(codeSet => {
    for (let v = cMin; v <= cMax; v += cellWidth) {
      const coords = [0, 0, 0, 0, 0, 0];

      codeSet.split('').forEach((code, i) => {
        switch (code) {
          case '⊤':
            coords[i    ] =
            coords[i + 3] = cMax;
            break;
          case '⊥':
            coords[i    ] =
            coords[i + 3] = cMin;
            break;
          case '↑':
            coords[i    ] =
            coords[i + 3] = v;
            break;
          case 'I':
            coords[i    ] = cMin;
            coords[i + 3] = cMax;
            break;
        }
      });
      line(...coords);
    }
  });
}

function drawSnake() {
  segments.forEach(segment => {
    stroke('gray');
    fill(0, 255, 0, 70);
    const segmentWidth = cellWidth * 0.9;
    at(...segment.array(), () => box(segmentWidth));

    stroke(0, 255, 0);
    fill(0, 255, 0, 60);
    drawReferenceStructures(segments[0], segmentWidth);
  });
}

function drawFood() {
  stroke('black');
  fill('red');
  at(...food.array(), () => box(cellWidth / 3));

  stroke(255, 0, 0);
  fill(255, 0, 0, 60);
  drawReferenceStructures(food, cellWidth / 2);
}

function drawReferenceStructures(pos, objWidth) {
  const half = arenaWidth / 2;
  //   x₁     y₁     z₁     x₂     y₂     z₂
  line(pos.x, pos.y, pos.z, half,  pos.y, pos.z);
  line(pos.x, pos.y, pos.z, pos.x, half,  pos.z);
  line(pos.x, pos.y, -half, pos.x, pos.y, pos.z);

  noStroke();
  const w = objWidth;
  const f = 0.1; // Length on flat dimension
  // x₁     y₁     z₁
  at(half,  pos.y, pos.z, () => box(f, w, w));
  at(pos.x, half,  pos.z, () => box(w, f, w));
  at(pos.x, pos.y, -half, () => box(w, w, f));
}

function at(x, y, z, fn) {
  push();
  translate(x, y, z);
  fn();
  pop();
}
