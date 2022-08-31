let facemesh;
let video;
let predictions = [];
let ready = false;

const s1 = function (sketch) {
  sketch.setup = function () {
    sketch.createCanvas(640, 480);
    video = sketch.createCapture(sketch.VIDEO);
    video.size(sketch.width, sketch.height);

    facemesh = ml5.facemesh(video, sketch.modelReady);

    // This sets up an event that fills the global variable "predictions"
    // with an array every time new predictions are made
    facemesh.on('predict', (results) => {
      predictions = results;
    });

    // Hide the video element, and just show the canvas
    video.hide();
  };

  sketch.modelReady = function () {
    document.querySelector('h1').innerText = 'Move yo face!';

    new p5(s2);
  };

  sketch.draw = function () {
    sketch.image(video, 0, 0, sketch.width, sketch.height);

    // We can call both functions to draw all keypoints
    sketch.drawKeypoints();
  };

  // A function to draw ellipses over the detected keypoints
  sketch.drawKeypoints = function () {
    for (let i = 0; i < predictions.length; i += 1) {
      const keypoints = predictions[i].scaledMesh;

      // Draw facial keypoints.
      for (let j = 0; j < keypoints.length; j += 1) {
        const [x, y] = keypoints[j];

        sketch.fill(0, 255, 0);
        sketch.ellipse(x, y, 5, 5);
      }
    }
  };
};

new p5(s1);

const s2 = function (sketch) {
  // the snake is divided into small segments, which are drawn and edited on each 'draw' call
  let numSegments = 10;
  let direction = 'right';

  const xStart = 0; //starting x coordinate for snake
  const yStart = 250; //starting y coordinate for snake
  const diff = 10;

  let xCor = [];
  let yCor = [];

  let xFruit = 0;
  let yFruit = 0;
  let scoreElem;

  sketch.setup = function () {
    scoreElem = sketch.createDiv('Score = 0');
    scoreElem.position(10, 60);
    scoreElem.id = 'score';

    sketch.createCanvas(500, 500);
    sketch.frameRate(15);
    sketch.stroke(255);
    sketch.strokeWeight(10);
    sketch.updateFruitCoordinates();

    for (let i = 0; i < numSegments; i++) {
      xCor.push(xStart + i * diff);
      yCor.push(yStart);
    }
  };

  sketch.draw = function () {
    sketch.background(0);
    for (let i = 0; i < numSegments - 1; i++) {
      sketch.line(xCor[i], yCor[i], xCor[i + 1], yCor[i + 1]);
    }
    sketch.updateSnakeCoordinates();
    sketch.checkGameStatus();
    sketch.checkForFruit();
    sketch.direction();
  };

  /*
 The segments are updated based on the direction of the snake.
 All segments from 0 to n-1 are just copied over to 1 till n, i.e. segment 0
 gets the value of segment 1, segment 1 gets the value of segment 2, and so on,
 and this results in the movement of the snake.

 The last segment is added based on the direction in which the snake is going,
 if it's going left or right, the last segment's x coordinate is increased by a
 predefined value 'diff' than its second to last segment. And if it's going up
 or down, the segment's y coordinate is affected.
*/

  sketch.updateSnakeCoordinates = function () {
    for (let i = 0; i < numSegments - 1; i++) {
      xCor[i] = xCor[i + 1];
      yCor[i] = yCor[i + 1];
    }
    switch (direction) {
      case 'right':
        xCor[numSegments - 1] = xCor[numSegments - 2] + diff;
        yCor[numSegments - 1] = yCor[numSegments - 2];
        break;
      case 'up':
        xCor[numSegments - 1] = xCor[numSegments - 2];
        yCor[numSegments - 1] = yCor[numSegments - 2] - diff;
        break;
      case 'left':
        xCor[numSegments - 1] = xCor[numSegments - 2] - diff;
        yCor[numSegments - 1] = yCor[numSegments - 2];
        break;
      case 'down':
        xCor[numSegments - 1] = xCor[numSegments - 2];
        yCor[numSegments - 1] = yCor[numSegments - 2] + diff;
        break;
    }
  };

  /*
 I always check the snake's head position xCor[xCor.length - 1] and
 yCor[yCor.length - 1] to see if it touches the game's boundaries
 or if the snake hits itself.
*/
  sketch.checkGameStatus = function () {
    if (
      xCor[xCor.length - 1] > sketch.width ||
      xCor[xCor.length - 1] < 0 ||
      yCor[yCor.length - 1] > sketch.height ||
      yCor[yCor.length - 1] < 0
      //   ||
      //   sketch.checkSnakeCollision()
    ) {
      sketch.noLoop();
      const scoreVal = parseInt(scoreElem.html().substring(8));
      scoreElem.html('Game ended! Your score was : ' + scoreVal);
    }
  };

  /*
 If the snake hits itself, that means the snake head's (x,y) coordinate
 has to be the same as one of its own segment's (x,y) coordinate.
*/
  sketch.checkSnakeCollision = function () {
    const snakeHeadX = xCor[xCor.length - 1];
    const snakeHeadY = yCor[yCor.length - 1];
    for (let i = 0; i < xCor.length - 1; i++) {
      if (xCor[i] === snakeHeadX && yCor[i] === snakeHeadY) {
        return true;
      }
    }
  };

  /*
 Whenever the snake consumes a fruit, I increment the number of segments,
 and just insert the tail segment again at the start of the array (basically
 I add the last segment again at the tail, thereby extending the tail)
*/
  sketch.checkForFruit = function () {
    sketch.point(xFruit, yFruit);
    if (xCor[xCor.length - 1] === xFruit && yCor[yCor.length - 1] === yFruit) {
      const prevScore = parseInt(scoreElem.html().substring(8));
      scoreElem.html('Score = ' + (prevScore + 1));
      xCor.unshift(xCor[0]);
      yCor.unshift(yCor[0]);
      numSegments++;
      sketch.updateFruitCoordinates();
    }
  };

  sketch.updateFruitCoordinates = function () {
    /*
      The complex math logic is because I wanted the point to lie
      in between 100 and width-100, and be rounded off to the nearest
      number divisible by 10, since I move the snake in multiples of 10.
    */

    xFruit = sketch.floor(sketch.random(10, (sketch.width - 100) / 10)) * 10;
    yFruit = sketch.floor(sketch.random(10, (sketch.height - 100) / 10)) * 10;
  };

  sketch.direction = function () {
    const facialPoint = predictions?.[0]?.annotations?.noseTip?.[0];

    if (facialPoint?.[0] < 300) {
      console.log('right');
      direction = 'right';
    }

    if (facialPoint?.[0] > 400) {
      console.log('right');
      direction = 'left';
    }

    if (facialPoint?.[1] < 230) {
      console.log('up');
      direction = 'up';
    }
    if (facialPoint?.[1] > 320) {
      console.log('down');
      direction = 'down';
    }
  };
};
