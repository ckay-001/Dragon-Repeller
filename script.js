// Game Data
const weapons = [
  { name: 'stick', power: 5 },
  { name: 'dagger', power: 30 },
  { name: 'claw hammer', power: 50 },
  { name: 'sword', power: 100 }
];

const monsters = [
  { name: "slime", level: 2, health: 15 },
  { name: "fanged beast", level: 8, health: 60 },
  { name: "dragon", level: 20, health: 300 }
];

const locations = [
  {
    name: "town square",
    buttonText: ["Go to store", "Go to cave", "Fight dragon"],
    buttonFunctions: [goStore, goCave, fightDragon],
    text: "You are in the town square. You see a sign that says 'Store'. A dark cave looms in the distance, and you sense a powerful dragon nearby."
  },
  {
    name: "store",
    buttonText: ["Buy 10 health (10 gold)", "Buy weapon (30 gold)", "Go to town square"],
    buttonFunctions: [buyHealth, buyWeapon, goTown],
    text: "You enter the store. The shopkeeper greets you with a friendly smile."
  },
  {
    name: "cave",
    buttonText: ["Fight slime", "Fight fanged beast", "Go to town square"],
    buttonFunctions: [fightSlime, fightBeast, goTown],
    text: "You enter the dark cave. Water drips from the ceiling and you hear strange noises echoing from the depths."
  },
  {
    name: "fight",
    buttonText: ["Attack", "Dodge", "Run"],
    buttonFunctions: [attack, dodge, goTown],
    text: "You are fighting a monster! Choose your action carefully."
  },
  {
    name: "kill monster",
    buttonText: ["Go to town square", "Go to town square", "Go to town square"],
    buttonFunctions: [goTown, goTown, goTown],
    text: 'The monster screams "Arg!" as it dies. You gain experience points and find gold!'
  },
  {
    name: "lose",
    buttonText: ["REPLAY?", "REPLAY?", "REPLAY?"],
    buttonFunctions: [restart, restart, restart],
    text: "You die. ☠️ Your adventure ends here, but you can try again!"
  },
  {
    name: "win",
    buttonText: ["REPLAY?", "REPLAY?", "REPLAY?"],
    buttonFunctions: [restart, restart, restart],
    text: "You defeat the dragon! YOU WIN THE GAME! 🎉 You are now a legendary hero!"
  },
  {
    name: "easter egg",
    buttonText: ["Pick 2", "Pick 8", "Go to town square"],
    buttonFunctions: [pickTwo, pickEight, goTown],
    text: "You find a mysterious fortune teller! Pick a number and test your luck. Ten numbers will be randomly chosen between 0 and 10. If your number matches, you win gold!"
  }
];

// Utility Functions
function updateUI() {
  elements.xpText.innerText = gameState.xp;
  elements.healthText.innerText = gameState.health;
  elements.goldText.innerText = gameState.gold;
  elements.healthBar.value = gameState.health;
  elements.healthBar.max = gameState.maxHealth;
}

function logCombat(message, type = 'normal') {
  const log = elements.combatLog;
  const logEntry = document.createElement('div');

  switch (type) {
    case 'damage':
      logEntry.className = 'damage-number';
      break;
    case 'heal':
      logEntry.className = 'heal-number';
      break;
    case 'miss':
      logEntry.className = 'miss-text';
      break;
  }

  logEntry.textContent = message;
  log.appendChild(logEntry);
  log.scrollTop = log.scrollHeight;
}

function clearCombatLog() {
  elements.combatLog.innerHTML = '';
}

// Core Game Functions
function update(location) {
  elements.monsterStats.style.display = "none";
  clearCombatLog();

  elements.button1.innerText = location.buttonText[0];
  elements.button2.innerText = location.buttonText[1];
  elements.button3.innerText = location.buttonText[2];

  elements.button1.onclick = location.buttonFunctions[0];
  elements.button2.onclick = location.buttonFunctions[1];
  elements.button3.onclick = location.buttonFunctions[2];

  elements.text.innerHTML = location.text;
  updateUI();
}

