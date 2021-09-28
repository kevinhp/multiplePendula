let g;  // gravity
let pl; // pendulum list
let b;  // bool to pause/unpause with clicks on the canvas
let xo;
let yo;
let maxPend = 20;
let numPend;
let p;
let wHalf;
let hHalf;

let pendulaCanvas = function(P) {
  p = P;
    p.setup = function() {
        
        // Set up canvas
        p.createCanvas(window.innerWidth - 20,window.innerHeight - 40);
        wHalf = p.width/2;
        hHalf = p.height/2;
        
        // Set gravity
        g = 1;
        
        // Set initial angles, lengths and masses (angles.length determines the number of pendula)
        // 4 medium pendula example:
        // let angles = [-math.pi*2/7,-math.pi*5/11,math.pi*1.1,-math.pi*1/4];
        // let lengths = [100,100,100,50];
        // let masses = [4,5,3,4];
        // 10 small pendula example

        p.setupBar();
        let angles = Array(Number(numPend.value())).fill(math.pi*(-3/8));
        let lengths = Array(angles.length).fill(15);
        let masses = Array(angles.length).fill(1/3);
        
        // Create objects and start
        pl = new Pendula(angles,lengths,masses);
        pl.traceList = [pl.n-1,pl.n-2]; // Draw traces for last two pendula
        b = false;
        pl.draw(p);
    }
    p.setupBar = function() {
      numPend = p.createInput(10,"number");
      numPend.position(10,10);
      numPend.size(35,13);
      numPend.elt.min = "1";
      numPend.changed(numberChanged);
    }
    p.draw = function() {
        if (b) { // Check if paused updates
            pl.update();
            pl.draw(p);
          }
    }
    // Pause/unpause when clicking on canvas
    p.mouseClicked = function() {
      let mx = (p.mouseX-wHalf);
      let my = (p.mouseY-hHalf);
      console.log("click");
      let touched = getObjectType(mx,my);
    }
    p.mouseDragged = function() {
      let mx = (p.mouseX-wHalf);
      let my = (p.mouseY-hHalf);
      let touched = getObjectType(mx,my);
      console.log("drag");
      if (touched && touched.type == "mass") {
        pl.dragMass(touched.idx,mx,my);
      }
      pl.draw(p);
    }
    p.windowResized = function() {
        this.resizeCanvas(window.innerWidth - 20,window.innerHeight - 40);
        wHalf = p.width/2;
        hHalf = p.height/2;
        pl.resize(this);
    }
}
let displayCanvas = new p5(pendulaCanvas,'pendulaCanvas')

let playClick = function() {
    b = !b;
    if (b) {
        document.getElementById("playButton").innerHTML = "Pause";
    } else {
        document.getElementById("playButton").innerHTML = "Play";
    }
}

let numberChanged = function() {
  b = false; // Pause
  newNum = Number(numPend.value());
  let angles = pl.angleList;
  oldNum = angles.length;
  lastAngle = angles[oldNum-1];
  angles.length = newNum;
  angles.fill(lastAngle,oldNum,newNum);
  newTraceList = pl.traceList.filter(idx => idx <= newNum);
  pl.angleList = angles;
  pl.traceList = newTraceList;
  
  // Create objects and start
  pl.reset();
  pl.draw(p);
}

let menuChanged = function() {
  b = false; // Pause
  newNum = Number(p.menu.value());
  let angles = pl.angleList;
  oldNum = angles.length;
  lastAngle = angles[oldNum-1];
  angles.length = newNum;
  angles.fill(lastAngle,oldNum,newNum);
  newTraceList = pl.traceList.filter(idx => idx <= newNum);
  pl.angleList = angles;
  pl.traceList = newTraceList;
  
  // Create objects and start
  pl.draw(p);
}

let restart = function() {
  pl.reset();
  pl.draw(p);
}

let getObjectType = function(mx,my) {
  // Check if a mass is being touched
  for (let i = 0; i < pl.pendulumList.length; i++) {
    let p = pl.pendulumList[i];
    if (p.isTouching(mx,my)) {
      return {obj: p, type: "mass", idx: i}
    }
  }
  return false;
}

drawBar = function() {
  p.fill(0);
  p.rect(-wHalf,-hHalf,p.width,40);
}