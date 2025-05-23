class SpriteChooser {
  constructor() {
    this.categories = {
      'head': { count: 0, current: 0 },
      'glasses': { count: 0, current: 0 },
      'body': { count: 0, current: 0 },
      'accessory': { count: 0, current: 0 },
      'belowthebelt': { count: 0, current: 0 },
      'shoes': { count: 0, current: 0 }
    };
    
    this.baseUrl = "https://dannywalter.github.io/Nounify-the-World/assetz/";
    this.spriteImages = {};
    
    // Animation properties
    this.walkAnimation = { 
      frames: 8,           // 8 frames for walk right animation
      speed: 6,            // Update every 6 frames (10fps at 60fps base)
      currentFrame: 0,     // Current frame index (0-7)
      tick: 0              // Animation timer counter
    };
    
    // Sprite sheet properties
    this.spriteSheetWidth = 768;   // Full sprite sheet width (16 columns of 48px)
    this.spriteSheetHeight = 384;  // Full sprite sheet height (8 rows of 48px)
    this.frameWidth = 48;          // Individual frame width
    this.frameHeight = 48;         // Individual frame height
    this.framesPerRow = 16;        // Number of frames per row in the sprite sheet
    this.frameRows = 8;            // Number of rows in the sprite sheet
    
    this.isLoaded = false;
    this.isVisible = false;
    
    // Create a placeholder image to use as fallback
    this.placeholderImage = this.createPlaceholderImage();
  }
  
  // Create a placeholder sprite sheet for missing assets
  createPlaceholderImage() {
    // Create an off-screen canvas to generate a placeholder sprite sheet
    const canvas = document.createElement('canvas');
    canvas.width = this.spriteSheetWidth;  // Full sprite sheet width
    canvas.height = this.spriteSheetHeight; // Full sprite sheet height
    
    const ctx = canvas.getContext('2d');
    
    // Fill with light gray background
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines to show frame boundaries
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += this.frameWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += this.frameHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw question marks in the first row (walk right animation frames)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add question marks to the first 8 frames (walk right animation)
    for (let i = 0; i < 8; i++) {
      const frameX = i * this.frameWidth;
      const frameY = 0; // First row
      ctx.fillText('?', frameX + this.frameWidth/2, frameY + this.frameHeight/2);
    }
    
    // Convert canvas to an Image object
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    return img;
  }

  // Initialize by loading metadata and setting up UI
  async initialize() {
    try {
      console.log("Initializing sprite chooser...");
      
      // Load metadata to get counts for each category
      const response = await fetch(this.baseUrl + 'assets.json');
      const metadata = await response.json();
      console.log("Loaded assets metadata:", metadata);
      
      // Set up part counts for each category
      this.processMetadata(metadata);
      
      // Create sprite animations for proper character visualization
      this.prepareCharacterAnimations();
      
      // Start loading images for each part
      await this.preloadImages();
      
      // Set default randomized character
      this.randomizeAll();
      
      this.isLoaded = true;
      this.isVisible = true;
      
      console.log("Sprite chooser initialization complete");
      return true;
    } catch(err) {
      console.error("Failed to initialize sprite chooser:", err);
      return false;
    }
  }
  
  // Prepare character animations for proper display
  prepareCharacterAnimations() {
    console.log("Preparing character animations");
    
    // Set up animation parameters for the walking animation
    this.walkAnimation = { 
      frames: 8,           // 8 frames for walk right animation
      speed: 6,            // Update every 6 frames (10fps at 60fps base)
      currentFrame: 0,     // Current frame index (0-7)
      tick: 0              // Animation timer counter
    };
  }
  
  processMetadata(metadata) {
    // Build a mapping between category types and their file names
    this.categoryMappings = {};
    
    // Process each category entry from the metadata
    metadata.forEach(entry => {
      const type = entry.type;
      
      if (type in this.categories) {
        // Store the count of available items
        this.categories[type].count = entry.src.length;
        
        // Create a mapping from index to filename
        this.categoryMappings[type] = entry.src.map(filename => {
          // Extract just the filename part without the path
          const baseName = filename.split('/').pop();
          return baseName;
        });
        
        console.log(`Loaded ${entry.src.length} items for ${type}`);
      }
    });
    
    // Log what was loaded
    console.log("Category mappings:", this.categoryMappings);
  }
  
  preloadImages() {
    // Start loading images for default selections
    for (const category in this.categories) {
      this.loadPartImage(category, 0); // Load first image of each category
    }
  }
  
  async loadPartImage(category, index) {
    // Don't try to load if the index is invalid
    if (index < 0 || index >= this.categories[category].count) {
      console.warn(`Invalid index for ${category}: ${index}`);
      return;
    }
    
    const key = `${category}-${index}`;
    if (!this.spriteImages[key]) {
      try {
        // Validate the index to ensure it's a valid number
        if (typeof index !== 'number' || isNaN(index)) {
          console.warn(`Invalid index for ${category}: ${index}`);
          return; // Skip loading for invalid indices
        }
        
        // Get the actual filename from our mapping
        let filename;
        if (this.categoryMappings && this.categoryMappings[category] && 
            this.categoryMappings[category][index]) {
          filename = this.categoryMappings[category][index];
        } else {
          // Fallback to indexed name if mapping isn't available
          filename = `${category}-${index}.png`;
        }
        
        const img = new Image();
        img.src = `${this.baseUrl}${category}/${filename}`;
        
        console.log(`Loading image: ${img.src}`);
        
        // Create a promise that resolves when the image loads
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => {
            console.warn(`Failed to load image: ${img.src}`);
            resolve(); // Resolve anyway to continue
          };
        });
        
        this.spriteImages[key] = img;
      } catch (err) {
        console.error(`Failed to load image for ${key}:`, err);
      }
    }
  }
  
  // Change a specific category to the next part
  nextPart(category) {
    if (!this.categories[category]) return;
    
    const cat = this.categories[category];
    cat.current = (cat.current + 1) % cat.count;
    this.loadPartImage(category, cat.current);
  }
  
  // Change a specific category to the previous part
  prevPart(category) {
    if (!this.categories[category]) return;
    
    const cat = this.categories[category];
    cat.current = (cat.current - 1 + cat.count) % cat.count;
    this.loadPartImage(category, cat.current);
  }
  
  // Randomize all parts
  randomizeAll() {
    for (const category in this.categories) {
      const cat = this.categories[category];
      if (cat.count > 0) {
        // Ensure we get a valid random number
        try {
          const randomIndex = Math.floor(Math.random() * cat.count);
          cat.current = randomIndex;
          console.log(`Randomized ${category} to index ${randomIndex}`);
          // Load the image for this part
          this.loadPartImage(category, cat.current);
        } catch (err) {
          console.error(`Error randomizing ${category}:`, err);
          // Set to 0 as a fallback
          cat.current = 0;
          this.loadPartImage(category, 0);
        }
      } else {
        // If no parts in this category, set current to 0
        cat.current = 0;
      }
    }
  }
  
  // Get current character configuration
  getCurrentConfig() {
    const config = {};
    for (const category in this.categories) {
      config[category] = this.categories[category].current;
    }
    return config;
  }
  
  // Update animation frame
  updateAnimation() {
    if (!this.isVisible) return;
    
    this.walkAnimation.tick++;
    if (this.walkAnimation.tick >= this.walkAnimation.speed) {
      this.walkAnimation.tick = 0;
      this.walkAnimation.currentFrame = 
        (this.walkAnimation.currentFrame + 1) % this.walkAnimation.frames;
    }
  }
  
  // Draw the sprite chooser UI
  draw(ctx, width, height) {
    if (!this.isVisible || !this.isLoaded) return;
    
    // Draw background
    ctx.fillStyle = '#63A0F9';
    ctx.fillRect(0, 0, width, height);
    
    // Draw character preview
    this.drawCharacterPreview(ctx, width/2, height/2 - 40, 3);
    
    // Draw UI elements
    this.drawUI(ctx, width, height);
  }
  
  drawCharacterPreview(ctx, x, y, scale) {
    // Get the current frame index for the walking animation
    const frameIndex = this.walkAnimation.currentFrame;
    
    // Draw each part of the character from back to front
    const drawOrder = ['body', 'belowthebelt', 'shoes', 'head', 'accessory', 'glasses'];
    
    ctx.save();
    ctx.translate(x, y);
    
    try {
      for (const part of drawOrder) {
        // Skip drawing if the category doesn't exist or has no count
        if (!this.categories[part] || this.categories[part].count <= 0) {
          continue;
        }
        
        const index = this.categories[part].current;
        
        // Skip if index is invalid
        if (typeof index !== 'number' || isNaN(index) || index < 0) {
          console.warn(`Invalid index for ${part}: ${index}`);
          continue;
        }
        
        const imgKey = `${part}-${index}`;
        
        // Try to use the loaded image, fall back to placeholder if needed
        const imgToDraw = this.spriteImages[imgKey] || this.placeholderImage;
        
        if (imgToDraw) {
          try {
            // Create bobbing animation effect for character preview
            let offsetY = Math.sin(Date.now() * 0.003) * 3; // Gentle bobbing effect
            
            // Calculate source coordinates for the current frame (first row, first 8 frames)
            // Looking at the walk right animation frames (top row, first 8 frames)
            const sourceX = frameIndex * this.frameWidth; // X position in sprite sheet
            const sourceY = 0;                            // Y position (first row)
            
            // Draw the current frame centered and scaled appropriately
            ctx.drawImage(
              imgToDraw,
              sourceX, sourceY,                      // Source X, Y - extract frame from sprite sheet
              this.frameWidth, this.frameHeight,     // Source width/height - one frame
              -this.frameWidth*scale/2, -this.frameHeight*scale/2 + offsetY,  // Destination X, Y with animation offset
              this.frameWidth*scale, this.frameHeight*scale  // Destination width/height
            );
          } catch (imgErr) {
            console.error(`Error drawing image for ${imgKey}:`, imgErr);
          }
        }
      }
    } catch (err) {
      console.error("Error in drawCharacterPreview:", err);
    }
    
    ctx.restore();
  }
  
  drawUI(ctx, width, height) {
    // Draw title with shadow for better readability
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('CUSTOMIZE YOUR CHARACTER', width/2, 80);
    ctx.shadowColor = 'transparent'; // Reset shadow
    
    // Draw category buttons with improved layout
    const categories = Object.keys(this.categories);
    const buttonWidth = width * 0.6; // Make buttons slightly smaller
    const buttonHeight = 50; // Make buttons slightly shorter
    const startY = height/2 + 70; // Start buttons higher on screen
    const spacing = 70; // Reduce vertical spacing between buttons
    
    ctx.font = 'bold 22px Arial'; // Slightly larger font
    
    categories.forEach((category, i) => {
      const y = startY + i * spacing;
      
      // Draw category label with subtle highlight effect
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.fillText(category.toUpperCase(), width/2, y - 14); // Moved slightly higher
      ctx.shadowColor = 'transparent';
      
      // Draw arrow buttons with better contrast and hover effect
      // Left button (previous)
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; // Darker for better visibility
      this.drawButton(ctx, width/2 - buttonWidth/2 - 45, y, 40, 40, '<');
      
      // Right button (next)  
      this.drawButton(ctx, width/2 + buttonWidth/2 + 5, y, 40, 40, '>');
      
      // Draw part indicator with subtle gradient for better visual appeal
      const gradient = ctx.createLinearGradient(width/2 - buttonWidth/2, y, width/2 + buttonWidth/2, y);
      gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
      gradient.addColorStop(1, 'rgba(255,255,255,0.2)');
      ctx.fillStyle = gradient;
      
      // Draw rounded rectangle for better visual appeal
      this.drawRoundedRect(ctx, width/2 - buttonWidth/2, y, buttonWidth, buttonHeight, 8);
      
      // Draw part number with better visibility
      ctx.fillStyle = '#FFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 2;
      const partText = `${this.categories[category].current + 1} / ${this.categories[category].count}`;
      ctx.fillText(partText, width/2, y + buttonHeight/2 + 7);
      ctx.shadowColor = 'transparent';
    });
    
    // Draw randomize button with more appealing gradient and glow effect
    const randomizeGradient = ctx.createLinearGradient(width/2 - 100, startY + categories.length * spacing, 
                                                     width/2 + 100, startY + categories.length * spacing + 50);
    randomizeGradient.addColorStop(0, '#FFD700');
    randomizeGradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = randomizeGradient;
    ctx.shadowColor = 'rgba(255, 200, 0, 0.5)';
    ctx.shadowBlur = 10;
    this.drawButton(ctx, width/2, startY + categories.length * spacing, 200, 50, 'RANDOMIZE');
    
    // Draw start button with attractive gradient and highlight effects
    const startGradient = ctx.createLinearGradient(width/2 - 125, height - 80, width/2 + 125, height - 20);
    startGradient.addColorStop(0, '#4CAF50');
    startGradient.addColorStop(1, '#45a049');
    ctx.fillStyle = startGradient;
    ctx.shadowColor = 'rgba(0, 100, 0, 0.6)';
    ctx.shadowBlur = 15;
    
    // Draw start button with larger size
    this.drawButton(ctx, width/2, height - 80, 280, 65, 'START GAME');
    ctx.shadowColor = 'transparent';
  }
  
  // Helper method to draw a rounded rectangle
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
  
  drawButton(ctx, x, y, width, height, text) {
    ctx.save();
    
    // Draw button background with rounded corners
    this.drawRoundedRect(ctx, x - width/2, y, width, height, 10);
    
    // Draw button text with improved contrast and slight text shadow
    ctx.fillStyle = '#000';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 22px Arial'; // Make text slightly larger and bold
    ctx.fillText(text, x, y + height/2);
    
    ctx.restore();
  }
  
  // Handle click events
  handleClick(x, y, width, height) {
    if (!this.isVisible) return null;
    
    const categories = Object.keys(this.categories);
    const buttonWidth = width * 0.6; // Match updated UI width
    const buttonHeight = 50; // Match updated UI height
    const startY = height/2 + 70; // Match updated UI starting position
    const spacing = 70; // Match updated UI spacing
    
    // Check category navigation buttons
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const y = startY + i * spacing;
      
      // Check prev button (<) with larger hit area for easier touch
      if (this.isInRect(x, y, width/2 - buttonWidth/2 - 45 - 20, y - 20, 50, 50)) {
        console.log(`Clicked prev button for ${category}`);
        this.prevPart(category);
        return 'category';
      }
      
      // Check next button (>) with larger hit area for easier touch
      if (this.isInRect(x, y, width/2 + buttonWidth/2 + 5 - 20, y - 20, 50, 50)) {
        console.log(`Clicked next button for ${category}`);
        this.nextPart(category);
        return 'category';
      }
      
      // Check if user clicked directly on the category slider (cycle forward)
      if (this.isInRect(x, y, width/2 - buttonWidth/2, y, buttonWidth, buttonHeight)) {
        console.log(`Clicked directly on ${category} slider, cycling forward`);
        this.nextPart(category);
        return 'category';
      }
    }
    
    // Check randomize button with updated positioning
    if (this.isInRect(x, y, width/2 - 100, startY + categories.length * spacing - 10, 200, 50)) {
      console.log("Clicked randomize button");
      this.randomizeAll();
      return 'randomize';
    }
    
    // Check start button with updated positioning and larger hit area
    if (this.isInRect(x, y, width/2 - 140, height - 80, 280, 65)) {
      console.log("Clicked start button");
      this.isVisible = false;
      return 'start';
    }
    
    return null;
  }
  
  isInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
    return x >= rectX && x <= rectX + rectWidth && 
           y >= rectY && y <= rectY + rectHeight;
  }
  
  // Show or hide the sprite chooser
  setVisible(visible) {
    this.isVisible = visible;
  }
  
  // Check if the sprite chooser is visible
  isActive() {
    return this.isVisible;
  }
}