// Location Functions
function goTown() {
  update(locations[0]);
}

function goStore() {
  update(locations[1]);
}

function goCave() {
  update(locations[2]);
}

// Store Functions
function buyHealth() {
  if (gameState.gold >= 10) {
    gameState.gold -= 10;
    const healAmount = Math.min(10, gameState.maxHealth - gameState.health);
    gameState.health += healAmount;
    updateUI();
    elements.text.innerText = `You drink a health potion and restore ${healAmount} health points.`;
  } else {
    elements.text.innerText = "You do not have enough gold to buy health.";
  }
}

function buyWeapon() {
  if (gameState.currentWeapon < weapons.length - 1) {
    if (gameState.gold >= 30) {
      gameState.gold -= 30;
      gameState.currentWeapon++;
      const newWeapon = weapons[gameState.currentWeapon].name;
      gameState.inventory.push(newWeapon);
      updateUI();
      elements.text.innerText = `You now have a ${newWeapon}! In your inventory you have: ${gameState.inventory.join(', ')}`;
    } else {
      elements.text.innerText = "You do not have enough gold to buy a weapon.";
    }
  } else {
    elements.text.innerText = "You already have the most powerful weapon!";
    elements.button2.innerText = "Sell weapon for 15 gold";
    elements.button2.onclick = sellWeapon;
  }
}

function sellWeapon() {
  if (gameState.inventory.length > 1) {
    gameState.gold += 15;
    const soldWeapon = gameState.inventory.pop(); // Remove the last (current) weapon
    gameState.currentWeapon--;
    updateUI();
    elements.text.innerText = `You sold a ${soldWeapon}. In your inventory you have: ${gameState.inventory.join(', ')}`;
  } else {
    elements.text.innerText = "Don't sell your only weapon!";
  }
}

// Combat Functions
function fightSlime() {
  gameState.fighting = 0;
  goFight();
}

function fightBeast() {
  gameState.fighting = 1;
  goFight();
}

function fightDragon() {
  gameState.fighting = 2;
  goFight();
}

function goFight() {
  update(locations[3]);
  const monster = monsters[gameState.fighting];
  gameState.monsterHealth = monster.health;

  elements.monsterStats.style.display = "block";
  elements.monsterName.innerText = monster.name;
  elements.monsterHealthText.innerText = gameState.monsterHealth;
  elements.monsterHealthBar.max = monster.health;
  elements.monsterHealthBar.value = monster.health;

  logCombat(`A wild ${monster.name} appears!`);
}

function attack() {
  const monster = monsters[gameState.fighting];
  const weapon = weapons[gameState.currentWeapon];

  // Monster attacks first
  const monsterDamage = getMonsterAttackValue(monster.level);
  gameState.health -= monsterDamage;

  if (monsterDamage > 0) {
    logCombat(`The ${monster.name} attacks you for ${monsterDamage} damage!`, 'damage');
  } else {
    logCombat(`The ${monster.name} misses its attack!`, 'miss');
  }

  // Player attacks
  if (isMonsterHit()) {
    const playerDamage = weapon.power + Math.floor(Math.random() * gameState.xp) + 1;
    gameState.monsterHealth -= playerDamage;
    logCombat(`You attack with your ${weapon.name} for ${playerDamage} damage!`);

    // Weapon breaking chance
    if (Math.random() <= 0.1 && gameState.inventory.length > 1) {
      const brokenWeapon = gameState.inventory.pop();
      gameState.currentWeapon--;
      logCombat(`Your ${brokenWeapon} breaks!`, 'damage');
    }
  } else {
    logCombat("You miss your attack!", 'miss');
  }

  // Update UI
  updateUI();
  elements.monsterHealthText.innerText = Math.max(0, gameState.monsterHealth);
  elements.monsterHealthBar.value = Math.max(0, gameState.monsterHealth);

  // Check battle results
  if (gameState.health <= 0) {
    lose();
  } else if (gameState.monsterHealth <= 0) {
    if (gameState.fighting === 2) {
      winGame();
    } else {
      defeatMonster();
    }
  }
}

