// Game State
let gameState = {
  level: 1,
  totalXp: 0,
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  gold: 50,
  currentWeapon: 0,
  inventory: ["stick"],
  fighting: null,
  monsterHealth: 0,
  shieldActive: false,
  magicUnlocked: false,
  monsterDefeated: false,
  powerStrikeCooldown: 0,
  actionInProgress: false,
};

gameState.difficulty = "normal";

// Difficulty multipliers: used for scaling monster health, xp, gold and attack.
const difficultyMultipliers = {
  easy: 0.8,
  normal: 1,
  hard: 1.5
};

function getDifficultyMultiplier() {
  return difficultyMultipliers[gameState.difficulty] || 1;
}

// Call to set difficulty. You can replace this prompt with a UI control if you want.
function chooseDifficultyPrompt() {
  const choice = prompt("Choose difficulty: easy, normal, hard", gameState.difficulty || "normal");
  const valid = ["easy", "normal", "hard"];
  gameState.difficulty = valid.includes(choice) ? choice : "normal";
  document.getElementById("text").innerHTML = `Difficulty set to: ${gameState.difficulty}`;
}

// Optional: nicer setter for UI buttons
function setDifficulty(d) {
  const valid = ["easy", "normal", "hard"];
  gameState.difficulty = valid.includes(d) ? d : "normal";
  document.getElementById("text").innerHTML = `Difficulty set to: ${gameState.difficulty}`;
}
chooseDifficultyPrompt();

// Game Data
const weapons = [
  { name: "stick", power: 8, durability: 100 },
  { name: "dagger", power: 25, durability: 90 },
  { name: "hammer", power: 50, durability: 70 },
  { name: "sword", power: 100, durability: 50 },
  { name: "magic blade", power: 150, durability: 60 },
];

const monsters = [
  { name: "slime", level: 1, health: 20, xp: 15, gold: 15 },
  { name: "goblin", level: 2, health: 35, xp: 25, gold: 25 },
  { name: "orc", level: 4, health: 60, xp: 40, gold: 30 },
  { name: "beast", level: 6, health: 90, xp: 60, gold: 50 },
  { name: "wizard", level: 10, health: 150, xp: 100, gold: 80 },
  { name: "dragon", level: 15, health: 300, xp: 200, gold: 200 },
];

const locations = [
  {
    name: "town",
    buttonText: ["Go to Store", "Go to Cave", "Go to Forest"],
    buttonFunctions: [goStore, goCave, goForest],
    text: "Town square. Choose your path: store, cave, or mystical forest.",
  },
  {
    name: "store",
    buttonText: ["Health (15g)", "Weapon (50g)", "Mana (20g)", "Back to Town"],
    buttonFunctions: [buyHealth, buyWeapon, buyMana, goTown], 
    text: "Welcome to the store! What would you like to buy?",
  },
  {
    name: "cave",
    buttonText: ["Fight Slime", "Fight Goblin", "Fight Orc", "Back to Town"],
    buttonFunctions: [
      () => fightMonster(0),
      () => fightMonster(1),
      () => fightMonster(2),
      goTown 
    ],
    text: "Dark cave with weak monsters. Good for beginners.",
  },
  {
    name: "forest",
    buttonText: ["Fight Beast", "Fight Wizard", "Fight Dragon", "Back to Town"],
    buttonFunctions: [
      () => fightMonster(3),
      () => fightMonster(4),
      () => fightMonster(5),
      goTown 
    ],
    text: "Mystical forest with powerful creatures. Danger awaits!",
  },
  {
    name: "fight",
    buttonText: ["Attack", "Defend", "Run"],
    buttonFunctions: [attack, defend, flee],
    text: "Combat! Choose wisely.",
  },
];

function chooseDifficulty() {
  const choice = prompt("Choose difficulty: easy, normal, hard", "normal");
  const validChoices = ["easy", "normal", "hard"];
  gameState.difficulty = validChoices.includes(choice) ? choice : "normal";
  document.getElementById("text").innerHTML =
    `Difficulty set to: ${gameState.difficulty}`;
}
chooseDifficulty(); // Call when the game loads

