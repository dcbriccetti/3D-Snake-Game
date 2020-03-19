class Snake {
  private readonly p;
  private readonly snakeIndex: number;
  private readonly arenaWidth: number;
  private readonly cellWidth: () => number;
  private readonly cellsPerDimension: number;
  private readonly zeroVector: any;
  private readonly at: (point: Number[], fn: () => void) => void;
  public direction: any;
  public segments: any[];
  private readonly moveOrder: number;
  public alive = true;
  public autoDriving: boolean;

  constructor(p, snakeIndex: number, arenaWidth: number, cellWidth: () => number, cellsPerDimension: number, startingNumSegments: number) {
    this.p = p;
    this.snakeIndex = snakeIndex;
    this.arenaWidth = arenaWidth;
    this.cellWidth = cellWidth;
    this.cellsPerDimension = cellsPerDimension;
    this.zeroVector = p.createVector(0, 0, 0);
    this.at = makeAt(p);
    this.alive = true;
    this.direction = this.p.createVector(0, 0, 0);
    this.segments = Array.from({length: startingNumSegments}, (v, i) =>
      this.p.createVector(-i * this.cellWidth(), 0, (Math.floor(cellsPerDimension / 2) - this.snakeIndex) * this.cellWidth()));
    const AXIS_MOVE_ORDERS = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ];
    this.moveOrder = p.random(AXIS_MOVE_ORDERS);
    this.autoDriving = snakeIndex > 0;
  }

  draw(rgb: Number[], drawReferenceStructures: (head, segWidth) => void) {
    if (! this.alive) return;
    const p = this.p;
    const segmentWidth = this.cellWidth() * 0.9;
    this.segments.forEach((segment, i) => {
      p.stroke('gray');
      p.fill(...rgb, 70);
      this.at(segment.array(), () => p.box(p.map(i, 0, this.segments.length, segmentWidth, segmentWidth * 0.5)));

      p.stroke(...rgb);
      p.fill(...rgb, 60);
      drawReferenceStructures(this.segments[0], segmentWidth);
    });
  }

  move(snakes: Snake[], food, collisionCallback: () => void, eatCallback: (pos) => void) {
    if (! this.alive) return;
    if (this.autoDriving || !this.direction.equals(this.zeroVector)) {
      const newHeadPos = p5.Vector.add(this.segments[0], p5.Vector.mult(this.direction, this.cellWidth()));
      if (this.collides(newHeadPos, snakes)) {
        collisionCallback();
      } else {
        if (newHeadPos.equals(food))
          eatCallback(food);
        else
          this.segments.pop(); // Discard last
        this.segments.unshift(newHeadPos); // Put new head on front
      }
    }
  }

  autoSetDirection(snakes: Snake[], food) {
    if (! this.alive) return;
    const p = this.p;
    const head = this.segments[0];
    const toFoodAxisDistances = p5.Vector.sub(food, head).array();
    let newDir;

    const validDirs = this.validMoveDirections(snakes);

    for (let ii = 0; ii < 3; ii++) {
      const i = this.moveOrder[ii];
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
      this.direction = newDir;
    else {
      if (validDirs.length) {
        this.direction = p.random(validDirs);
      }
    }
  }

  validMoveDirections(snakes: Snake[]) {
    const head = this.segments[0];
    const validDirs = [];
    [-1, 1].forEach(n => {
      for (let axis = 0; axis < 3; axis++) {
        const dirArray = [0, 0, 0];
        dirArray[axis] = n;
        const candidateDir = this.p.createVector(...dirArray);
        const candidatePos = p5.Vector.add(head, p5.Vector.mult(candidateDir, this.cellWidth()));
        if (!this.collides(candidatePos, snakes))
          validDirs.push(candidateDir);
      }
    });
    return validDirs;
  }

  collides(pos, snakes: Snake[]) {
    const inBounds = pos.array().every(coord => Math.abs(coord) < this.arenaWidth / 2);
    const collidesWithSelf = this.segments.some((segment, i) => i > 0 && segment.equals(pos));
    const otherSnakes = snakes.filter(s => this !== s && s.alive);
    const collidesWithOther = otherSnakes.some(s => s.segments.some(seg => seg.equals(pos)));
    return collidesWithSelf || collidesWithOther || !inBounds;
  }

  die() {
    this.alive = false;
  }
}
