let g;  // gravity
let pl; // pendulum list
let b;  // bool to pause/unpause with clicks on the canvas
let xo;
let yo;

let pendulaCanvas = function(p) {
    p.setup = function() {
        // Set up canvas
        p.createCanvas(window.innerWidth - 20,window.innerHeight - 40);
        
        // Set gravity
        g = 1;
        
        // Set initial angles, lengths and masses (angles.length determines the number of pendula)
        // 4 medium pendula example:
        // let angles = [-math.pi*2/7,-math.pi*5/11,math.pi*1.1,-math.pi*1/4];
        // let lengths = [100,100,100,50];
        // let masses = [4,5,3,4];
        // 10 small pendula example
        let angles = Array(10).fill(math.pi*(-3/8));
        let lengths = Array(angles.length).fill(15);
        let masses = Array(angles.length).fill(1/3);
        
        // Create objects and start
        pl = new Pendula(angles,lengths,masses);
        pl.traceList = [pl.n-1,pl.n-2]; // Draw traces for last two pendula
        b = true;
        pl.draw(p);
    }
    p.draw = function() {
        if (b) { // Check if paused updates
            pl.update();
            pl.draw(p);
        }
    }
    // Pause/unpause when clicking on canvas
    p.mouseClicked = function() {
        b = !b;
    }
    p.windowResized = function() {
        this.resizeCanvas(window.innerWidth - 20,window.innerHeight - 40);
        pl.resize(this);
    }
}
let displayCanvas = new p5(pendulaCanvas,'pendulaCanvas')