function scaleMonsterStats(monster) {
  const multipliers = {
    easy: 0.8,
    normal: 1,
    hard: 1.5
  };
  const m = multipliers[gameState.difficulty] || 1;

  return {
    ...monster,
    health: Math.floor(monster.health * m),
    xp: Math.floor(monster.xp * m),
    gold: Math.floor(monster.gold * m)
  };
}

// UI Functions
function updateUI() {
  document.getElementById("levelDisplay").innerText = gameState.level;
  document.getElementById("levelText").innerText = gameState.level;
  document.getElementById("xpText").innerText = gameState.totalXp;
  document.getElementById("xpNeeded").innerText = getXpNeeded();
  document.getElementById("healthText").innerText = gameState.health;
  document.getElementById("maxHealthText").innerText = gameState.maxHealth;
  document.getElementById("manaText").innerText = gameState.mana;
  document.getElementById("maxManaText").innerText = gameState.maxMana;
  document.getElementById("goldText").innerText = gameState.gold;
  document.getElementById("weaponText").innerText =
    weapons[gameState.currentWeapon].name;

  // Progress bars
  document.getElementById("healthBar").style.width =
    (gameState.health / gameState.maxHealth) * 100 + "%";
  document.getElementById("manaBar").style.width =
    (gameState.mana / gameState.maxMana) * 100 + "%";
  document.getElementById("xpBar").style.width =
    Math.min((gameState.totalXp / getXpNeeded()) * 100, 100) + "%";

  // Magic unlock
  /*if (gameState.magicUnlocked) {
    document.getElementById("spellControls").style.display = "grid";
  }*/
}

function logCombat(message, type) {
  const log = document.getElementById("combatLog");
  const entry = document.createElement("div");
  entry.textContent = message;

  switch (type) {
    case "damage":
      entry.classList.add("log-damage");
      break;
    case "heal":
      entry.classList.add("log-heal");
      break;
    case "miss":
      entry.classList.add("log-miss", "miss-effect");
      break;
    case "critical":
      entry.classList.add("log-critical", "crit-effect");
      break;
  }

  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;

  // Remove animation class after it plays
  if (type === "miss" || type === "critical") {
    setTimeout(() => {
      entry.classList.remove("miss-effect", "crit-effect");
    }, 500);
  }
}

function update(location) {
  document.getElementById("monsterStats").style.display = "none";
  
  // FIXED: Hide confirm controls when changing locations
  document.getElementById("confirmControls").style.display = "none";
  pendingWeaponIndex = null;
  
  // Reset all buttons to default state
  for (let i = 1; i <= 4; i++) {
    const button = document.getElementById(`button${i}`);
    if (button) {
      button.style.display = 'block';
      button.className = "btn btn-primary";
      button.disabled = false;
    }
  }
  
  // Hide the 4th button for town and fight locations
  if (location.name === "town" || location.name === "fight") {
    document.getElementById("button4").style.display = 'none';
  }
  
  // Hide or show spell buttons just like confirm/cancel
  const spellControls = document.getElementById("spellControls");

  if (location.name === "fight" && gameState.magicUnlocked) {
    // Show only during combat AND after magic is unlocked
    spellControls.style.display = "grid";
  } else {
    // Hide everywhere else
    spellControls.style.display = "none";
  }

  
  // Set button text and functions
  for (let i = 0; i < location.buttonText.length; i++) {
    const button = document.getElementById(`button${i+1}`);
    if (button) {
      button.innerText = location.buttonText[i];
      button.onclick = location.buttonFunctions[i];
      
      if (location.buttonText[i] === "Back to Town") {
        button.className = "btn btn-secondary";
      }
    }
  }
  
  document.getElementById("text").innerHTML = location.text;
  updateUI();
}

