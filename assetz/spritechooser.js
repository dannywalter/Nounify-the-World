let count = 0;
let gif = null;
let prevFrame = -1;

const recordGifBtn = document.getElementById('recordGifBtn');

const myspritesheet = new Image();
myspritesheet.src = "/assetz/head/head-aardvark.png";
const optionsWrap = document.getElementsByClassName('optionsWrap')[0]

let running = false
let myassets;

let nounishMetadata;

async function getMeta (){
  const response = await fetch('./assetz/metadataByName-474.json');
  nounishMetadata = await response.json();
}

getMeta()

async function getTraitSet(trait){

  const response = await fetch(`../assetz/assets.json`);
  myassets = await response.json();

  for (let x = 0; x < myassets.length; x++) {
    const assetType = myassets[x].type

    var mydiv = document.createElement('div')
        mydiv.className = "selection_wrap"
        optionsWrap.appendChild(mydiv)

    var mylabel = document.createElement('label');  
        mylabel.innerText = assetType
        mylabel.for = assetType
        mylabel.className = "labels"
        mydiv.appendChild(mylabel)

    var myoptions = document.createElement('select');
        myoptions.id = assetType;
        myoptions.name = assetType
        myoptions.onchange = function(){
          drawMe(assetType,this.options[this.selectedIndex].text)
          this.blur()
        }
        mydiv.appendChild(myoptions)

        const rnd = Math.floor(Math.random() * myassets[x].src.length);

        for (let y = 0; y < myassets[x].src.length; y++) {


          var option = document.createElement('option');
          option.value = myassets[x].src[y]
          option.innerText = myassets[x].src[y]
          myoptions.appendChild(option)

          
          if(y === myassets[x].src.length - 1){
            drawMe(assetType, myassets[x].src[rnd])
          }
        }
        
        myoptions.selectedIndex = rnd 

      }

    }

const mycanvas = document.getElementById('canvas');
mycanvas.width = 768; 
mycanvas.height = 384;
const context = mycanvas.getContext('2d');
context.webkitImageSmoothingEnabled = false;
context.mozImageSmoothingEnabled = false;
context.imageSmoothingEnabled = false;

getTraitSet()

const layersArray = {background:"",body:"",accessory:"",head:"",glasses:"",hands:"",belowthebelt:"",shoes:""};

async function drawMe(type, mysrc){

  running = false
  canvas2.classList.remove('unlocked');
  layersArray[`${type}`] = `/assetz/${type}/${mysrc}`

  context.clearRect(0, 0, mycanvas.width, mycanvas.height);
  ctx2.clearRect(0, 0, mycanvas.width, mycanvas.height);
  // console.log(layersArray)
  
  for (var key in layersArray) {

    if (layersArray[key] !== "") {

      let myimg = new Image();
          myimg.src = layersArray[key];
          await myimg.decode();
          await context.drawImage(myimg, 0, 0, mycanvas.width, mycanvas.height);

          if (key === "shoes"){
              // console.log("finished!");
              running = false
              readyToAnimate = false
              const myNewImg = mycanvas.toDataURL('image/png')
              myspritesheet.src = myNewImg
              
              myspritesheet.onload = ()=>{
                console.log("ready to draw");
                running = true
                  animate()
                  canvas2.classList.add('unlocked');
              };
          }
    }

  }

}
async function cancelAnimation(){
  if(!running){ 
    cancelAnimationFrame(animate)
  }
  return console.log("cancelled animation");
}

const canvas2 = document.getElementById("canvas2");
const ctx2 = canvas2.getContext("2d");
canvas2.width = 500;
canvas2.height = 500;

let framesDrawn = 0;
let cols = 16;
let rows = 8;

let spriteWidth = 768 / cols;
let spriteHeight = 384 / rows;

let totalFrames = 8; 
let currentFrame = 0;

ctx2.webkitImageSmoothingEnabled = false;
ctx2.imageSmoothingEnabled = false;

let srcX = 0;
let srcY = 0;

let speed = 6

let fps = 60
let recordingGif = false;
let xOffset = false;
let gifFrameCount = 0;

let randomizing = false

