
// Game: BUBBLE POP!
// Group Members: 

//---------------------------------- Global vars ------------------------------------------------------


// view constants
const windowLen= {x: 120, y: 100}
const MIN_XPOS = windowLen.x - 30;
const MAX_XPOS = windowLen.x + 10;
const MIN_HEIGHT = windowLen.y - 30;
const MAX_HEIGHT = 20;
const MID_HEIGHT = (MIN_HEIGHT + MAX_HEIGHT)/2;
const MIN_RADIUS = 5;
const MAX_RADIUS = 15;

const enemyDefaultColor = "black";
const enemyHighlightColor = "purple";
const spawnOffset = 50;

const powerUpSpawnProbability = 0.2 
const radiusOffset = 2;

let stars;
let player = {posX: windowLen.x - 100, posY: windowLen.y - 13 , powerUpActive: false, powerUpTTL: 5} // powerUpTTL = time to live of powerup , powerup removed after TTL reaches 0
let enemies;
let spaceship;

//---------------------------------- Crisp game setup ------------------------------------------------------


title = "BUBBLE POP!";

description = `
[SPACE] SHOOT
`;

characters = [
  `
 ll
 ll
 l
lll
l l
  `,
  `
  ll
  ll
  l
  l
  l
  `
];

options = {
  theme: "dark",
  viewSize: windowLen,
  isPlayingBgm: true,
  isReplayEnabled: true,
};

//---------------------------------- Helper functions ------------------------------------------------------
//returns true with [powerUpSpawnProbability] pobability, otherwise false
function hasPowerup(){
  return rnd () < powerUpSpawnProbability;
}
//returns a random radius between MIN_RADIUS and MAX_RADIUS
function randRad(){
  return rndi(MIN_RADIUS, MAX_RADIUS);
}
//returns a random height between MIN_HEIGHT and MAX_HEIGHT
function randHeight(){
  return rndi(MAX_HEIGHT, MIN_HEIGHT);
}
//returns a random width between MIN_XPOS and MAX_XPOS
function randXpos(){
  return rndi(MIN_XPOS, MAX_XPOS);
}
// 50 / 50 probability returns true or false
function randBool(){
  return rndi(0, 1) == 0;
}
function animatePlayer() {
  char((ticks % 20 < 10) ? "a":"b", player.posX, player.posY)
}

function drawEnemies() {
  for (const enemy of enemies){
    //display power up if enemy contains a power up
    if (enemy.hasPowerup == true){
      color("cyan");
      enemy.powerUpBody = char("x", enemy.posX, enemy.posY, {rotation: ticks/60});
      color("black");
    }
    // draw the enemy
    color(enemy.color)
    arc(enemy.posX, enemy.posY, enemy.radius); 
  }
}

function resetEnemy(enemy){
  enemy.posX = windowLen.x + 10; 
  enemy.radius = randRad();
  enemy.hasPowerup = hasPowerup();
  enemy.powerUpBody = null;
}

//resets enemy bubble if popped either by a shield, or if popped on ship
function updateEnemies() {
  for (const enemy of enemies){
    if (player.powerUpActive){ // only do this if power up is active
      if (enemy.posX <= player.posX + 25) { // if enemy reaches power up shield
        console.log("shield popped bubble!");
        resetEnemy(enemy);
        addScore(1)
        play("coin");
      }
    } else{ //if power up is not active
      if (enemy.posX < spaceship.pos.x) { // if enemy reaches left side of screen
        console.log("bubble hit ship");
        resetEnemy(enemy);
        // subtract a point if score > 0
        if (score <= 0) {
          end("Ship got destroyed!")
        }
        addScore((score <= 0) ? 0 : -1)
        play("select");
      }
    }
  }
}

//checks if power up has expired and sets powerUpActive to false, otherwise draw the shield 
function drawShield(){
  if (player.powerUpTTL > 0){ //display power up if TTL is not expired
    color("blue");
    arc(-60, 50, 100, 3);
    color("black");
    if (ticks % 60 == 0) player.powerUpTTL--; // TTL - 1 every sec (~ every 60 frames)
  }else{
    player.powerUpActive= false;
    console.log("POWERUP OVER");
  }
}

// shrink or expand the radius of each enemy and alternate once it reaches max or min radius 
function dilate() {
  for (const enemy of enemies){
    //change enemy color when radius is smallest
    enemy.color = (enemy.radius <= MIN_RADIUS + radiusOffset)? enemyHighlightColor: enemyDefaultColor; 

    if (enemy.isGrowing) {
      enemy.radius++; 
      if (enemy.radius >= MAX_RADIUS) {
        enemy.isGrowing = false; 
      }
    }
    else{
      enemy.radius--; 
      if (enemy.radius <= MIN_RADIUS) {
        enemy.isGrowing = true; 
      }
    }
  }
}

function playerShoot() {
  if(input.isJustReleased){
    //sort enemies - closest enemy to player is first
    const sortedEnemies = enemies.sort(enemy=> enemy.posX);

    for (const enemy of sortedEnemies) {
      if (enemy.color == enemyHighlightColor && enemy.posX <=  windowLen.x){ // bubble is popable and in view
        console.log("popped a bubble");
        // add laser
        color("green")
        line(player.posX, player.posY, enemy.posX, enemy.posY, 3);
        color("black");

        //activate power up if available
        if (enemy.hasPowerup == true){
          player.powerUpActive = true;
          player.powerUpTTL = 5;
          play("powerUp");
          console.log("POWERUP ACTIVE");
        }
        // respawn enemy
        resetEnemy(enemy);
  
        // increase score
        addScore(1);
        play("coin");
        break
      }
    }
  }
}

function showShip() {
  color(spaceship.color)
  rect(spaceship.pos, 20, 70)
}

//---------------------------------- Update loop ------------------------------------------------------

function update() {
  if (!ticks) {
    // stars pooling
    stars = times(20, () => {
      return { pos: vec(rnd(200), rnd(80)), vy: rnd(1, 2) };
    });

    // enemies
    enemies = [
      {posX: randXpos() + spawnOffset, posY: MAX_HEIGHT, radius: randRad(), isGrowing: randBool(), hasPowerup: hasPowerup(), powerUpBody: null, color: enemyDefaultColor}, 
      {posX: randXpos() + spawnOffset, posY: MID_HEIGHT, radius: randRad(), isGrowing: randBool(), hasPowerup: hasPowerup(), powerUpBody: null, color: enemyDefaultColor}, 
      {posX: randXpos() + spawnOffset, posY: MIN_HEIGHT , radius: randRad(), isGrowing: randBool(), hasPowerup: hasPowerup(), powerUpBody: null, color: enemyDefaultColor}
    ];

    spaceship = {pos: vec(0, 10), color: "light_black"}
  }

  // star manager
  let scr = sqrt(difficulty) * 0.5;
  color("black");
  stars.forEach((s) => {
    s.pos.x -= scr / s.vy;
    if (s.pos.x < 0) {
      s.pos.set(200, rnd(80));
      s.vy = rnd(1, 2);
    }
    rect(s.pos, 1, 1);
  });

  // ground
  color("red");
  rect(0, 90, 200, 10);

  // player spawn
  color("black")
  animatePlayer()

  if (player.powerUpActive) drawShield();

  // draw enemies and update every frame
  drawEnemies(); 
  updateEnemies();

  //dialate the radius of the bubbles/enemies
  if (ticks%2 ) {
    enemies.forEach(enemy=> enemy.posX--); 
    dilate(); 
  }

  playerShoot();

  showShip()
}