/*function update(location) {

  document.getElementById("monsterStats").style.display = "none";
  
  // Reset all buttons to default state
  for (let i = 1; i <= 4; i++) {
    const button = document.getElementById(`button${i}`);
    if (button) {
      button.style.display = 'block';
      button.className = "btn btn-primary";
      button.disabled = false; // NEW: Enable buttons by default
    }
  }
  
  // Hide the 4th button for town and fight locations
  if (location.name === "town" || location.name === "fight") {
    document.getElementById("button4").style.display = 'none';
  }
  
  // NEW: Hide spell buttons when not in combat
  if (location.name !== "fight") {
    document.getElementById("spellControls").style.display = "none";
  } else if (gameState.magicUnlocked) {
    // Show spell buttons only during combat if magic is unlocked
    document.getElementById("spellControls").style.display = "grid";
  }
  
  // Set button text and functions
  for (let i = 0; i < location.buttonText.length; i++) {
    const button = document.getElementById(`button${i+1}`);
    if (button) {
      button.innerText = location.buttonText[i];
      button.onclick = location.buttonFunctions[i];
      
      // Style the "Back to Town" button differently
      if (location.buttonText[i] === "Back to Town") {
        button.className = "btn btn-secondary";
      }
    }
  }
  
  document.getElementById("text").innerHTML = location.text;
  updateUI();
}*/

// Navigation
function goTown() {
  update(locations[0]);
}
function goStore() {
  update(locations[1]);
}
function goCave() {
  update(locations[2]);
}
function goForest() {
  update(locations[3]);
}

// Store
function buyHealth() {
  if (gameState.gold >= 15) {
    const heal = Math.min(25, gameState.maxHealth - gameState.health);
    if (heal > 0) {
      gameState.gold -= 15;
      gameState.health += heal;
      updateUI();
      document.getElementById("text").innerHTML = `Restored ${heal} health!`;
    } else {
      document.getElementById("text").innerHTML = "Health already full!";
    }
  } else {
    document.getElementById("text").innerHTML = "Not enough gold!";
  }
  setTimeout(() => goStore(), 1000);
}

// --- Confirm & Cancel Buttons for Weapon Purchase ---
document.getElementById("confirmBuy").addEventListener("click", () => {
  if (pendingWeaponIndex !== null) {
    const weapon = weapons[pendingWeaponIndex];
    gameState.gold -= 50;
    gameState.currentWeapon = pendingWeaponIndex;
    gameState.inventory.push(weapon.name);
    weapon.durability = weapon.durability || 100;

    updateUI();
    document.getElementById("text").innerHTML =
      `Bought ${weapon.name}! Inventory: ${gameState.inventory.join(", ")}`;

    document.getElementById("confirmControls").style.display = "none";
    pendingWeaponIndex = null;
    setTimeout(() => goStore(), 1000);
  }
});
document.getElementById("cancelBuy").addEventListener("click", () => {
  document.getElementById("text").innerHTML = "Purchase canceled.";
  document.getElementById("confirmControls").style.display = "none";
  pendingWeaponIndex = null;
});

let pendingWeaponIndex = null; // store which weapon is being previewed

function buyWeapon() {
  if (gameState.currentWeapon < weapons.length - 1) {
    const nextWeapon = weapons[gameState.currentWeapon + 1];

    if (gameState.gold >= 50) {
      pendingWeaponIndex = gameState.currentWeapon + 1;

      document.getElementById("text").innerHTML =
        `Buy <b>${nextWeapon.name}</b> for 50 gold?<br>
         🗡 Power: ${nextWeapon.power}<br>
         🛡 Durability: ${nextWeapon.durability}`;

      // Show confirm buttons
      document.getElementById("confirmControls").style.display = "block";
    } else {
      document.getElementById("text").innerHTML = "Not enough gold!";
    }
  } else {
    document.getElementById("text").innerHTML = "Already have the best weapon!";
  }
}

function buyMana() {
  if (gameState.gold >= 20) {
    const mana = Math.min(30, gameState.maxMana - gameState.mana);
    if (mana > 0) {
      gameState.gold -= 20;
      gameState.mana += mana;
      updateUI();
      document.getElementById("text").innerHTML = `Restored ${mana} mana!`;
    } else {
      document.getElementById("text").innerHTML = "Mana already full!";
    }
  } else {
    document.getElementById("text").innerHTML = "Not enough gold!";
  }
  setTimeout(() => goStore(), 1000);
}