function loadImage(url) {
  return new Promise((fulfill, reject) => {
    let image = new Image();
    image.onload = () => fulfill(image);
    image.onerror = (error) => reject(error);
    image.src = url;
  });
}

async function animate() {
  if(running){

    setTimeout(async() => {
      await requestAnimationFrame(animate); 
    }, 1000 / fps);
    
    // await new Promise((resolve) => setTimeout(requestAnimationFrame(animate), 1000));

    currentFrame = currentFrame % totalFrames;
    srcX = currentFrame * spriteWidth ; 

    await ctx2.clearRect(0,0,canvas2.width,canvas2.height); 
    await ctx2.drawImage(myspritesheet, srcX + xOffset * spriteWidth, srcY, spriteWidth, spriteHeight,0, 0, 500, 500);
    framesDrawn++;

    if(framesDrawn >= speed){

      prevFrame = currentFrame;
      currentFrame++;
      framesDrawn = 0;
    }

  }
}
  
  function resizeImage() {
      let scaleFactor = 1;
      let midXPos = 500 / 2 - (500 * scaleFactor) / 2;
      let midYPos = 500 / 2 - (500 * scaleFactor) / 2;
      ctx2.translate(midXPos, midYPos);
      ctx2.scale(scaleFactor, scaleFactor);
  }

  let keysPressed = {};
  let lastKey = "ArrowLeft";

  addEventListener("keydown", e => {

    totalFrames = 8; 

    keysPressed[e.key] = true;

    if(keysPressed[' ']){

      xOffset = 8;
      speed = 6

      if(lastKey === "ArrowDown"){
        srcY = 3 * spriteHeight;
        lastKey = e.key;
      }

      if (e.key == 'ArrowLeft') {
        srcY = 2 * spriteHeight;
        lastKey = e.key;

      } else if (e.key == 'ArrowRight') {
        srcY = 0 * spriteHeight;
        lastKey = e.key;
    
      } else if (e.key == 'ArrowDown') {
        srcY = 3 * spriteHeight;
    
        lastKey = e.key;
    
      } else if (e.key == 'ArrowUp') {
        srcY = 1 * spriteHeight;
        lastKey = e.key;
    
      }

    } else {

      if(e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown"){

        xOffset = 0;
        if(lastKey != e.key){
          currentFrame = 0;
        }
        if(e.key === "ArrowLeft"){
            srcY = 2 * spriteHeight;
            lastKey = e.key;
  
        } else if(e.key === "ArrowRight"){
            srcY = 0 * spriteHeight;
            lastKey = e.key;
          } else if(e.key === "ArrowUp"){
            srcY = 1 * spriteHeight;
            lastKey = e.key;
          } else if(e.key === "ArrowDown"){
            totalFrames = 16; 
            srcY = 4 * spriteHeight;
            lastKey = e.key;
          } 

      }

    }
 
  });

  document.addEventListener('keyup', (event) => {
    delete keysPressed[event.key];
  });

  function downloadSpriteSheet(){
    var link = document.createElement('a');
    link.download = 'myNounsSpritesheet.png';
    link.href = mycanvas.toDataURL()
    link.click();
  }
  
  function downloadFrame(){
    var link = document.createElement('a');
    link.download = 'myNoun.png';
    link.href = canvas2.toDataURL()
    link.click();
  }

  let throttlePause = false;

  async function randomize(){

    if (throttlePause) return;
    throttlePause = true;

    setTimeout(async() => {

      randomizing = true
      
      canvas2.classList.remove('unlocked');
      context.clearRect(0, 0, mycanvas.width, mycanvas.height);
      ctx2.clearRect(0, 0, mycanvas.width, mycanvas.height);
      
      for (let x = 0; x < myassets.length; x++) {

        const rnd = Math.floor(Math.random() * myassets[x].src.length);
        const assetType = myassets[x].type

        layersArray[`${assetType}`] = `/assetz/${assetType}/${myassets[x].src[rnd]}`
        document.getElementById(`${assetType}`).getElementsByTagName('option')[rnd].selected = 'selected';
        
        if(x === 6){

          for (var key in layersArray) {

            if (layersArray[key] !== "") {
        
              let myimg = new Image();
                  myimg.src = layersArray[key];
                  await myimg.decode();
                  await context.drawImage(myimg, 0, 0, mycanvas.width, mycanvas.height);

                  if (key === "shoes"){
            
                      // console.log("finished!");
                      running = false
                      readyToAnimate = false
                      const myNewImg = mycanvas.toDataURL('image/png')
                      myspritesheet.src = myNewImg
                      
                      myspritesheet.onload = ()=>{
                        setTimeout(() => {
                          
                          console.log("ready to draw");
                          running = true
                            animate()
                            canvas2.classList.add('unlocked');
                          }, 100);
                        };
                  }
            }
        
          }

          randomizing = false
          console.log("FINISHED!")

        }
      }
      
      throttlePause = false;
    }, 200);
  }


  // let dlcount = 0 ;

  async function pickNoun(nounId){

    
      canvas2.classList.remove('unlocked');
      context.clearRect(0, 0, mycanvas.width, mycanvas.height);
      ctx2.clearRect(0, 0, mycanvas.width, mycanvas.height);


      try {
        
        
        for (let x = 0; x < myassets.length; x++) {
          
          const rnd = Math.floor(Math.random() * myassets[x].src.length);
          const assetType = myassets[x].type

          switch (assetType) {
            case "background":
              layersArray[`background`] = `/assetz/background/bg-none.png`
              break;

            case "body":
              layersArray[`body`] = `/assetz/body/${nounishMetadata[nounId].body.filename}.png`
              break;

            case "accessory":

              layersArray[`accessory`] = `/assetz/accessory/${nounishMetadata[nounId].accessory.filename}.png`
              
              break;
            case "head":
            if(nounishMetadata[nounId].head.filename != "head-baseball-gameball"){
              layersArray[`head`] = `/assetz/head/${nounishMetadata[nounId].head.filename}.png`
            }

            break;
            case "glasses":
              layersArray[`glasses`] = `/assetz/glasses/${nounishMetadata[nounId].glasses.filename}.png`

            break;
            case "belowthebelt":
              layersArray[`belowthebelt`] = `/assetz/belowthebelt/${myassets[x].src[44]}`

              break;

            case "shoes":
              layersArray[`shoes`] = `/assetz/shoes/${myassets[x].src[2]}`

              for (var key in layersArray) {

                if (layersArray[key] !== "") {
            
                  let myimg = new Image();
                      myimg.src = layersArray[key];
                      await myimg.decode();
                      await context.drawImage(myimg, 0, 0, mycanvas.width, mycanvas.height);
    
                      if (key === "shoes"){
                          running = false
                          readyToAnimate = false
                          const myNewImg = mycanvas.toDataURL('image/png')
                          myspritesheet.src = myNewImg
                          
                          myspritesheet.onload = ()=>{
                            setTimeout(() => {
                              console.log("ready to draw");
                              running = true
                                animate()
                                canvas2.classList.add('unlocked');
                              }, 100);
                            };
                      }
                }
            
              }

              break;
          
            default:
              break;
          }
        
          if(x === 6){
            console.log("NOUN FINISHED!")
          }
        }



      // }

    
      
    } catch (error) {

        console.log("*****************");
        console.log(error)
        console.log("*****************");
    }
  }

  const learnModal = document.getElementsByClassName('modalwrap')[0];
  function openModal(){
    learnModal.style.display = "flex";
  }
  function closeModal(ev){
    learnModal.style.display = "none";
  }

  let throttlePause2 = false;
  let pickedNounId;

  let timeOutId;

  const nounIdInput = document.getElementById('nounIdInput')
  nounIdInput.addEventListener('keyup',(e)=>{

      pickedNounId = nounIdInput.value;

      if(pickedNounId < 744 && pickedNounId != ""){
        if(timeOutId) {
          clearTimeout(timeOutId);
        }
        timeOutId = setTimeout(() => {
          if(pickedNounId === ""){
            randomize()
          } else {
            pickNoun(pickedNounId)
          }
          nounIdInput.blur()
        },500);
  
      }
  })