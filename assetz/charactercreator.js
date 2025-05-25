// Parts to include in character creator (excluding background)
const parts = ['body', 'accessory', 'head', 'glasses', 'belowthebelt', 'shoes'];
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const previewCtx = preview.getContext('2d');
let spritesheet;
let currentFrame = 0;
let assets = {};
let layerSelections = {};

// Helper to get parent origin safely
function getParentOrigin() {
  try {
    return window.parent.location.origin;
  } catch (e) {
    const a = document.createElement('a');
    a.href = document.referrer;
    return a.origin;
  }
}

// Disable image smoothing
ctx.imageSmoothingEnabled = false;
previewCtx.imageSmoothingEnabled = false;

// Initialize - load assets and build UI
async function init() {
  try {
    // Load assets.json with timeout
    const response = await fetch('https://dannywalter.github.io/Nounify-the-World/assetz/assets.json');
    assets = await response.json();
    
    // Build UI selectors
    buildSelectors();
    
    // Set initial random selections
    randomizeCharacter();
    
    // Start animation
    animate();
  } catch (error) {
    console.error('Failed to load assets:', error);
    document.body.innerHTML = '<h2>Failed to load assets. Please check console.</h2>';
  }
}

// Build the dropdown selectors for each part
function buildSelectors() {
  const optionsDiv = document.querySelector('.options');
  
  parts.forEach(part => {
    // Get asset files for this part
    const options = assets.find(a => a.type === part)?.src || [];
    if (options.length === 0) return;
    
    const partDiv = document.createElement('div');
    partDiv.className = 'part';
    
    const label = document.createElement('label');
    label.textContent = part.charAt(0).toUpperCase() + part.slice(1);
    
    const select = document.createElement('select');
    select.id = `${part}-select`;
    select.addEventListener('change', (e) => {
      layerSelections[part] = e.target.value;
      redrawLayers();
    });
    
    // Add options to the dropdown
    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = option.replace('.png', '').replace(/^[^-]+-/, '');
      select.appendChild(opt);
    });
    
    partDiv.appendChild(label);
    partDiv.appendChild(select);
    optionsDiv.appendChild(partDiv);
  });
  
  // Set up button listeners
  document.getElementById('randomizeBtn').addEventListener('click', randomizeCharacter);
  document.getElementById('useButton').addEventListener('click', useInGame);
}

// Random character generation
function randomizeCharacter() {
  parts.forEach(part => {
    const select = document.getElementById(`${part}-select`);
    if (select && select.options.length) {
      const randomIndex = Math.floor(Math.random() * select.options.length);
      select.selectedIndex = randomIndex;
      layerSelections[part] = select.value;
    }
  });
  
  redrawLayers();
}

// Load an image with proper cross-origin settings
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Redraw all selected layers
async function redrawLayers() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw each selected layer
  for (const part of parts) {
    const partSrc = layerSelections[part];
    if (!partSrc) continue;
    
    try {
      const img = await loadImage(`${part}/${partSrc}`);
      ctx.drawImage(img, 0, 0);
    } catch (err) {
      console.error(`Failed to load ${part}/${partSrc}`, err);
    }
  }
  
  // Update spritesheet image data
  spritesheet = new Image();
  spritesheet.src = canvas.toDataURL('image/png');
}

// Animation loop for the preview
function animate() {
  // Animation frame calculation (8 frames total)
  currentFrame = (currentFrame + 1) % 8;
  
  // Clear the preview canvas
  previewCtx.clearRect(0, 0, preview.width, preview.height);
  
  // Calculate frames for walking animation
  const srcX = currentFrame * 48; // 48px per frame
  const srcY = 0; // First row contains walk right animation
  
  // Draw the current frame centered in the preview
  if (spritesheet) {
    previewCtx.drawImage(
      spritesheet,
      srcX, srcY, 48, 48,
      preview.width/2 - 60, preview.height/2 - 60, 120, 120
    );
  }
  
  // Continue animation
  setTimeout(() => {
    requestAnimationFrame(animate);
  }, 100); // ~10fps animation
}

// Send the generated spritesheet to the game
function useInGame() {
  const parentOrigin = getParentOrigin() || '*'; // fallback to '*' if unknown
  const spritesheetData = canvas.toDataURL('image/png');
  const glassesPart = layerSelections['glasses'];
  if (glassesPart) {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 48;
      tempCanvas.height = 48;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0, 48, 48, 0, 0, 48, 48);
      const glassesDataUrl = tempCanvas.toDataURL('image/png');
      window.parent.postMessage({
        type: 'spriteUpdate',
        spritesheetDataUrl: spritesheetData,
        noggleDataUrl: glassesDataUrl
      }, parentOrigin);
      alert('Character sent to game!');
    };
    img.src = `https://dannywalter.github.io/Nounify-the-World/assetz/glasses/${glassesPart}`;
    return;
  }
  // If no glasses selected, just send the spritesheet
  window.parent.postMessage({
    type: 'spriteUpdate',
    spritesheetDataUrl: spritesheetData,
    noggleDataUrl: null
  }, parentOrigin);
  alert('Character sent to game!');
}

// Listen for requests to generate random characters from the parent window
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'generateRandom') {
    console.log("Received generateRandom message in character creator");
    
    // Generate a random character
    randomizeCharacter();
    
    // Use the same process as useInGame but without the alert
    const parentOrigin = getParentOrigin() || '*';
    const spritesheetData = canvas.toDataURL('image/png');
    const glassesPart = layerSelections['glasses'];
    
    if (glassesPart) {
      console.log("Processing glasses part:", glassesPart);
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        console.log("Glasses image loaded successfully");
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 48;
        tempCanvas.height = 48;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, 48, 48, 0, 0, 48, 48);
        const glassesDataUrl = tempCanvas.toDataURL('image/png');
        
        window.parent.postMessage({
          type: 'spriteUpdate',
          spritesheetDataUrl: spritesheetData,
          noggleDataUrl: glassesDataUrl
        }, parentOrigin);
        
        console.log("Character with glasses sent to parent");
        
        // Remove any loading indicator in the parent
        try {
          const loadingElement = window.parent.document.getElementById('character-loading');
          if (loadingElement) loadingElement.remove();
        } catch (e) {
          console.warn("Couldn't access parent document to remove loading indicator:", e);
        }
      };
      
      img.onerror = (err) => {
        console.error("Failed to load glasses image:", err);
        // Still send message with spritesheet only
        window.parent.postMessage({
          type: 'spriteUpdate',
          spritesheetDataUrl: spritesheetData,
          noggleDataUrl: null
        }, parentOrigin);
        
        // Try to remove loading indicator despite error
        try {
          const loadingElement = window.parent.document.getElementById('character-loading');
          if (loadingElement) loadingElement.remove();
        } catch (e) {
          console.warn("Couldn't access parent document to remove loading indicator:", e);
        }
      };
      
      img.src = `https://dannywalter.github.io/Nounify-the-World/assetz/glasses/${glassesPart}`;
    } else {
      console.log("No glasses selected, sending only spritesheet");
      // If no glasses selected, just send the spritesheet
      window.parent.postMessage({
        type: 'spriteUpdate',
        spritesheetDataUrl: spritesheetData,
        noggleDataUrl: null
      }, parentOrigin);
      
      // Remove any loading indicator in the parent
      try {
        const loadingElement = window.parent.document.getElementById('character-loading');
        if (loadingElement) loadingElement.remove();
      } catch (e) {
        console.warn("Couldn't access parent document to remove loading indicator:", e);
      }
    }
  }
});

// Start initialization
init();