// Combat
function fightMonster(index) {
  // Prepare scaled enemy and store it on gameState
  const base = monsters[index];
  const scaled = scaleMonsterStats(base);
  gameState.currentEnemy = scaled;
  gameState.fighting = index;
  gameState.monsterHealth = scaled.health;
  gameState.monsterDefeated = false;

  // Update UI
  update(locations[4]);

  document.getElementById("monsterStats").style.display = "block";
  document.getElementById("monsterName").innerText = scaled.name.toUpperCase();
  document.getElementById("monsterHealthText").innerText = scaled.health;
  document.getElementById("monsterMaxHealthText").innerText = scaled.health;
  document.getElementById("monsterLevel").innerText = scaled.level;
  document.getElementById("monsterHealthBar").style.width = "100%";

  logCombat(`${scaled.name} (Level ${scaled.level}) appears!`);

  disableCombatButtons(false);
  enableSpellButtonsIfUnlocked();

  // Power strike availability (honor cooldown & mana)
  document.getElementById("powerStrikeBtn").disabled =
    gameState.powerStrikeCooldown > 0 || gameState.mana < 5;

  // Show spells only if unlocked
  if (gameState.magicUnlocked) {
    document.getElementById("spellControls").style.display = "block";
    enableSpellButtonsIfUnlocked();
  } else {
    document.getElementById("spellControls").style.display = "none";
  }

  updateCombat();
}

/*function fightMonster(index) {
  document.getElementById("powerStrikeBtn").disabled = gameState.mana < 5;
  gameState.fighting = index;
  const monster = monsters[index];
  gameState.monsterHealth = monster.health;
  gameState.monsterDefeated = false;

  update(locations[4]);

  document.getElementById("monsterStats").style.display = "block";
  document.getElementById("monsterName").innerText = monster.name.toUpperCase();
  document.getElementById("monsterHealthText").innerText = monster.health;
  document.getElementById("monsterMaxHealthText").innerText = monster.health;
  document.getElementById("monsterLevel").innerText = monster.level;
  document.getElementById("monsterHealthBar").style.width = "100%";

  logCombat(`${monster.name} (Level ${monster.level}) appears!`);

  disableCombatButtons(false);
  enableSpellButtonsIfUnlocked();

  // ✅ Disable Power Strike if on cooldown or lacking mana
  document.getElementById("powerStrikeBtn").disabled =
    gameState.powerStrikeCooldown > 0 || gameState.mana < 5;

  // ✅ Hide or show spells based on unlock status
  if (gameState.magicUnlocked) {
    document.getElementById("spellControls").style.display = "block";
    enableSpellButtonsIfUnlocked();
  } else {
    document.getElementById("spellControls").style.display = "none";
  }
  
  updateCombat();
}*/

function attack() {
  if (gameState.actionInProgress) {
    return; // Prevent overlapping actions
  }

  gameState.actionInProgress = true;
  disableCombatButtons(true);

  const monster = monsters[gameState.fighting];
  const weapon = weapons[gameState.currentWeapon];

  // --- Monster attacks first ---
  let monsterDamage = getMonsterAttackValue(monster.level);

  // Check shield
  if (gameState.shieldActive) {
    monsterDamage = Math.floor(monsterDamage * 0.3); // block 70%
    gameState.shieldActive = false; // consume shield
    logCombat("🛡️ Shield absorbs most of the damage!", "heal");
  }

  gameState.health -= monsterDamage;

  if (monsterDamage > 0) {
    logCombat(`The ${monster.name} hits you for ${monsterDamage}!`, "damage");
  } else {
    logCombat(`The ${monster.name} misses!`, "miss");
  }


  // --- Player attacks ---
  if (isMonsterHit()) {
    let playerDamage = weapon.power + Math.floor(Math.random() * gameState.level) + 1;

    if (Math.random() < 0.15) { // 15% crit chance
      playerDamage *= 2;
      logCombat(`💥 Critical hit! ${playerDamage} damage!`, "critical");
    } else {
      logCombat(`You strike with your ${weapon.name} for ${playerDamage} damage!`);
    }

    gameState.monsterHealth -= playerDamage;
  } else {
    logCombat("You miss your attack!", "miss");
  }

  // --- Weapon durability (10% chance to break) ---
  if (Math.random() <= 0.1 && gameState.inventory.length > 1) {
    const broken = gameState.inventory.pop();
    gameState.currentWeapon = Math.max(0, gameState.currentWeapon - 1);
    logCombat(`💔 Your ${broken} breaks!`, "damage");
  }

  // --- Update UI ---
  updateCombat();

  // Reduce Power Strike cooldown if active
  if (gameState.powerStrikeCooldown > 0) {
    gameState.powerStrikeCooldown--;
  }

  // Enable or disable the Power Strike button
  document.getElementById("powerStrikeBtn").disabled =
    gameState.powerStrikeCooldown > 0 || gameState.mana < 5;

  setTimeout(() => {
    gameState.actionInProgress = false;
    if (gameState.health > 0 && gameState.monsterHealth > 0) {
      disableCombatButtons(false);
    }
  }, 800);
}

