// 3D Snake Game
// Lesson Nine: Changing to p5 instance mode

new p5(p => {
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

  p.preload = () => {
    foodImage = p.loadImage('apple.png');
  };

  p.setup = () => {
    const len = p.min(p.windowWidth - 10, p.windowHeight - 50);
    p.createCanvas(len, len, p.WEBGL);
    zeroVector = p.createVector(0, 0, 0);
    arenaWidth = p.round(p.width * 0.6);
    cellWidth = p.round(arenaWidth / CELLS_PER_DIMENSION);
    rightmostCellCenter = cellWidth * CELLS_RIGHT_OF_CENTER;
    mapKeys();
    setUpState();
  };

  p.draw = () => {
    if (p.millis() > nextMoveTime) {
      if (autoDriving)
        autoSetDirection();
      moveSnake();
      const ms = autoDriving ? AUTO_MS_PER_MOVE : MS_PER_MOVE;
      nextMoveTime += p.keyIsDown(p.SHIFT) ? ms / SPEEDUP_FACTOR : ms;
    }

    positionCamera();
    p.background(255);
    p.smooth();
    drawArena();
    drawSnake();
    drawFood();
  };

  p.keyPressed = () => {
    if (p.key === 'a') {
      if (autoDriving = !autoDriving)
        nextMoveTime = p.millis();
    } else {
      const requestedDir = keyMappings[p.key];
      if (requestedDir) {
        const oppositeOfCurrentDir = p5.Vector.mult(direction, -1);
        if (!requestedDir.equals(oppositeOfCurrentDir)) {
          direction = requestedDir;
          if (!nextMoveTime)
            nextMoveTime = p.millis();
        }
      }
    }
  };

  function positionCamera() {
    const camX = p.map(Math.sin(p.frameCount / 50), -1, 1, 0, -arenaWidth * 0.8);
    const camY = -arenaWidth * 0.8;
    const camZ = (p.height / 2.0) / Math.tan(Math.PI * 30.0 / 180.0);
    p.camera(camX, camY, camZ,  0, 0, 0,  0, 1, 0);
  }

  function mapKeys() {
    const v = p.createVector;
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
    direction = p.createVector(0, 0, 0);
    food = newFoodPosition();
    segments = Array.from({length: STARTING_NUM_SEGMENTS}, (v, i) =>
      p.createVector(-i * cellWidth, 0, 0));
  }

  function newFoodPosition() {
    const m = CELLS_RIGHT_OF_CENTER;
    const c = () => p.round(p.random(-m, m)) * cellWidth;
    return p.createVector(c(), c(), c());
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
    const inBounds = pos.array().every(coord => Math.abs(coord) < arenaWidth / 2);
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
      a[i] = d / Math.abs(d); // -1, 0, or 1
      const candidateDir = p.createVector(...a);
      if (validDirs.some(d => d.equals(candidateDir))) {
        newDir = candidateDir;
        break;
      }
    }
    if (newDir)
      direction = newDir;
    else {
      if (validDirs.length) {
        direction = p.random(validDirs);
      }
    }
  }

  function validMoveDirections(head) {
    const validDirs = [];
    [-1, 1].forEach(n => {
      for (let axis = 0; axis < 3; axis++) {
        const dirArray = [0, 0, 0];
        dirArray[axis] = n;
        const candidateDir = p.createVector(...dirArray);
        const candidatePos = p5.Vector.add(head, p5.Vector.mult(candidateDir, cellWidth));
        if (!collides(candidatePos))
          validDirs.push(candidateDir);
      }
    });
    return validDirs;
  }

  function drawArena() {
    p.stroke('gray');
    const l = rightmostCellCenter + cellWidth / 2;
    const s = -l;
    const q = p.TAU / 4;

    [
      [[0, 0, s], 0, 0],
      [[l, 0, 0], 0, q],
      [[0, l, 0], q, 0],
    ].forEach(xf => {
      const [pos, xRot, yRot] = xf;
      at(...pos, () => {
        p.rotateX(xRot);
        p.rotateY(yRot);
        for (let v = s; v <= l; v += cellWidth) {
          p.line(s, v, 0, l, v, 0);
          p.line(v, s, 0, v, l, 0);
        }
      });
    });
  }

  function drawSnake() {
    const segmentWidth = cellWidth * 0.9;
    segments.forEach((segment, i) => {
      p.stroke('gray');
      p.fill(i === 0 ? 255 : 0, 255, 0, 70);
      at(...segment.array(), () => p.box(p.map(i, 0, segments.length, segmentWidth, segmentWidth * 0.5)));

      p.stroke(0, 255, 0);
      p.fill(0, 255, 0, 60);
      drawReferenceStructures(segments[0], segmentWidth);
    });
  }

  function drawFood() {
    p.noStroke();
    p.texture(foodImage);
    const itemWidth = cellWidth * 0.8;
    at(...food.array(), () => p.box(itemWidth));

    p.stroke(255, 0, 0);
    p.fill(255, 0, 0, 60);
    drawReferenceStructures(food, itemWidth);
  }

  function drawReferenceStructures(pos, objWidth) {
    const l = arenaWidth / 2; // Largest coordinate value
    const s = -l; // Smallest
    const {x, y, z} = pos;
    p.line(x, y, z,  l, y, z);
    p.line(x, y, z,  x, l, z);
    p.line(x, y, z,  x, y, s);

    p.noStroke();
    const w = objWidth;
    const f = 0.1; // Length on flat dimension
    at(l, y, z, () => p.box(f, w, w));
    at(x, l, z, () => p.box(w, f, w));
    at(x, y, s, () => p.box(w, w, f));
  }

  function at(x, y, z, fn) {
    p.push();
    p.translate(x, y, z);
    fn();
    p.pop();
  }
});
