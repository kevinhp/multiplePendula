var g;
var pl; // pendulum list
var b;

var pendulaCanvas = function(p) {
    var xo;
    var yo;
    p.setup = function() {
        p.createCanvas(1000,800);
        xo = p.width/2;
        yo = 400;
        g = 1;
        var angles = [-math.pi*2/7,-math.pi*5/11,math.pi*1.1,-math.pi*1/4];
        var lengths = [100,100,100,50];
        var masses = [4,5,3,4];
        pl = new Pendulum(angles,lengths,masses,p);
        b = false;
        p.translate(xo,yo);
        pl.show();
    }
    p.draw = function() {
        p.translate(xo,yo);
        if (b) {
            pl.update();
        }
        p.background(0);
        pl.show();
    }
    p.mouseClicked = function() {
        b = !b;
    }
}
var displayCanvas = new p5(pendulaCanvas,'pendulaCanvas')