// --- Special Attack: Power Strike ---
function powerStrike() {
  if (gameState.actionInProgress) {
    return; // Prevent overlapping actions
  }

  // Cannot use if on cooldown
  if (gameState.powerStrikeCooldown > 0) {
    logCombat(`⏳ Power Strike on cooldown (${gameState.powerStrikeCooldown} turn(s))`, "damage");
    return;
  }

  // Mana cost
  const manaCost = 5;
  if (gameState.mana < manaCost) {
    logCombat("❌ Not enough mana for Power Strike!", "damage");
    return;
  }

  const monster = monsters[gameState.fighting];
  const weapon = weapons[gameState.currentWeapon];

  // Spend mana and apply cooldown
  gameState.mana -= manaCost;
  gameState.powerStrikeCooldown = 3; // 3-turn cooldown

  // Big damage (2× weapon power + small random bonus)
  let damage = (weapon.power * 2) + Math.floor(Math.random() * gameState.level);
  gameState.monsterHealth -= damage;

  logCombat(`💥 POWER STRIKE! You deal ${damage} damage!`, "critical");

  // Monster retaliates
  const monsterDamage = getMonsterAttackValue(monster.level);
  gameState.health -= monsterDamage;
  if (monsterDamage > 0) {
    logCombat(`${monster.name} counters for ${monsterDamage}!`, "damage");
  }

  // Update UI and combat
  updateCombat();
}

function monsterAttack() {
  const monster = monsters[gameState.fighting];
  const damage = getMonsterAttackValue(monster.level);
  gameState.health -= damage;
  logCombat(`${monster.name} attacks for ${damage} damage!`, "damage");
  updateCombat();
}

// Returns integer damage a monster deals based on its level and player level.
// Scales with monster level, but has a random reduction based on player level so higher player level reduces incoming damage somewhat.
function getMonsterAttackValue(level) {
  const baseAttack = level * 5;  // baseline damage per monster level
  const multiplier = getDifficultyMultiplier();
  const scaledBase = Math.floor(baseAttack * multiplier);
  const playerReduction = Math.floor(Math.random() * Math.max(1, gameState.level));
  const hit = scaledBase - playerReduction;
  return hit > 0 ? hit : 0;
}

/*function getMonsterAttackValue(level) {
  const baseAttack = level * 5;  // baseline damage per monster level
  const playerReduction = Math.floor(Math.random() * gameState.level); // randomness based on player level
  const hit = baseAttack - playerReduction;
  return hit > 0 ? hit : 0; // never negative
}*/

// Returns true if player's attack hits. 80% base hit chance,
// but guarantees hits when player is in danger (low health).
function isMonsterHit() {
  const baseHitChance = 0.8;   // 80% base chance to hit
  // Make hitting a bit easier when player is desperate:
  const desperationBonus = gameState.health < (gameState.maxHealth * 0.2) ? 0.15 : 0;
  return Math.random() < (baseHitChance + desperationBonus);
}

// Create a scaled copy of a monster according to difficulty (does NOT mutate base monster).
function scaleMonsterStats(monster) {
  const m = getDifficultyMultiplier();
  return {
    ...monster,
    health: Math.max(1, Math.floor(monster.health * m)),
    xp: Math.max(1, Math.floor(monster.xp * m)),
    gold: Math.max(0, Math.floor(monster.gold * m))
  };
}