function getMonsterAttackValue(level) {
  const baseAttack = level * 5;
  const xpReduction = Math.floor(Math.random() * gameState.xp);
  return Math.max(0, baseAttack - xpReduction);
}

function isMonsterHit() {
  // 80% hit chance, or guaranteed hit if health is low
  return Math.random() > 0.2 || gameState.health < 20;
}

function dodge() {
  const monster = monsters[gameState.fighting];
  if (Math.random() > 0.5) {
    elements.text.innerText = `You successfully dodge the attack from the ${monster.name}!`;
    logCombat("You dodge successfully!", 'heal');
  } else {
    const damage = Math.floor(getMonsterAttackValue(monster.level) * 0.5);
    gameState.health -= damage;
    elements.text.innerText = `You partially dodge, but still take ${damage} damage!`;
    logCombat(`You take ${damage} damage while dodging!`, 'damage');
    updateUI();

    if (gameState.health <= 0) {
      lose();
    }
  }
}

function defeatMonster() {
  const monster = monsters[gameState.fighting];
  const goldReward = Math.floor(monster.level * 6.7);
  const xpReward = monster.level;

  gameState.gold += goldReward;
  gameState.xp += xpReward;

  logCombat(`Victory! You gained ${xpReward} XP and found ${goldReward} gold!`, 'heal');
  update(locations[4]);
}

function lose() {
  update(locations[5]);
}

function winGame() {
  update(locations[6]);
}

function restart() {
  gameState = {
    xp: 0,
    health: 100,
    maxHealth: 100,
    gold: 50,
    currentWeapon: 0,
    fighting: null,
    monsterHealth: 0,
    inventory: ["stick"]
  };

  elements.healthBar.max = 100;
  updateUI();
  goTown();
}

// Easter Egg Functions
function easterEgg() {
  update(locations[7]);
}

function pickTwo() {
  pick(2);
}

function pickEight() {
  pick(8);
}

function pick(guess) {
  const numbers = [];
  while (numbers.length < 10) {
    numbers.push(Math.floor(Math.random() * 11));
  }

  elements.text.innerHTML = `You picked ${guess}. Here are the random numbers:<br>${numbers.join(', ')}`;

  if (numbers.includes(guess)) {
    elements.text.innerHTML += "<br><br>🎉 Right! You win 20 gold!";
    gameState.gold += 20;
    updateUI();
  } else {
    elements.text.innerHTML += "<br><br>💀 Wrong! You lose 10 health!";
    gameState.health -= 10;
    updateUI();

    if (gameState.health <= 0) {
      lose();
    }
  }
}

// Initialize the game
function initGame() {
  updateUI();
  goTown();
}

// Start the game
initGame();


