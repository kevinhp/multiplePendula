let g;
let pl; // pendulum list
let b;

let pendulaCanvas = function(p) {
    let xo;
    let yo;
    p.setup = function() {
        p.createCanvas(1000,800);
        xo = p.width/2;
        yo = 400;
        g = 1;
        let angles = [-math.pi*2/7,-math.pi*5/11,math.pi*1.1,-math.pi*1/4];
        let lengths = [100,100,100,50];
        let masses = [4,5,3,4];
        pl = new Pendulum(angles,lengths,masses,p);
        pl.traceList = [1,3];
        b = false;
        p.translate(xo,yo);
        pl.show();
    }
    p.draw = function() {
        p.translate(xo,yo);
        if (b) {
            pl.update();
        }
        p.background(50);
        pl.show();
    }
    p.mouseClicked = function() {
        b = !b;
    }
}
let displayCanvas = new p5(pendulaCanvas,'pendulaCanvas')