function defend() {
  if (gameState.actionInProgress) {
    return; // Prevent overlapping actions
  }

  const monster = monsters[gameState.fighting];
  const damage = Math.floor(monster.level * 1.5);
  gameState.health -= damage;
  gameState.mana = Math.min(gameState.mana + 5, gameState.maxMana);
  logCombat(`Defend! Take ${damage} damage, gain 5 mana`, "heal");
  updateCombat();
  if (gameState.powerStrikeCooldown > 0) {
    gameState.powerStrikeCooldown--;
  }
  document.getElementById("powerStrikeBtn").disabled =
    gameState.powerStrikeCooldown > 0 || gameState.mana < 5;
  
  setTimeout(() => {
    gameState.actionInProgress = false;
    if (gameState.health > 0 && gameState.monsterHealth > 0) {
      disableCombatButtons(false);
    }
  }, 800);
}

function flee() {
  // Attempt to escape
  const escapeChance = Math.random();
  if (escapeChance < 0.5) {
    logCombat("You couldn't escape!", "damage");
    monsterAttack();
    return;
  }

  // ✅ Successful escape — reset everything
  gameState.powerStrikeCooldown = 0; // reset Power Strike cooldown
  disableCombatButtons(true);

  // ✅ Hide spells to avoid using them in town
  document.getElementById("spellControls").style.display = "none";

  logCombat("You fled back to town!", "damage");
  setTimeout(() => goTown(), 800);
}

function updateCombat() {
  const monster = gameState.currentEnemy || monsters[gameState.fighting] || {health:1};
  document.getElementById("healthText").innerText = Math.max(0, gameState.health);
  document.getElementById("healthBar").style.width =
    Math.max(0, gameState.health / gameState.maxHealth) * 100 + "%";
  document.getElementById("monsterHealthText").innerText = Math.max(0, gameState.monsterHealth);
  // use the scaled monster's max health for the bar
  document.getElementById("monsterHealthBar").style.width =
    Math.max(0, gameState.monsterHealth / monster.health) * 100 + "%";
  document.getElementById("manaText").innerText = gameState.mana;
  document.getElementById("manaBar").style.width =
    (gameState.mana / gameState.maxMana) * 100 + "%";

  if (gameState.health <= 0) {
    defeat();
  } else if (gameState.monsterHealth <= 0 && !gameState.monsterDefeated) {
    gameState.monsterDefeated = true;
    victory();
  }
}

/*function updateCombat() {
  const monster = monsters[gameState.fighting];
  document.getElementById("healthText").innerText = Math.max(
    0,
    gameState.health
  );
  document.getElementById("healthBar").style.width =
    Math.max(0, gameState.health / gameState.maxHealth) * 100 + "%";
  document.getElementById("monsterHealthText").innerText = Math.max(
    0,
    gameState.monsterHealth
  );
  document.getElementById("monsterHealthBar").style.width =
    Math.max(0, gameState.monsterHealth / monster.health) * 100 + "%";
  document.getElementById("manaText").innerText = gameState.mana;
  document.getElementById("manaBar").style.width =
    (gameState.mana / gameState.maxMana) * 100 + "%";

  if (gameState.health <= 0) {
    defeat();
  } else if (gameState.monsterHealth <= 0 && !gameState.monsterDefeated) {
    // NEW: Only process victory if monster wasn't already defeated
    gameState.monsterDefeated = true;
    victory();
  }
}*/

function disableCombatButtons(disabled) {
  const combatButtons = document.querySelectorAll('.combat-btn');
  combatButtons.forEach(button => {
    button.disabled = disabled;
  });
}

function hideConfirmButtons() {
  const confirm = document.getElementById("confirmBuy");
  const cancel = document.getElementById("cancelBuy");
  if (confirm) confirm.style.display = "none";
  if (cancel) cancel.style.display = "none";
}

function enableSpellButtonsIfUnlocked() {
  const spellButtons = document.querySelectorAll(".spell-btn");
  spellButtons.forEach(btn => {
    btn.disabled = !gameState.magicUnlocked; // enable only if unlocked
  });
}

function showButtons(ids) {
  document.querySelectorAll(".btn").forEach(btn => btn.style.display = "none");
  ids.forEach(id => document.getElementById(id).style.display = "inline-block");
}

