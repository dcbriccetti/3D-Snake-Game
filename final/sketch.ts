// 3D Snake Game
// Lesson Ten: Adding User Interface Sliders

declare const p5;

new p5(p => {
  const STARTING_NUM_SEGMENTS = 3;
  const SPEEDUP_FACTOR = 3;
  const SNAKE_RGBS = [
    [255, 0, 0],
    [255, 128, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 255, 255],
    [0, 0, 255],
    [255, 0, 255],
  ];
  let cellsPerDimension = 11;
  let msPerMove = 1000;
  let msPerAutoMove = 100;
  let food;
  let foodImage;
  let keyMappings;
  let arenaWidth;
  let cellWidth;
  let nextMoveTime;
  let autoDriving = false;
  let rightmostCellCenter;
  let at;
  const snakes: Snake[] = [];


  p.preload = () => {
    foodImage = p.loadImage('apple.png');
  };

  p.setup = () => {
    at = makeAt(p);
    const len = p.min(p.windowWidth - 10, p.windowHeight - 50);
    p.createCanvas(len, len, p.WEBGL);
    arenaWidth = p.round(p.width * 0.6);
    resizeFromSlider();
    mapKeys();
    for (let i = 0; i < 5; i++) {
      snakes.push(new Snake(p, i, arenaWidth, () => cellWidth, STARTING_NUM_SEGMENTS));
    }
    setUpState();
    createControls();
  };

  p.draw = () => {
    if (p.millis() > nextMoveTime) {
      if (autoDriving)
        snakes.forEach(s => s.autoSetDirection(snakes, food));
      snakes.forEach(s => s.move(autoDriving, snakes, food, () => s.die(), (foundFood) => food = newFoodPosition()));
      const ms = autoDriving ? msPerAutoMove : msPerMove;
      nextMoveTime += p.keyIsDown(p.SHIFT) ? ms / SPEEDUP_FACTOR : ms;
    }

    positionCamera();
    p.background(255);
    p.smooth();
    drawArena();
    snakes.forEach((s, i) => s.draw(SNAKE_RGBS[i % SNAKE_RGBS.length], drawReferenceStructures));
    drawFood();
  };

  p.keyPressed = () => {
    if (p.key === 'a') {
      if (autoDriving = !autoDriving)
        nextMoveTime = p.millis();
    } else {
      const requestedDir = keyMappings[p.key];
      if (requestedDir) {
        const oppositeOfCurrentDir = p5.Vector.mult(snakes[0].direction, -1);
        if (!requestedDir.equals(oppositeOfCurrentDir)) {
          snakes[0].direction = requestedDir;
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

  function createControls() {
    const sliderCellsPerDimension = p.select('#numCells');
    sliderCellsPerDimension.value(cellsPerDimension);
    sliderCellsPerDimension.changed(() => {
      cellsPerDimension = sliderCellsPerDimension.value();
      resizeFromSlider();
      setUpState();
    });

    const sliderManualSpeed = p.select('#manualSpeed');

    function setMsPerMoveFromSlider() {
      msPerMove = p.map(sliderManualSpeed.value(), 1, 50, 5000, 100);
    }

    sliderManualSpeed.changed(() => setMsPerMoveFromSlider());
    setMsPerMoveFromSlider();

    const sliderAutoSpeed = p.select('#autoSpeed');

    function setMsPerMoveFromAutoSlider() {
      msPerAutoMove = p.map(sliderAutoSpeed.value(), 1, 50, 1000, 0);
    }

    sliderAutoSpeed.changed(() => setMsPerMoveFromAutoSlider());
    setMsPerMoveFromAutoSlider();
  }

  function resizeFromSlider() {
    cellWidth = p.round(arenaWidth / cellsPerDimension);
    rightmostCellCenter = cellWidth * cellsRightOfCenter();
  }

  let cellsRightOfCenter = () => (cellsPerDimension - 1) / 2;

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
      snakes.forEach(s => s.setUp(STARTING_NUM_SEGMENTS));
      food = newFoodPosition();
    }

  function newFoodPosition() {
    const m = cellsRightOfCenter();
    const c = () => p.round(p.random(-m, m)) * cellWidth;
    return p.createVector(c(), c(), c());
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
      at(<Number[]>pos, () => {
        p.rotateX(xRot);
        p.rotateY(yRot);
        for (let v = s; v <= l; v += cellWidth) {
          p.line(s, v, 0, l, v, 0);
          p.line(v, s, 0, v, l, 0);
        }
      });
    });
  }

  function drawFood() {
    p.noStroke();
    p.texture(foodImage);
    const itemWidth = cellWidth * 0.8;
    at(food.array(), () => p.box(itemWidth));

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
    at([l, y, z], () => p.box(f, w, w));
    at([x, l, z], () => p.box(w, f, w));
    at([x, y, s], () => p.box(w, w, f));
  }
});
