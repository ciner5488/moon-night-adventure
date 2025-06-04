class Game {
  constructor() {
    this.animationId = null;
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = 800;
    this.canvas.height = 600;

    this.projectileSprites = {};
    this.cloudSprites = {};
    this.characterSprites = {};
    this.birdSprites = {};
    this.healthBarImages = {};
    this.backgroundImage = null;

    this.health = 100;
    this.timer = 200000;
    this.startTime = null;

    this.moonGirl = {
      x: 100,
      y: 400,
      width: 80,
      height: 80,
      isDead: false,
      isCarriedAway: false,
      velocityY: 0,
      velocityX: 0
    };

    this.projectiles = [];
    this.clouds = [];
    this.move = { left: false, right: false, up: false, down: false };
    this.moveSpeed = 4;

    this.spriteTimer = 0;
    this.spriteIndex = 0;
    this.lastCloudTime = 0;
    this.invincibleTime = 0;
    this.cloakTime = 0;
    this.slowTime = 0;
    this.fastTime = 0;
    this.ghostTime = 0;
    this.shrinkTime = 0;
    this.fallTimer = 0;

    this.backgroundX = 0;
    this.winImageTimer = 0;

    this.throwMap = {
      redqueen: "cloud-red-queen-rose.png",
      whitequeen: "cloud-white-queen-rose.png",
      hatter: "cloud-hatter-hat.png",
      cat: "cloud-cat-ball.png",
      rabbit: "cloud-rabit-watch.png",
      playingcards: "cloud-playing-cards-1.png"
    };

    this.gameState = {
      isRunning: false,
      isGameOver: false,
      isWin: false
    };

    this.winImages = [
      this.loadImage("Passed-1.png"),
      this.loadImage("Passed-2.png")
    ];

    this.setupEventListeners();
    this.loadResources();
  }

  loadImage(src) {
    const img = new Image();
    img.src = `assets/${src}`;
    return img;
  }

  loadResources() {
    const characterSet = {
      float1: "moon-girl-float1.png",
      float2: "moon-girl-float2.png",
      collision: "moon-girl-collision.png",
      broken: "moon-girl-broken.png",
      fall: "moon-girl-fall.png",
      magic: "moon-girl-magic.png",
      ghost: "moon-girl-ghost.png",
      small1: "moon-girl-small1.png",
      small2: "moon-girl-small2.png",
      bigBroken: "moon-girl-big-broken.png",
      bigFall: "moon-girl-big-fall.png"
    };

    for (let key in characterSet) {
      this.characterSprites[key] = this.loadImage(characterSet[key]);
    }

    this.birdSprites = {
      normal1: this.loadImage("bird-fly-1.png"),
      normal2: this.loadImage("bird-fly-2.png")
    };

    this.backgroundImage = this.loadImage("background-loop.png");

    const cloudList = [
      { key: "gray", image: "cloud-gray.png" },
      { key: "beige", image: "cloud-beige.png" },
      { key: "cat", image: "cloud-cat.png" },
      { key: "hatter", image: "cloud-hatter.png" },
      { key: "playingcards", image: "cloud-playing-cards.png" },
      { key: "rabbit", image: "cloud-rabbit.png" },
      { key: "redqueen", image: "cloud-red-queen.png" },
      { key: "whitequeen", image: "cloud-white-queen.png" }
    ];

    cloudList.forEach(({ key, image }) => {
      this.cloudSprites[key] = this.loadImage(image);
    });

    Object.values(this.throwMap).forEach(filename => {
      this.projectileSprites[filename] = this.loadImage(filename);
    });

    for (let i = 0; i <= 5; i++) {
      const name = i === 0 ? "blood.png" : `blood-${i}.png`;
      this.healthBarImages[i] = this.loadImage(name);
    }

    this.startGame();
  }

  setupEventListeners() {
    document.addEventListener("keydown", e => {
      switch (e.code) {
        case "ArrowLeft": this.move.left = true; break;
        case "ArrowRight": this.move.right = true; break;
        case "ArrowUp": this.move.up = true; break;
        case "ArrowDown": this.move.down = true; break;
        case "KeyR":
          if (this.gameState.isGameOver || this.gameState.isWin) this.startGame();
          break;
      }
    });

    document.addEventListener("keyup", e => {
      switch (e.code) {
        case "ArrowLeft": this.move.left = false; break;
        case "ArrowRight": this.move.right = false; break;
        case "ArrowUp": this.move.up = false; break;
        case "ArrowDown": this.move.down = false; break;
      }
    });
  }
  startGame() {
    // ✅ 修正動畫重啟加速問題：先取消前一個 animationFrame
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.health = 100;
    this.timer = 200000;
    this.startTime = Date.now();

    this.moonGirl = {
      x: 100,
      y: 400,
      width: 80,
      height: 80,
      isDead: false,
      isCarriedAway: false,
      velocityY: 0,
      velocityX: 0
    };

    this.projectiles = [];
    this.clouds = [];
    this.spriteTimer = 0;
    this.spriteIndex = 0;
    this.cloakTime = 0;
    this.invincibleTime = 1000;
    this.ghostTime = 0;
    this.slowTime = 0;
    this.fastTime = 0;
    this.shrinkTime = 0;
    this.fallTimer = 0;
    this.winImageTimer = 0;

    this.gameState = {
      isRunning: true,
      isGameOver: false,
      isWin: false
    };

    // ✅ 正確儲存 animationId
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  spawnProjectile(type, x, y) {
    const img = this.projectileSprites[type];
    if (!img) return;
    const angle = Math.random() * 1.5 * Math.PI;
    const speed = 2 + Math.random() * 1.5;
    this.projectiles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      img, size: 40, type
    });
  }

  checkCollision(a, b) {
    return (
      a.x < b.x + b.size &&
      a.x + a.width > b.x &&
      a.y < b.y + b.size &&
      a.y + a.height > b.y
    );
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    this.timer = Math.max(0, 200000 - elapsed);

    this.backgroundX -= 1;
    if (this.backgroundImage?.width > 0) {
      if (this.backgroundX <= -this.backgroundImage.width) {
        this.backgroundX = 0;
      }
    }

    const now = Date.now();
    const cloudInterval = this.slowTime > 0 ? 1800 : this.fastTime > 0 ? 600 : 1000;
    if (now - this.lastCloudTime > cloudInterval && !this.moonGirl.isDead && !this.moonGirl.isCarriedAway) {
      const keys = Object.keys(this.cloudSprites);
      const name = keys[Math.floor(Math.random() * keys.length)];
      const sprite = this.cloudSprites[name];
      this.clouds.push({
        x: this.canvas.width,
        y: Math.random() * 750,
        cx: 2,
        sprite,
        name
      });

      if (this.throwMap[name]) {
        this.spawnProjectile(this.throwMap[name], this.canvas.width, 100 + Math.random() * 300);
      }
      this.lastCloudTime = now;
    }

    if (!this.moonGirl.isDead && !this.moonGirl.isCarriedAway) {
      if (this.move.left) this.moonGirl.x -= this.moveSpeed;
      if (this.move.right) this.moonGirl.x += this.moveSpeed;
      if (this.move.up) this.moonGirl.y -= this.moveSpeed;
      if (this.move.down) this.moonGirl.y += this.moveSpeed;
    }

    this.clouds.forEach(cloud => {
      if (!this.moonGirl.isDead && this.invincibleTime <= 0 && this.ghostTime <= 0 &&
          this.checkCollision(this.moonGirl, { x: cloud.x, y: cloud.y, size: 80 })) {
        this.health = Math.max(0, this.health - 20);
        this.invincibleTime = 800;
        if (this.health <= 0) {
          this.moonGirl.isDead = true;
          this.moonGirl.velocityY = 3;
        }
      }
    });

    this.projectiles = this.projectiles.filter(p => {
    if (!this.moonGirl.isDead && this.checkCollision(this.moonGirl, p)) {
  const immuneTypes = [
    "cloud-red-queen-rose.png",
    "cloud-playing-cards-1.png",
    "cloud-cat-ball.png",
    "cloud-rabit-watch.png"
  ];

  // 只有這四種在 cloakTime 時免疫
  if (this.cloakTime > 0 && immuneTypes.includes(p.type)) return false;

  switch (p.type) {
    case "cloud-hatter-hat.png":
      this.slowTime = 3000;
      this.cloakTime = 15000;
      break;
    case "cloud-cat-ball.png":
      this.ghostTime = 3000;
      break;
    case "cloud-rabit-watch.png":
      this.fastTime = 3000;
      break;
    case "cloud-white-queen-rose.png":
      this.health = Math.min(100, this.health + 20);
      break;
    case "cloud-red-queen-rose.png":
      this.health = 0;
      this.moonGirl.isDead = true;
      this.moonGirl.velocityY = 3;
      break;
    case "cloud-playing-cards-1.png":
      this.health = 0;
      this.shrinkTime = 3000;
      this.moonGirl.isCarriedAway = true;
      this.moonGirl.velocityX = -3;
      break;
  }
  return false;
}
      return true;
    });

    if (this.ghostTime > 0) {
      this.clouds = this.clouds.filter(c => !this.checkCollision(this.moonGirl, { x: c.x, y: c.y, size: 80 }));
    }

    if (this.invincibleTime > 0) this.invincibleTime -= 16;
    if (this.cloakTime > 0) this.cloakTime -= 16;
    if (this.slowTime > 0) this.slowTime -= 16;
    if (this.fastTime > 0) this.fastTime -= 16;
    if (this.ghostTime > 0) this.ghostTime -= 16;
    if (this.shrinkTime > 0) this.shrinkTime -= 16;

    this.clouds.forEach(c => {
      const speedMultiplier = this.fastTime > 0 ? 2 : 1;
      c.x -= c.cx * speedMultiplier;
    });

    this.clouds = this.clouds.filter(c => c.x + 80 > 0);
    this.projectiles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
    });

    if (this.moonGirl.isDead) {
      this.moonGirl.y += this.moonGirl.velocityY;
      if (this.moonGirl.y > this.canvas.height) {
        this.gameState.isGameOver = true;
        this.gameState.isRunning = false;
      }
    }

    if (this.moonGirl.isCarriedAway) {
      this.moonGirl.x += this.moonGirl.velocityX;
      if (this.moonGirl.x + this.moonGirl.width < 0) {
        this.gameState.isGameOver = true;
        this.gameState.isRunning = false;
      }
    }

    if (this.timer <= 0 && !this.moonGirl.isDead && !this.moonGirl.isCarriedAway) {
      this.gameState.isRunning = false;
      this.gameState.isWin = true;
    }
  }
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.backgroundImage?.complete) {
      this.ctx.drawImage(this.backgroundImage, this.backgroundX, 0);
      this.ctx.drawImage(this.backgroundImage, this.backgroundX + this.backgroundImage.width, 0);
    }

    this.clouds.forEach(c => {
      if (c.sprite.complete) this.ctx.drawImage(c.sprite, c.x, c.y, 80, 80);
    });

    this.projectiles.forEach(p => {
      if (p.img.complete) this.ctx.drawImage(p.img, p.x, p.y, p.size, p.size);
    });

    // 主角動畫邏輯
    let sprite;
    let shouldDraw = true;

    if (this.moonGirl.isCarriedAway) {
      sprite = this.spriteIndex === 0 ? this.characterSprites.small1 : this.characterSprites.small2;
    } else if (this.moonGirl.isDead) {
      sprite = this.moonGirl.velocityY > 1 ? this.characterSprites.bigFall : this.characterSprites.bigBroken;
    } else if (this.shrinkTime > 0) {
      sprite = this.spriteIndex === 0 ? this.characterSprites.small1 : this.characterSprites.small2;
    } else if (this.ghostTime > 0) {
      sprite = this.characterSprites.ghost;
    } else if (this.cloakTime > 0 || this.slowTime > 0) {
      sprite = this.characterSprites.magic;
    } else if (this.invincibleTime > 0) {
      sprite = this.characterSprites.collision;
      shouldDraw = Math.floor(Date.now() / 100) % 2 === 0;
    } else {
      sprite = this.spriteIndex === 0 ? this.characterSprites.float1 : this.characterSprites.float2;
    }

    if (shouldDraw && sprite?.complete) {
      this.ctx.drawImage(sprite, this.moonGirl.x, this.moonGirl.y, this.moonGirl.width, this.moonGirl.height);
    }

    // 血條圖示
    const healthIndex = Math.min(5, 5 - Math.floor(this.health / 20));
    const bloodImg = this.healthBarImages[healthIndex];
    if (bloodImg?.complete) {
      this.ctx.drawImage(bloodImg, 10, 10, 400, 100);
    }

    // 時間顯示
    const timeElem = document.getElementById("highHealth");
    if (timeElem) timeElem.textContent = Math.floor(this.timer / 1000);

    // 通關動畫
    if (this.gameState.isWin) {
      const winImg = this.winImages[Math.floor(this.winImageTimer / 30) % 2];
      if (winImg?.complete) {
        this.ctx.drawImage(winImg, this.canvas.width / 2 - 140, this.canvas.height / 2 - 170, 300, 300);
      }
      this.winImageTimer++;
    }

    // 結束提示
    if (this.gameState.isGameOver || this.gameState.isWin) {
      this.ctx.font = "28px Arial";
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = "#000";
      this.ctx.strokeText("遊戲結束 - 按 R 重新開始", this.canvas.width / 2 - 150, this.canvas.height - 40);
      this.ctx.fillStyle = "#fff";
      this.ctx.fillText("遊戲結束 - 按 R 重新開始", this.canvas.width / 2 - 150, this.canvas.height - 40);
    }

    // 動畫切換
    this.spriteTimer++;
    if (this.spriteTimer > 20) {
      this.spriteIndex = (this.spriteIndex + 1) % 2;
      this.spriteTimer = 0;
    }
  }

  gameLoop() {
    if (this.gameState.isRunning) {
      this.update();
    } else if (this.gameState.isWin) {
      this.winImageTimer++;
    }

    this.draw();
    // ✅ 修正：將 animationId 存下來，以便後續 cancel
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }
} // ← class Game 結尾，別漏掉

// 啟動遊戲
window.addEventListener("load", () => {
  new Game();
});