function victory() {
  const monster = gameState.currentEnemy || monsters[gameState.fighting];
  gameState.powerStrikeCooldown = 0;
  disableCombatButtons(true);
  document.getElementById("spellControls").style.display = "none";
  gameState.gold += monster.gold;
  gameState.totalXp += monster.xp;
  logCombat(`Victory! +${monster.xp} XP, +${monster.gold} gold!`, "heal");
  checkLevelUp();

  document.querySelectorAll(".spell-btn").forEach(btn => btn.disabled = true);

  // Dragon special endgame hook
  if (monster.name && monster.name.toLowerCase() === "dragon") {
    handleDragonVictory(); // optional special flow (see below)
  }

  setTimeout(() => {
    gameState.monsterDefeated = false;
    gameState.currentEnemy = null; // clear scaled enemy
    goTown();
  }, 2000);
}

/*function victory() {
  gameState.powerStrikeCooldown = 0; // ✅ reset
  disableCombatButtons(true);
  document.getElementById("spellControls").style.display = "none";
  const monster = monsters[gameState.fighting];
  gameState.gold += monster.gold;
  gameState.totalXp += monster.xp;
  logCombat(`Victory! +${monster.xp} XP, +${monster.gold} gold!`, "heal");
  checkLevelUp();

  disableCombatButtons(true);
  document.querySelectorAll(".spell-btn").forEach(btn => btn.disabled = true); // NEW

  setTimeout(() => {
    gameState.monsterDefeated = false;
    goTown();
  }, 2000);
}*/

function handleDragonVictory() {
  // example: give a special item, show a final message, unlock NG+ etc.
  logCombat("🏆 You have slain the DRAGON! The land is saved.", "heal");

  // Award a unique item (only once)
  if (!gameState.inventory.includes("Dragon Slayer")) {
    gameState.inventory.push("Dragon Slayer");
    logCombat("You obtain the legendary 'Dragon Slayer' trophy!", "magic");
  }

  // Optionally: present final screen / unlock new area / stop normal play
  setTimeout(() => {
    document.getElementById("text").innerHTML = "<b>THE DRAGON IS DEAD.</b><br>Congratulations — you finished the core game!";
    // disable buttons so player reads ending (re-enable with 'Back to Town' or reload)
    document.querySelectorAll(".btn").forEach(b => b.disabled = true);
  }, 400);
}

function defeat() {
  gameState.powerStrikeCooldown = 0; // ✅ reset
  disableCombatButtons(true);
  document.getElementById("spellControls").style.display = "none";
  gameState.health = Math.floor(gameState.maxHealth * 0.5);
  logCombat("Defeated! Respawn with half health. XP preserved!", "damage");

  disableCombatButtons(true);
  document.querySelectorAll(".spell-btn").forEach(btn => btn.disabled = true); // NEW

  setTimeout(goTown, 2000);
}

// Level System
function getXpNeeded() {
  return 100 * gameState.level;
}

function checkLevelUp() {
  while (gameState.totalXp >= getXpNeeded()) {
    gameState.totalXp -= getXpNeeded();
    gameState.level++;
    gameState.maxHealth += 20;
    gameState.health = gameState.maxHealth;
    gameState.maxMana += 10;
    gameState.mana = gameState.maxMana;

    showLevelUp();
    logCombat(`🎉 LEVEL UP! Now Level ${gameState.level}!`, "level");

    if (gameState.level === 3 && !gameState.magicUnlocked) {
      gameState.magicUnlocked = true;
      logCombat("🔮 Magic unlocked!", "magic");
    }
  }
  updateUI();
}

function showLevelUp() {
  const anim = document.createElement("div");
  anim.className = "level-up-animation";
  anim.innerHTML = `🎉 LEVEL UP! 🎉<br>Level ${gameState.level}`;
  document.body.appendChild(anim);
  setTimeout(() => document.body.removeChild(anim), 2000);
}

function breakWeapon() {
  const broken = gameState.inventory[gameState.currentWeapon];
  gameState.inventory.splice(gameState.currentWeapon, 1);
  gameState.currentWeapon = Math.max(0, gameState.currentWeapon - 1);
  logCombat(
    `💔 ${broken} breaks! Now using ${weapons[gameState.currentWeapon].name}`,
    "damage"
  );
  updateUI();
}

