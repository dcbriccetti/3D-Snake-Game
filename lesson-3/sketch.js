// 3D Snake Game
// Lesson Three: Moving Within the Arena

const CELLS_PER_DIMENSION = 11;
const CELLS_RIGHT_OF_CENTER = (CELLS_PER_DIMENSION - 1) / 2;
const MS_PER_MOVE = 1000;
const SPEEDUP_FACTOR = 3;
let keyMappings;
let arenaWidth;
let cellWidth;
let pos;
let direction;
let rightmostCellCenter;
let nextMoveTime;

function setup() {
  const len = min(windowWidth - 10, windowHeight - 50);
  createCanvas(len, len, WEBGL);
  direction = createVector(0, 0, 0);
  arenaWidth = round(width * 0.6);
  cellWidth = round(arenaWidth / CELLS_PER_DIMENSION);
  rightmostCellCenter = cellWidth * CELLS_RIGHT_OF_CENTER;
  pos = createVector(0, rightmostCellCenter, rightmostCellCenter);
  mapKeys();
}

function draw() {
  if (millis() > nextMoveTime) {
    const newHeadPos = p5.Vector.add(pos, p5.Vector.mult(direction, cellWidth));
    if (newPositionWouldLeaveArena(newHeadPos))
      noLoop();
    else
      pos = newHeadPos;
    nextMoveTime += keyIsDown(SHIFT) ? MS_PER_MOVE / SPEEDUP_FACTOR : MS_PER_MOVE;
  }
  background(255);
  smooth();
  drawArena();
  push();
  translate(...pos.array());
  fill(0, 255, 0, 50);
  box(cellWidth * 0.9);
  pop();
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

function newPositionWouldLeaveArena(pos) {
  return !pos.array().every(coord => abs(coord) < arenaWidth / 2);
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

function keyPressed() {
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
