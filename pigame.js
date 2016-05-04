var GV = function () {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var gameOver = false;
  // Pi variables
  var piX = 30;
  var piY = 287; // leave a 5px gap between pi and the canvas edge
  var piR = 25;  // Pi's radius
  var piSTop = 0.25 * Math.PI; // Starting angle of top part
  var piETop = 0.75 * Math.PI; // Ending angle of top part
  var piSBottom = 1.25 * Math.PI; // Starting angle of bottom part
  var piEBottom = 1.75 * Math.PI;  // Ending angle of bottom part
  var piDir = 1; // 1: faces right, -1: faces left, default is 1 as Pi starts at left corner
  var piLeft = piX - piR;
  var piRight = piX + piR;
  var piTop = piY - piR;
  var piColor = ['#187018', '#236518', '#2E5B19','#3A5119', '#45471A', '#513D1A', '#5C331B', '#68291B', '#731F1C','#7F151D'];
  var piIndex = 0;
  // Eating and food variables
  var eating = false;
  var food = true; 
  var foodX = canvas.width / 2;
  var foodY = 287;
  var foodSize = 10;
  var foodCounter = 0;
  var foodPrevSect = 3; // Previous section that food appeared, default is 3
  // Float variables
  var floatDir = 1; // 1: float up, -1, float down
  var floatMax = 2;
  var floatAmt = 0;
  var floatInc = 1;
  // Thorn variables
  var sWidth = canvas.width / 5;  // Section width
  var tWidth = 10;  // Thorn Width
  var thornLength = piY + piR;
  var thornMin = 0.3 * canvas.height;
  var thornDir = -1; // -1: thorns are going up; 1: thorns are going down
  var thornInc = 8;
  var thornNum = 'odd';
  var stabbed = false;
  var thornArr = []; // Array that contains thorns, each element is another array containing x, y, middle, thornLength
  for (var i = 0; i < 4; i++) {
    var n = i + 1;
    thornArr[i] = [sWidth * n, sWidth * n + tWidth, sWidth * n + 0.5 * tWidth, thornLength];
  };
  // Score variables
  var scoreX = 30;
  var scoreY = 30;
  var scoreSize = 20;
  var halfSize = scoreSize / 2;
  var win = false;
  // Moving variables
  var leftPressed = false;
  var rightPressed = false;
  
  // START THE GAME - hide result div
  $(window).load(function () {
    $('div').hide();
  });
  
  // KEYPRESS AND TAP EVENTS HANDLER FUNCTIONS
  // Listen to pressing key events
  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);

  // keyDownHandler and keyUpHandler check if the left or right arrow keys are being pressed or released. The leftPressed or
  // rightPressed will be changed accordingly (true if being pressed and false if released).
  function keyDownHandler(e) {
    if(e.keyCode === 39) {
      rightPressed = true;
      if (piDir === -1){
        piDir = 1;
      };
    }
    else if(e.keyCode === 37) {
      leftPressed = true;
      if (piDir === 1){
        piDir = -1;
      };
    }
  };

  function keyUpHandler(e) {
    if(e.keyCode === 39) {
      rightPressed = false;
    }
    else if(e.keyCode === 37) {
      leftPressed = false;
    }
  };  
  
  // HELPER FUNCTIONS
  function evenOrOdd(n) {
    return n % 2 === 0 ? 'even' : 'odd';
  };
  
  function drawShadow(xStart, yStart, yControlLower, xEnd, yControlUpper) {
    // This function draws two Bezier Curves representing two halves of the shadow
    // Control 1 and Control 2 are control points for the Lower part
    // Control 3 and Control 4 are control points for the Upper part
    // xControl1 === xControl4 === xStart and xControl2 === xControl3 = xEnd
    // yControl1 === yControl2 === yControlLower
    // yControl3 === yControl4 === yControlUpper
    // yStart === yEnd
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    // Lower half
    ctx.bezierCurveTo(xStart, yControlLower, xEnd, yControlLower, xEnd, yStart);
    // Upper half
    ctx.bezierCurveTo(xEnd, yControlUpper, xStart, yControlUpper, xStart, yStart);
    ctx.fillStyle = '#051505';
    ctx.fill();
    ctx.closePath();
  };

  // THE THORN DEPARTMENT
  function drawThorn() {
    // Divide the canvas into 5 sections to draw thorns
    for (var i = 0; i < 4; i++) {
      // DRAW SHADOW
    
      // Create gradient colours for thorns
      var tGradient = ctx.createLinearGradient(thornArr[i][2], 0, thornArr[i][2], thornArr[i][3]);
      tGradient.addColorStop("0", "#112863");
      tGradient.addColorStop("0.5", "#7A6021");
      tGradient.addColorStop("1.0", "#375191");
      // Create the thorn shape
      ctx.beginPath();
      ctx.moveTo(thornArr[i][0], 0);
      ctx.lineTo(thornArr[i][1], 0);
      // Update thorn length based on current thornNum counter
      if (evenOrOdd(i) === thornNum) {
        thornArr[i][3] = thornLength;
      };
      ctx.lineTo(thornArr[i][2], thornArr[i][3]);
      ctx.lineTo(thornArr[i][0], 0);
      ctx.closePath();
      ctx.fillStyle= tGradient;
      ctx.fill();
      // Check if the (i+1)th thorn stabbed Pi
      if (!stabbed && stabbedPiYet(thornArr[i][2], thornArr[i][3]-2)) {
        gameOver = true;
      }
    };
  };

  function updateThornLength() {
    if (thornDir === -1){  // Going up
      thornLength -= thornInc;
      if (thornLength < thornMin) {
        thornDir = 1;
      }
    }
    else {  // Going down
      thornLength += thornInc;
      if (thornLength > canvas.height) {
        thornDir = -1;
        thornNum = thornNum === 'odd' ? 'even' : 'odd';
      }
    }
  };
  
  function stabbedPiYet(middle, length) {
    // To stab Pi, thorns must be between piLeft and piRight and the tip of the thorn is lower than piTop. 
    // The pixel at thorn tip should also has the same colour as Pi.
    if (middle >= piLeft && middle <= piRight && length >= piTop) {
      if (length >= piY) {
        stabbed = true;
      }
      else {
        drawPi('#187018');
        var pixelData = ctx.getImageData(middle, length, 1, 1).data;
        // Check if pixelData is in range for Pi's colour and colours of Pi's edge
        if (pixelData[0] >= 24 && pixelData[0] <= 27 && pixelData[1] >=111 && pixelData[1] <=114 && pixelData[2] >= 24 && pixelData[2] <= 27 ) {
          stabbed = true;
        };
      }
    }
    return stabbed;
  };
  
  // THE PI DEPARTMENT
  function drawPi(color) {
    // Draw shadow
    drawShadow(piX - piR, piY + piR, piY + 1.15 * piR, piX + piR, piY + 0.85 * piR);
    //Draw Pi
    // Bottom part
    ctx.beginPath();
    ctx.arc(piX, piY, piR, piSBottom, piEBottom, true);
    ctx.fillStyle = color;
    ctx.fill();
    // Upper part
    ctx.beginPath();
    ctx.arc(piX, piY, piR, piSTop, piETop, true);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  };
  
  function eat() {
  // If Pi is eating, the upper side will move counter clockwise and the bottom side will move clockwise
    if (eating) {
      // If food is on the left, the left side, piETop and piSBottom, change
      if (foodX < piLeft) {
        piETop += 0.01 * Math.PI;
        piSBottom -= 0.01 * Math.PI;
      } 
      // If food is on the right, the right side, piSTop and piEBottom, change
      else if (foodX > piRight) {
        piSTop -= 0.01 * Math.PI;
        piEBottom += 0.01 * Math.PI;
      }
    }
  };
  
  function stopEating() {
    food = false;
    eating = false;
    piETop = 0.75 * Math.PI;
    piSBottom = 1.25 * Math.PI; 
    piSTop = 0.25 * Math.PI; 
    piEBottom = 1.75 * Math.PI;
    foodCounter++;
    // Increase difficulty
    if (foodCounter === 3 || foodCounter === 5 || foodCounter === 7 || foodCounter === 9) {
      thornInc += 1;
    }
  };
  
  function haveFood() {
    // Detect collision with food on both side depending on moving direction.
    // Check on the right side and the left side
    if (piRight >= foodX - 10 && piLeft < foodX || piLeft <= foodX + 10 && piRight > foodX) {
      eating = true;
      if (foodX < piLeft) {
        piETop = Math.PI;
        piSBottom = Math.PI;
      }
      else if (foodX > piRight) {
        piSTop = 0;
        piEBottom = 2 * Math.PI;
      }
    }
    return eating;
  };
  
  function reDrawPi() {
    if (eating) {  // What to draw when eating
      eat();
      drawPi('#187018');
      // If mouth fully opens, stop eating
      if (piSTop <= -0.25 * Math.PI && piEBottom >= 2.25 * Math.PI || piSBottom <= 0.75 * Math.PI && piETop >= 1.25 * Math.PI) {
        stopEating();
      };
    }
    else { 
      // What to draw when moving
      drawPi('#187018');
      haveFood();
    };
  };
  
  function updatePiLocation() {
    // Only move when not eating
    if (rightPressed && piX < (canvas.width - piR - 5) && !stabbed && !haveFood() ){
      piX += 5;
      piLeft = piX - piR;
      piRight = piX + piR;
    }
    else if (leftPressed && piX > piR + 5 && !stabbed && !haveFood()) {
      piX -= 5;
      piLeft = piX - piR;
      piRight = piX + piR;
    };
  };
  
  // THE FOOD DEPARTMENT
  function drawFood(x, y, z, change, fShadow) {
    // Create diamond shape
    ctx.beginPath();
    ctx.moveTo(x, y - z - change);
    ctx.lineTo(x + z, y - change);
    ctx.lineTo(x, y + z - change);
    ctx.lineTo(x - z, y - change);
    ctx.lineTo(x, y - z - change);
    ctx.closePath();
    // Create gradient colors
    var gradient = ctx.createLinearGradient(x - z, y, x + z, y);
    gradient.addColorStop("0", "#379138");
    gradient.addColorStop("0.5", "#375191");
    gradient.addColorStop("1.0", "#91376B");
    // Draw diamond shape with gradient strokes
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 5;
    ctx.stroke();
    // Draw shadow
    if (fShadow) {
      drawShadow(x - 7, y + piR, y + piR + 2, x + 7, y + piR - 2);
    };
  };
  
  function floatFood() {
    if (floatDir === 1) {  // floating up
      floatAmt -= floatInc;
      if (floatAmt < - floatMax) {
        floatDir = -1;
      }
    }
    else {
      floatAmt += floatInc;
      if (floatAmt > floatMax) {
        floatDir = 1;
      }
    }
  };
  
  function reDrawFood() {
    if (!food) {
      food = true;
      var sectionNum = Math.floor(Math.random()*5) + 1;
      while (sectionNum === foodPrevSect) {
        sectionNum = Math.floor(Math.random()*5) + 1;
      };
      foodX = (sectionNum - 0.5) * sWidth;
      foodPrevSect = sectionNum;
    }
    else {
      drawFood(foodX, foodY, foodSize, floatAmt, true); 
    };
  };
  
  // DISPLAY SCORE
  function displayScore() {
    if (foodCounter >= 1 && foodCounter <3) {
      fillScore(scoreX, scoreY + scoreSize, 0.75 * halfSize, false);
    }
    
    else if(foodCounter >= 3 && foodCounter < 5){
      fillScore(scoreX, scoreY + scoreSize, halfSize, false);
    }
    else if (foodCounter >= 5 && foodCounter < 7) {
      fillScore(scoreX, scoreY + scoreSize, scoreSize, false);
    }
    
    else if (foodCounter >= 7 && foodCounter < 10){
      fillScore(scoreX, scoreY + scoreSize, scoreSize, true);
    }
    else if (foodCounter === 10) {
      fillScore(scoreX, scoreY + scoreSize, scoreSize, true);   
    }
    // Draw score container
    drawFood(scoreX, scoreY, scoreSize, 0, false);
  };
  
  function fillScore(x, y, z, over) {
    // Fill score container with gradient colours;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - z, y - z);
    if (over) {
      if (foodCounter < 10) {
        ctx.lineTo(x - 0.5 * z, y - 1.5 * z);
        ctx.lineTo(x + 0.5 * z, y - 1.5 * z);
    }
      else {
        ctx.lineTo(x, y - 2 * z);
      }
    };
    ctx.lineTo(x + z, y - z);
    ctx.lineTo (x, y);
    ctx.closePath();
    // Add gradient colors
    var scoreGradient = ctx.createLinearGradient(x - z, y - z, x + z, y - z);
    scoreGradient.addColorStop("0", "#379138");
    scoreGradient.addColorStop("0.5", "#375191");
    scoreGradient.addColorStop("1.0", "#91376B");
    ctx.fillStyle = scoreGradient;
    ctx.fill();
  };
  
  // GAME ENDING FUNCTIONS
  function endGame() {
    var id4 = setInterval(finalDraws, 100);
    console.log('I was here too');
    // What to draw after Pi is hit
    function finalDraws() {
      // If win
      if (foodCounter === 10 && !stabbed) {
        clearInterval(id4);
        win = true;
        resetGame();
      }
      // If lose
      else {
        if (piIndex < 10) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          reDrawFood();
          drawThorn();
          displayScore();
          drawPi(piColor[piIndex]);
          piIndex++;
        }
        else {
          clearInterval(id4);
          resetGame();
        }
      }
    };
  };
  
  function resetGame() {
    $('canvas').fadeOut(function () {
      $('div').show(function () { // show result div
        if (win) {
          document.getElementsByTagName('INPUT')[0].setAttribute('src', '/pi/play-edit.png');
          document.getElementById('result').innerHTML = 'You win! Another round!'
        }
        else {
          document.getElementsByTagName('INPUT')[0].setAttribute('src', '/pi/refresh-edit.png');
          document.getElementById('result').innerHTML = 'Uh oh, you touched a poisonous thorn. Let\'s try again'
        }
      });  
    });
  };
  
  // MAIN DRAW FUNCTION 
  function play() {
    var id1= setInterval(draw, 10);
    var id2= setInterval(floatFood, 100);
    function draw() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Food Counter
      displayScore();
      
      if (gameOver) {
        reDrawFood();
        drawThorn();  // Always draw thorn before draw Pi to make sure stab function is accurate
        reDrawPi();
        displayScore();
        clearInterval(id1);
        clearInterval(id2);
        console.log('I was here');
        endGame();
      }
      else {
        // Draw food
        reDrawFood();
        
        // Draw thorns. Always draw thorn before draw Pi to make sure stab function is accurate
        drawThorn();
        
        // Draw Pi
        reDrawPi();
        
        // Update functions only when game is still running
        if(!gameOver) {
          updatePiLocation();
          updateThornLength();
        };

        if (foodCounter === 10) {
          gameOver = true;
        }
      }
    };
  };
  
  // Return the main game object
  return {
    play: play,
  }
}();

GV.play();