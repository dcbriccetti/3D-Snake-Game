// 3D Snake Game
// Lesson Two: Drawing the Arena

const CELLS_PER_DIMENSION = 11;
const CELLS_RIGHT_OF_CENTER = (CELLS_PER_DIMENSION - 1) / 2;
let cellWidth;
let pos;
let dir;
let keyToDir;
let rightmostCellCenter;

function setup() {
  const len = min(windowWidth, windowHeight - 50);
  createCanvas(len, len, WEBGL);
  pos = createVector(0, 0, 0);
  dir = createVector(0, 0, 0);
  keyToDir = {
    'ArrowRight': createVector( 1, 0, 0),
    'ArrowLeft':  createVector(-1, 0, 0),
  };
  arenaWidth = round(width * 0.5);
  cellWidth = round(arenaWidth / CELLS_PER_DIMENSION);
  rightmostCellCenter = cellWidth * CELLS_RIGHT_OF_CENTER;
}

function draw() {
  pos.add(dir);
  background(255);
  smooth();
  drawArena();
  push();
  translate(...pos.array());
  fill(0, 255, 0, 50);
  box(50);
  pop();
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
  const requestedDir = keyToDir[key];
  if (requestedDir)
    dir = requestedDir;
}
