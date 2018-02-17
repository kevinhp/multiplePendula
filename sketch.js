var xo; // x origin
var yo; // y origin
var g;
var p;
var b;

function setup() {
    createCanvas(1000,600);
    xo = width/2;
    yo = 100;
    g = 1;
//     var angles = [math.pi*0.9];
    var angles = [math.pi*1/7,-math.pi*5/11,math.pi*1.1,0];
    var lengths = [100,100,100,50];
    var masses = [4,4,3,4];
    p = new Pendulum(angles,lengths,masses);
    b = false;
    translate(xo,yo);
    p.show();
}

function draw() {
    translate(xo,yo);
    if (b) {
        p.update();
    }
    background(0);
    p.show();
}

function mouseClicked() {
    b = !b;
}
