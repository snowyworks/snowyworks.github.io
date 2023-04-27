/*
Title:      Floater Ball
Author:     Drew D. Lenhart
Website:    https://github.comdlenhart/floaterball
Date:       01-26-2021
Version:    0.0.7

NEXT:  Now fix circle to box collision!
*/

var FLTR = {
    // Speed
    x_speed: 0,
    y_speed: 0,
    gravity: 0.98,
    // X & Y position
    y: 300,
    x: 300,
    r: 10,
    // Length & Width of rectangle
    cw: 20,
    cl: 20,
    fl: null,
    fx: 0,
    fy: 0,
    // Vars for controls
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    pause: false,
    //
    gamePaused: false,
    score: 0,
    // Canvas settings
    WIDTH: 600,
    HEIGHT:  400,
    canvas: null,
    ctx:  null,
    debug: true,

    init: function () {
        FLTR.canvas = document.getElementsByTagName('canvas')[0];
        //set canvas width/height
        FLTR.canvas.width = FLTR.WIDTH;
        FLTR.canvas.height = FLTR.HEIGHT;
        // the canvas context
        FLTR.ctx = FLTR.canvas.getContext('2d');

        FLTR.gameloop();
    },

    update: function () {
        //check for keypress and move character.
        FLTR.checkKeys.move();

        //give the appearance of no gravity
        FLTR.x_speed*=FLTR.gravity;
        FLTR.y_speed*=FLTR.gravity;

        //edge collision - X
        if ( FLTR.x + FLTR.x_speed<=0 || FLTR.x + FLTR.x_speed>=FLTR.canvas.width){
            FLTR.x_speed=-FLTR.x_speed;
            if (FLTR.debug) console.log(FLTR.canvas.width + " Position: " + FLTR.x);
        }

        //edge collision - Y
        if ( FLTR.y + FLTR.y_speed<0 || FLTR.y + FLTR.y_speed>=FLTR.canvas.height){
            FLTR.y_speed=-FLTR.y_speed;
            if (FLTR.debug) console.log(FLTR.score);
        }

        //circle to square collision.
        var squared = (FLTR.r*FLTR.r);
        if (Math.round(FLTR.x) < FLTR.fx + FLTR.cl
            && Math.round(FLTR.x) + FLTR.r > FLTR.fx
            && Math.round(FLTR.y) < FLTR.fy + FLTR.cw
            && FLTR.r + Math.round(FLTR.y) > FLTR.fy){

            //console.log("collide");
            FLTR.score++;
            //randomize new square
            FLTR.squares.random();
        }

        //keep last otherwise collision doesnt work
        FLTR.x+=FLTR.x_speed;
        FLTR.y+=FLTR.y_speed;

        //testing limits
        if (FLTR.score == 55){
            endGame();

            // fire something here
        }

    },

    draw: function () {
        //draw circle, text, etc here.
        //clear, and redraw circle
        FLTR.character.clear();
        FLTR.character.circle(FLTR.x, FLTR.y, FLTR.r);

        //draw squares
        FLTR.squares.food(FLTR.fx, FLTR.fy);

        //score text
        FLTR.text.text('Score: ' + FLTR.score, 20, 30, 14, 'green');

        //timer text
        FLTR.text.text('Time: ' + 59, 20, 50, 14, 'green');
    },

    gameloop: function() {
        FLTR.draw();
        FLTR.update();
    }
};

FLTR.character = {

    clear: function () {
        //clear
        FLTR.ctx.clearRect(0, 0, FLTR.WIDTH, FLTR.HEIGHT);
    },

    circle: function (x, y, r) {
        FLTR.ctx.beginPath();
        FLTR.ctx.fillStyle="#ffffff";
        //draw circle, x, y, radius.
        FLTR.ctx.arc(x,y,r,0,Math.PI*2,true);
        FLTR.ctx.closePath();
        FLTR.ctx.fill();
    }
};

FLTR.squares = {

    random: function () {
        //calculate random x, y position within canvas.
        FLTR.fx = Math.round((FLTR.WIDTH-FLTR.cw)*Math.random());
        FLTR.fy = Math.round((FLTR.HEIGHT-FLTR.cw)*Math.random());
    },

    food: function (x, y) {
        //blue square, parameters x, y position
        FLTR.ctx.fillStyle = "#6F7678";
        FLTR.ctx.fillRect(x, y, FLTR.cl, FLTR.cw);
        FLTR.ctx.strokeStyle = "white";
        FLTR.ctx.strokeRect(x, y, FLTR.cl, FLTR.cw);
    }

};

FLTR.text = {
    text: function(string, x, y, size, col) {
        FLTR.ctx.font = 'bold '+size+'px Courier New';
        FLTR.ctx.fillStyle = col;
        FLTR.ctx.fillText(string, x, y);
    }
};

FLTR.checkKeys = {
    move: function () {
         if (FLTR.space){
             FLTR.y_speed = 0;
             FLTR.x_speed = 0;
         }
         if (FLTR.left){
             FLTR.x_speed--;
         }
         if (FLTR.right){
              FLTR.x_speed++;
         }
         if (FLTR.up){
              FLTR.y_speed--;
         }
         if (FLTR.down){
              FLTR.y_speed++;
         }


    }
};

window.onkeydown = function (event) {
     var key_pressed;
     if (event == null){
          key_pressed = window.event.keyCode;
     }
     else {
          key_pressed = event.keyCode;
     }
     switch(key_pressed){
          case 16:
               FLTR.space=true;
               break;
          case 37:
               FLTR.left=true;
               break;
          case 38:
               FLTR.up=true;
               break;
          case 39:
               FLTR.right=true;
               break;
          case 40:
               FLTR.down=true;
               break;

     }
}

window.onkeyup = function (event) {
     var key_pressed;
     if (event == null){
          key_pressed = window.event.keyCode;
     }
     else {
          key_pressed = event.keyCode;
     }
     switch(key_pressed){
          case 16:
               FLTR.space=false;
               break;
          case 37:
               FLTR.left=false;
               break;
          case 38:
               FLTR.up=false;
               break;
          case 39:
               FLTR.right=false;
               break;
          case 40:
               FLTR.down=false;
               break;
     }
}

//pause game function - 8-5-2016
function pauseGame () {
    if (!FLTR.gamePaused) {
        game = clearTimeout(game);
        FLTR.gamePaused = true;
        if (FLTR.debug) console.log("Game paused");
        document.getElementById('pauseb').innerHTML = 'Resume';
    } else if (FLTR.gamePaused) {
        game = setInterval(FLTR.init,30);
        FLTR.gamePaused = false;
        document.getElementById('pauseb').innerHTML = 'Pause';
  }
}

function endGame (){
    game = clearTimeout(game);
    //show new screen
    //show score
}

function startGame (){
    //hide start
    document.getElementById('start').style.display = "none";
    //document.getElementById('pauseOverlay').style.display = "none";
    //create initial random blocks
    FLTR.squares.random();
    //run game
    game = setInterval(FLTR.init,30);
}