// Magic
function castSpell(spell) {
  if (gameState.actionInProgress) {
    return; // Prevent overlapping actions
  }

  if (gameState.monsterDefeated || gameState.health <= 0) {
    logCombat("⚠️ Combat already ended!", "damage");
    return;
  }

  if (gameState.fighting === null || gameState.monsterDefeated) {
    logCombat("You can only cast spells during combat!", "damage");
    return;
  }

  if (!gameState.magicUnlocked) {
    logCombat("Magic not unlocked!", "damage");
    return;
  }

  disableCombatButtons(true);

  let cost = 0;
  let effect = "";

  switch (spell) {
    case "heal":
      cost = 10;
      if (gameState.mana < cost) break;

      gameState.mana -= cost;
      const healAmount = Math.min(
        30 + gameState.level * 5,
        gameState.maxHealth - gameState.health
      );
      gameState.health += healAmount;
      effect = `💚 Healed ${healAmount}!`;
      break;

    case "fireball":
      cost = 15;
      if (gameState.mana < cost) break;

      gameState.mana -= cost;
      const fireDmg = 40 + gameState.level * 10;
      gameState.monsterHealth -= fireDmg;
      effect = `🔥 Fireball deals ${fireDmg}!`;
      break;

    case "lightning":
      cost = 20;
      if (gameState.mana < cost) break;

      gameState.mana -= cost;
      const lightningDmg = 60 + gameState.level * 15;
      gameState.monsterHealth -= lightningDmg;
      effect = `⚡ Lightning deals ${lightningDmg}!`;
      break;

    case "shield":
      cost = 12;
      if (gameState.mana >= cost && gameState.fighting !== null && !gameState.monsterDefeated) {
        gameState.mana -= cost;
        gameState.shieldActive = true;
        effect = "🛡️ Shield activated!";
      }
      break;

  }

  if (effect) {
    logCombat(effect, "magic");
  } else {
    logCombat("❌ Not enough mana!", "damage");
  }

  // Always update UI + combat state after casting
  updateUI();
  updateCombat();

  // Victory check if monster is dead
  if (gameState.monsterHealth <= 0) {
    victory();
    return;
  }

  // Re-enable combat buttons after delay
  setTimeout(() => {
    if (gameState.health > 0 && gameState.monsterHealth > 0) {
      // Still fighting → re-enable
      disableCombatButtons(false);
    } else {
      // Combat ended → make sure buttons are reset properly
      disableCombatButtons(true);
      updateUI(); // refreshes so the main town/cave buttons appear
    }
 }, 800);
  
  if (gameState.powerStrikeCooldown > 0) {
    gameState.powerStrikeCooldown--;
  }
  document.getElementById("powerStrikeBtn").disabled =
    gameState.powerStrikeCooldown > 0 || gameState.mana < 5;

}


// Save/Load
function saveGame() {
  localStorage.setItem("rpgSave", JSON.stringify(gameState));
  logCombat("Game saved!", "heal");
}

function loadGame() {
  const saved = localStorage.getItem("rpgSave");
  if (saved) {
    gameState = { ...gameState, ...JSON.parse(saved) };
    updateUI();
    logCombat("Game loaded!", "heal");
  } else {
    logCombat("No save found!", "damage");
  }
}

function resetProgress() {
  if (confirm("Reset all progress?")) {
    localStorage.removeItem("rpgSave");
    location.reload();
  }
}

// Debug Tools
function debugUnlockMagic() {
  gameState.magicUnlocked = true;
  logCombat("✨ Magic has been unlocked (Debug).", "magic");
  updateUI();
}

function debugMaxStats() {
  gameState.level = 99;
  gameState.maxHealth = 999;
  gameState.health = 999;
  gameState.mana = 999;
  gameState.maxMana = 999;
  gameState.gold = 9999;
  logCombat("💎 Max stats applied (Debug).", "magic");
  updateUI();
}

function debugHeal() {
  gameState.health = gameState.maxHealth;
  logCombat("💚 Healed to full (Debug).", "heal");
  updateUI();
}

function debugTestShield() {
  gameState.shieldActive = true;
  logCombat("🛡️ Shield is active for the next hit (Debug).", "magic");
}

// Initialize
updateUI();
goTown();
