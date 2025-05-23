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
    
    // Create canvas for compositing character sprite sheets
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = this.spriteSheetWidth;
    this.compositeCanvas.height = this.spriteSheetHeight;
    this.compositeCtx = this.compositeCanvas.getContext('2d');
    this.compositeCtx.imageSmoothingEnabled = false;
    
    // Track when we need to rebuild the composite
    this.needsCompositeRebuild = true;
  }
  
  // Create a placeholder sprite sheet for missing assets
  createPlaceholderImage() {
    // Create an off-screen canvas to generate a placeholder sprite sheet
    const canvas = document.createElement('canvas');
    canvas.width = this.spriteSheetWidth;  // Full sprite sheet width
    canvas.height = this.spriteSheetHeight; // Full sprite sheet height
    
    const ctx = canvas.getContext('2d');
    
    // Fill with transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
      
      // Start loading images for each part and wait for completion
      console.log("Preloading initial images...");
      await this.preloadImages();
      console.log("Initial images loaded");
      
      // Set default randomized character
      this.randomizeAll();
      
      // Wait a bit for randomized images to load, then create initial composite
      setTimeout(() => {
        this.createCompositeSheet();
      }, 500);
      
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
    const loadPromises = [];
    for (const category in this.categories) {
      if (this.categories[category].count > 0) {
        loadPromises.push(this.loadPartImage(category, 0)); // Load first image of each category
      }
    }
    return Promise.all(loadPromises);
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
          img.onload = () => {
            this.needsCompositeRebuild = true; // Mark for rebuild when image loads
            resolve();
          };
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
    this.needsCompositeRebuild = true; // Mark for rebuild
  }
  
  // Change a specific category to the previous part
  prevPart(category) {
    if (!this.categories[category]) return;
    
    const cat = this.categories[category];
    cat.current = (cat.current - 1 + cat.count) % cat.count;
    this.loadPartImage(category, cat.current);
    this.needsCompositeRebuild = true; // Mark for rebuild
  }
  
  // Create composite sprite sheet by layering all character parts
  createCompositeSheet() {
    // Clear the canvas with transparent background
    this.compositeCtx.clearRect(0, 0, this.spriteSheetWidth, this.spriteSheetHeight);
    
    // Draw order matters - back to front rendering
    const drawOrder = ['body', 'belowthebelt', 'shoes', 'head', 'accessory', 'glasses'];
    
    let partsDrawn = 0;
    
    for (const category of drawOrder) {
      if (!this.categories[category] || this.categories[category].count <= 0) {
        continue;
      }
      
      const index = this.categories[category].current;
      const imgKey = `${category}-${index}`;
      const img = this.spriteImages[imgKey];
      
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          // Draw the entire sprite sheet for this part onto our composite
          this.compositeCtx.drawImage(img, 0, 0, this.spriteSheetWidth, this.spriteSheetHeight);
          partsDrawn++;
          console.log(`Drew ${category} part to composite (${img.naturalWidth}x${img.naturalHeight})`);
        } catch (err) {
          console.error(`Error drawing ${category} to composite:`, err);
        }
      } else {
        console.warn(`Image not ready for ${category}-${index}:`, img ? `${img.complete}, ${img.naturalWidth}x${img.naturalHeight}` : 'null');
      }
    }
    
    if (partsDrawn > 0) {
      console.log(`Composite created with ${partsDrawn} parts`);
      this.needsCompositeRebuild = false;
    } else {
      console.warn("No parts were drawn to composite - all images may still be loading");
      // Don't mark as complete if no parts were drawn
    }
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
    this.needsCompositeRebuild = true; // Mark for rebuild
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
    // Rebuild composite if needed
    if (this.needsCompositeRebuild) {
      this.createCompositeSheet();
    }
    
    // Get the current frame index for the walking animation
    const frameIndex = this.walkAnimation.currentFrame;
    
    ctx.save();
    ctx.translate(x, y);
    
    try {
      // Create bobbing animation effect for character preview
      let offsetY = Math.sin(Date.now() * 0.003) * 3; // Gentle bobbing effect
      
      // Calculate source coordinates for the current frame (first row, walk right animation)
      const sourceX = frameIndex * this.frameWidth; // X position in sprite sheet
      const sourceY = 0;                            // Y position (first row)
      
      // Check if we have a valid composite canvas with content
      const compositeImageData = this.compositeCtx.getImageData(0, 0, this.spriteSheetWidth, this.spriteSheetHeight);
      const hasContent = compositeImageData.data.some(pixel => pixel !== 0);
      
      if (hasContent) {
        // Draw the current frame from our composite sprite sheet
        ctx.drawImage(
          this.compositeCanvas,                          // Use the composite sprite sheet
          sourceX, sourceY,                              // Source X, Y - extract frame from sprite sheet
          this.frameWidth, this.frameHeight,             // Source width/height - one frame
          -this.frameWidth*scale/2, -this.frameHeight*scale/2 + offsetY,  // Destination X, Y with animation offset
          this.frameWidth*scale, this.frameHeight*scale  // Destination width/height
        );
      } else {
        // Fallback: draw a simple animated placeholder
        ctx.fillStyle = '#FFD700';
        const size = 32 * scale;
        ctx.fillRect(-size/2, -size/2 + offsetY, size, size);
        
        // Add loading text
        ctx.fillStyle = '#000';
        ctx.font = `${12 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', 0, offsetY + 5 * scale);
      }
    } catch (err) {
      console.error("Error in drawCharacterPreview:", err);
      
      // Fallback: draw a simple rectangle
      ctx.fillStyle = '#888';
      const offsetY = Math.sin(Date.now() * 0.003) * 3;
      ctx.fillRect(-24*scale, -24*scale + offsetY, 48*scale, 48*scale);
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
