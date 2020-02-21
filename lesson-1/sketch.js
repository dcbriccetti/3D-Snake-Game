// 3D Snake Game
// Lesson One: Moving a snake with keys

let pos;
let dir;
let keyToDir;

function setup() {
  createCanvas(500, 500, WEBGL);
  pos = createVector(0, 0, 0);
  dir = createVector(0, 0, 0);
  keyToDir = {
    'ArrowRight': createVector( 1, 0, 0),
    'ArrowLeft':  createVector(-1, 0, 0),
  };
}

function draw() {
  pos.add(dir);
  background('gray');
  push();
  translate(...pos.array());
  box(50);
  pop();
}

function keyPressed() {
  const requestedDir = keyToDir[key];
  if (requestedDir)
    dir = requestedDir;
}
