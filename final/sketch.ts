// 3D Snake Game

declare const p5;

new p5(p => {
  const STARTING_NUM_SEGMENTS = 3;
  const SPEEDUP_FACTOR = 3;
  const SNAKE_RGBS = [
    [0, 255, 0],
    [0, 255, 255],
    [0, 0, 255],
    [255, 0, 255],
    [255, 0, 0],
    [255, 128, 0],
    [255, 255, 0],
  ];
  let cellsPerDimension = 11;
  let msPerMove: number;
  let foodItems;
  let foodImage;
  let keyMappings;
  let arenaWidth;
  let cellWidth;
  let nextMoveTime: number;
  let rightmostCellCenter;
  let at;
  let numSnakes: number;
  let snakes: Snake[];

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
    setUpState();
    createControls();
  };

  p.draw = () => {
    const now = p.millis();
    const msPastNextMoveTime = now - nextMoveTime;
    if (msPastNextMoveTime > 0) {
      snakes.forEach(s => {
        if (s.autoDriving)
          s.autoSetDirection(snakes, foodItems);
        s.move(snakes, foodItems, () => s.die(),
          (foundFood) => {
            foodItems = foodItems.filter(f => ! f.equals(foundFood));
          });
      });
      const adjustedMs = p.keyIsDown(p.SHIFT) ? msPerMove / SPEEDUP_FACTOR : msPerMove;
      nextMoveTime = p.max(now, now + adjustedMs - msPastNextMoveTime);
    }

    while (foodItems.length < numSnakes / 2)
      foodItems.push(newFoodPosition());

    positionCamera();
    p.background(255);
    p.smooth();
    drawArena();
    snakes.forEach((s, i) => s.draw(SNAKE_RGBS[i % SNAKE_RGBS.length], drawReferenceStructures));
    drawFood();
  };

  p.keyPressed = () => {
    fadeOutControls();
    const requestedDir = keyMappings[p.key];
    if (requestedDir) {
      const oppositeOfCurrentDir = p5.Vector.mult(snakes[0].direction, -1);
      if (!requestedDir.equals(oppositeOfCurrentDir)) {
        snakes[0].direction = requestedDir;
        if (!nextMoveTime)
          nextMoveTime = p.millis();
      }
    }
  };

  function positionCamera() {
    const camX = p.map(Math.sin(p.frameCount / 50), -1, 1, 0, -arenaWidth * 0.8);
    const camY = -arenaWidth * 0.8;
    const camZ = (p.height / 2.0) / Math.tan(Math.PI * 30.0 / 180.0);
    p.camera(camX, camY, camZ,  0, 0, 0,  0, 1, 0);
  }

  function fadeInControls() {
    $(".fadeable-controls").fadeIn(500);
  }

  function fadeOutControls() {
    $(".fadeable-controls").fadeOut(2000);
  }

  function createControls() {
    $("#controls").mouseenter((e) => {
      fadeInControls();
    });

    const sliderCellsPerDimension = p.select('#numCells');
    sliderCellsPerDimension.value(cellsPerDimension);

    function changeCellsPerDim() {
      cellsPerDimension = sliderCellsPerDimension.value();
      resizeFromSlider();
      setUpState();
    }

    sliderCellsPerDimension.changed(changeCellsPerDim);

    const sliderSpeed = p.select('#speed');

    function setMsPerMoveFromSlider() {
      msPerMove = p.map(sliderSpeed.value(), 1, 50, 3000, 0);
    }

    sliderSpeed.changed(() => setMsPerMoveFromSlider());
    setMsPerMoveFromSlider();

    const sliderNumSnakes = p.select('#numSnakes');

    function setNumSnakesFromAutoSlider() {
      numSnakes = sliderNumSnakes.value();
      setUpState();
    }

    sliderNumSnakes.changed(() => setNumSnakesFromAutoSlider());
    setNumSnakesFromAutoSlider();

    const buttonDemo = p.select('#demo');
    buttonDemo.mousePressed(startDemo);

    function startDemo(): void {
      fadeOutControls();
      sliderSpeed.value(50); // todo don't hardcode these values
      setMsPerMoveFromSlider();
      sliderCellsPerDimension.value(15);
      changeCellsPerDim();
      sliderNumSnakes.value(11);
      setNumSnakesFromAutoSlider();
      snakes[0].autoDriving = true;
      nextMoveTime = p.millis();
    }
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
      'Home':       away,
      'End':        towards,
      'ArrowLeft':  left,
      'ArrowRight': right,
      'ArrowUp':    up,
      'ArrowDown':  down,
    };
  }

    function setUpState() {
      snakes = Array.from({length: numSnakes}, (v, i) =>
        new Snake(p, i, arenaWidth, () => cellWidth, cellsPerDimension, STARTING_NUM_SEGMENTS));
      foodItems = [];
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

    function drawWall(x: number, y: number, z: number, xRot: number, yRot: number): void {
      at([x, y, z], () => {
        p.rotateX(xRot);
        p.rotateY(yRot);
        for (let v = s; v <= l; v += cellWidth) {
          p.line(s, v, 0, l, v, 0);
          p.line(v, s, 0, v, l, 0);
        }
      });
    }


    const wallTransformations = [
      // x, y, z, xRot, yRot
      [0, 0, s, 0, 0],
      [l, 0, 0, 0, q],
      [0, l, 0, q, 0],
    ];
    wallTransformations.forEach(wt => drawWall(wt[0], wt[1], wt[2], wt[3], wt[4]));
  }

  function drawFood() {
    const itemWidth = cellWidth * 0.8;

    foodItems.forEach(food => {
      p.noStroke();
      p.texture(foodImage);
      at(food.array(), () => p.box(itemWidth));

      p.stroke(255, 0, 0);
      p.fill(255, 0, 0, 60);
      drawReferenceStructures(food, itemWidth);
    });
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