//My code before
/*let xp = 0;
let health = 100;
let gold = 50;
let currentWeapon = 0;
let fighting;
let monsterHealth;
let inventory = ["stick"];

const button1 = document.querySelector('#button1');
const button2 = document.querySelector("#button2");
const button3 = document.querySelector("#button3");
const text = document.querySelector("#text");
const xpText = document.querySelector("#xpText");
const healthText = document.querySelector("#healthText");
const goldText = document.querySelector("#goldText");
const monsterStats = document.querySelector("#monsterStats");
const monsterName = document.querySelector("#monsterName");
const monsterHealthText = document.querySelector("#monsterHealth");
const healthBar = document.querySelector("#healthBar");
const monsterHealthBar = document.querySelector("#monsterHealthBar");
const weapons = [
  { name: 'stick', power: 5 },
  { name: 'dagger', power: 30 },
  { name: 'claw hammer', power: 50 },
  { name: 'sword', power: 100 }
];
const monsters = [
  {
    name: "slime",
    level: 2,
    health: 15
  },
  {
    name: "fanged beast",
    level: 8,
    health: 60
  },
  {
    name: "dragon",
    level: 20,
    health: 300
  }
]
const locations = [
  {
    name: "town square",
    "button text": ["Go to store", "Go to cave", "Fight dragon"],
    "button functions": [goStore, goCave, fightDragon],
    text: "You are in the town square. You see a sign that says \"Store\"."
  },
  {
    name: "store",
    "button text": ["Buy 10 health (10 gold)", "Buy weapon (30 gold)", "Go to town square"],
    "button functions": [buyHealth, buyWeapon, goTown],
    text: "You enter the store."
  },
  {
    name: "cave",
    "button text": ["Fight slime", "Fight fanged beast", "Go to town square"],
    "button functions": [fightSlime, fightBeast, goTown],
    text: "You enter the cave. You see some monsters."
  },
  {
    name: "fight",
    "button text": ["Attack", "Dodge", "Run"],
    "button functions": [attack, dodge, goTown],
    text: "You are fighting a monster."
  },
  {
    name: "kill monster",
    "button text": ["Go to town square", "Go to town square", "Go to town square"],
    "button functions": [goTown, goTown, goTown],
    text: 'The monster screams "Arg!" as it dies. You gain experience points and find gold.'
  },
  {
    name: "lose",
    "button text": ["REPLAY?", "REPLAY?", "REPLAY?"],
    "button functions": [restart, restart, restart],
    text: "You die. &#x2620;"
  },
  { 
    name: "win", 
    "button text": ["REPLAY?", "REPLAY?", "REPLAY?"], 
    "button functions": [restart, restart, restart], 
    text: "You defeat the dragon! YOU WIN THE GAME! &#x1F389;" 
  },
  {
    name: "easter egg",
    "button text": ["2", "8", "Go to town square?"],
    "button functions": [pickTwo, pickEight, easterEgg],
    text: "You find a secret game. Pick a number above. Ten numbers will be randomly chosen between 0 and 10. If the number you choose matches one of the random numbers, you win!"
  }
];

// initialize buttons
button1.onclick = goStore;
button2.onclick = goCave;
button3.onclick = fightDragon;

function update(location) {
  monsterStats.style.display = "none";
  button1.innerText = location["button text"][0];
  button2.innerText = location["button text"][1];
  button3.innerText = location["button text"][2];
  button1.onclick = location["button functions"][0];
  button2.onclick = location["button functions"][1];
  button3.onclick = location["button functions"][2];
  text.innerHTML = location.text;
}

function goTown() {
  update(locations[0]);
}

function goStore() {
  update(locations[1]);
}

function goCave() {
  update(locations[2]);
}

function buyHealth() {
  if (gold >= 10) {
    gold -= 10;
    health = Math.min(health + 10, healthBar.max);
    goldText.innerText = gold;
    healthText.innerText = health;
    healthBar.value = health;
  } else {
    text.innerText = "You do not have enough gold to buy health.";
  }
}

function buyWeapon() {
  if (currentWeapon < weapons.length - 1) {
    if (gold >= 30) {
      gold -= 30;
      currentWeapon++;
      goldText.innerText = gold;
      let newWeapon = weapons[currentWeapon].name;
      text.innerText = "You now have a " + newWeapon + ".";
      inventory.push(newWeapon);
      text.innerText += " In your inventory you have: " + inventory;
    } else {
      text.innerText = "You do not have enough gold to buy a weapon.";
    }
  } else {
    text.innerText = "You already have the most powerful weapon!";
    button2.innerText = "Sell weapon for 15 gold";
    button2.onclick = sellWeapon;
  }
}

function sellWeapon() {
  if (inventory.length > 1) {
    gold += 15;
    goldText.innerText = gold;
    let currentWeapon = inventory.shift();
    text.innerText = "You sold a " + currentWeapon + ".";
    text.innerText += " In your inventory you have: " + inventory;
  } else {
    text.innerText = "Don't sell your only weapon!";
  }
}

function fightSlime() {
  fighting = 0;
  goFight();
}

function fightBeast() {
  fighting = 1;
  goFight();
}

function fightDragon() {
  fighting = 2;
  goFight();
}

function goFight() {
  update(locations[3]);
  monsterHealth = monsters[fighting].health;
  monsterStats.style.display = "block";
  monsterName.innerText = monsters[fighting].name;
  monsterHealthText.innerText = monsterHealth;
  monsterHealthBar.max = monsters[fighting].health;
  monsterHealthBar.value = monsters[fighting].health;
}

function attack() {
  text.innerText = "The " + monsters[fighting].name + " attacks.";
  text.innerText += " You attack it with your " + weapons[currentWeapon].name + ".";
  health -= getMonsterAttackValue(monsters[fighting].level);
  if (isMonsterHit()) {
    monsterHealth -= weapons[currentWeapon].power + Math.floor(Math.random() * xp) + 1;    
  } else {
    text.innerText += " You miss.";
  }
  healthText.innerText = health;
  healthBar.value = health;
  monsterHealthText.innerText = monsterHealth;
  monsterHealthBar.innerText = monsterHealth; 
  if (health <= 0) {
    lose();
  } else if (monsterHealth <= 0) {
    if (fighting === 2) {
      winGame();
    } else {
      defeatMonster();
    }
  }
  if (Math.random() <= .1 && inventory.length !== 1) {
    text.innerText += " Your " + inventory.pop() + " breaks.";
    currentWeapon--;
  }
  let damage = Math.floor(Math.random() * 10) + 1;
  monsterHealth -= damage;
  monsterHealthText.innerText = monsterHealth;
  document.querySelector("#monsterHealthBar").value = monsterHealth;

  document.querySelector("#combatLog").innerText =
    `You hit the monster for ${damage} damage!`;

  if (monsterHealth <= 0) {
    document.querySelector("#combatLog").innerText = "You defeated the monster!";
  }
}

function getMonsterAttackValue(level) {
  const hit = (level * 5) - (Math.floor(Math.random() * xp));
  console.log(hit);
  return hit > 0 ? hit : 0;
}

function isMonsterHit() {
  return Math.random() > .2 || health < 20;
}

function dodge() {
  text.innerText = "You dodge the attack from the " + monsters[fighting].name;
}

function defeatMonster() {
  gold += Math.floor(monsters[fighting].level * 6.7);
  xp += monsters[fighting].level;
  goldText.innerText = gold;
  xpText.innerText = xp;
  update(locations[4]);
}

function lose() {
  update(locations[5]);
}

function winGame() {
  update(locations[6]);
}

function restart() {
  healthBar.max = 100;
  xp = 0;
  health = 100;
  gold = 50;
  currentWeapon = 0;
  inventory = ["stick"];
  goldText.innerText = gold;
  healthText.innerText = health;
  healthBar.value = health;
  xpText.innerText = xp;
  goTown();
}

function easterEgg() {
  update(locations[7]);
}

function pickTwo() {
  pick(2);
}

function pickEight() {
  pick(8);
}

function pick(guess) {
  const numbers = [];
  while (numbers.length < 10) {
    numbers.push(Math.floor(Math.random() * 11));
  }
  text.innerText = "You picked " + guess + ". Here are the random numbers:\n";
  for (let i = 0; i < 10; i++) {
    text.innerText += numbers[i] + "\n";
  }
  if (numbers.includes(guess)) {
    text.innerText += "Right! You win 20 gold!";
    gold += 20;
    goldText.innerText = gold;
  } else {
    text.innerText += "Wrong! You lose 10 health!";
    health -= 10;
    healthText.innerText = health;
    if (health <= 0) {
      lose();
    }
  }
}*/