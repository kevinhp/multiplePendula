
class Pendulum {
    constructor(angles,lengths,masses) {
        if (!angles) {
            angles = [Math.PI/4,Math.PI/8];
            lengths = [100,100];
            masses = [2,2];
        }
        if (!lengths || lengths.length < angles.length) {
            console.log("Not enough lengths given. Filling with unit lengths.");
            while (lengths.length < angles.length) {
                lengths.push(1);
            }
        }
        if (!masses || masses.length < angles.length) {
            console.log("Not enough masses given. Filling with unit masses.");
            while (masses.length < angles.length) {
                masses.push(1);
            }
        }
        if (!g) {
            this.g = 9.8;
        }
        var rm_scale = 10;
        this.g = g;
        this.n = angles.length;
        this.s = math.matrix(angles);
        this.s.resize([2*this.n],0);
        this.ang = this.s.subset(math.index(math.range(0,this.n))).valueOf();
        this.lens = lengths;
        this.masses = masses;
        this.rs = math.multiply(this.masses,rm_scale);
        this.angd = this.s.subset(math.index(math.range(this.n,2*this.n))).valueOf();
        if (this.n == 1) {
            this.ang = [this.ang];
            this.angd = [this.angd];
        }

        this.T = math.zeros(this.n);
        this.posHistory = [];
        this.histCount = 0;
    }

    update() {
        var h = 0.05;
        var n = 20;
        for (var i = 0; i < n; i++) {
            this.rk4Step(h);
//             this.euler(h/4);
            this.ang = this.s.subset(math.index(math.range(0,this.n))).valueOf();
            this.angd = this.s.subset(math.index(math.range(this.n,2*this.n))).valueOf();
            if (this.n == 1) {
                this.ang = [this.ang];
                this.angd = [this.angd];
//                 this.masses = [this.masses];
            }
        }
    }

    show() {
//         translate(xo,yo);
        // Get XY coordinates
        var x = [0];
        var y = [0];
        for (var i = 0; i < this.n; i++) {
            x[i+1] = x[i] + this.lens[i]*math.cos(this.ang[i]);
            y[i+1] = y[i] + this.lens[i]*math.sin(this.ang[i]);
        }
        if (frameCount==1) {
            this.getEnergy(y);
        }
        if (b) {
            this.histCount++;
            this.posHistory.push([x[this.n],y[this.n]]);
            if (this.posHistory.length>500) {
                this.posHistory.shift();
            }

            this.getEnergy(y);        
        }
        // Draw lines and circles
        for (var i = 1; i <= this.n; i++) {
            stroke(200);
            strokeWeight(2);
            line(x[i-1],y[i-1],x[i],y[i]);
            noStroke();
            fill('rgba(0,0,255,0.8)');
            ellipse(x[i],y[i],this.rs[i-1],this.rs[i-1]);
        }
        noFill();
        stroke('rgba(255,0,0,1)');
        strokeWeight(1);
        beginShape();
        for (var i = 1; i < this.posHistory.length; i++) {
            vertex(this.posHistory[i][0],this.posHistory[i][1]);
//             line(this.posHistory[i-1][0],this.posHistory[i-1][1],this.posHistory[i][0],this.posHistory[i][1]);
        }
        endShape();
    }

    euler(h) {
        var y = this.s.clone();
        var k = this.evaluateAt(y);
        this.s = math.add(this.s,math.multiply(k,h));

    }

    rk4Step(h) {
        var y = this.s.clone();
        var k1 = this.evaluateAt(y);
        var k2 = this.evaluateAt(math.add(y,math.multiply(k1,0.5*h)));
        var k3 = this.evaluateAt(math.add(y,math.multiply(k2,0.5*h)));
        var k4 = this.evaluateAt(math.add(y,math.multiply(k3,    h)));
 
        this.s = math.add(this.s,math.multiply((math.add(math.add(k1,math.multiply(k2,2)), math.add(math.multiply(k3,2), k4))),h/6));
    }

    evaluateAt(y) {
        // Allocate memory
        var A = math.zeros(this.n,this.n);
        var B = math.zeros(this.n,this.n);
        var C = math.zeros(this.n,this.n);
        var D = math.zeros(this.n,this.n);

        var ang = y.subset(math.index(math.range(0,this.n))).valueOf();
        var angd = y.subset(math.index(math.range(this.n,2*this.n))).valueOf();
        if (this.n == 1) {
            ang = [this.ang];
            angd = [this.angd];
            //this.masses = [this.masses];
        }
        var angd2 = math.square(angd);

        // Fill vectors
        var wc;
        var ws;
        if (this.n == 1) {
            wc = this.masses[0] * math.cos(ang[0]) * g;
            ws = this.masses[0] * math.sin(ang[0]) * g;
        } else {
            var wc = math.multiply(math.dotMultiply(this.masses,math.cos(ang)),g);
            var ws = math.multiply(math.dotMultiply(this.masses,math.sin(ang)),g);
        }
        // Fill matrices
        for (var i = 0; i < this.n; ++i) {
           A.subset(math.index(i,i),this.lens[i]*this.masses[i]);
//            B.subset(math.index(i,i),this.lens[i]*this.masses[i]);
            for (var j = 0; j < i; ++j) {
               A.subset(math.index(i,j),this.lens[j]*this.masses[i]*math.cos(ang[j] - ang[i]));
               B.subset(math.index(i,j),this.lens[j]*this.masses[i]*math.sin(ang[j] - ang[i]));
            }
            C.subset(math.index(i,i),-1);
            if (i < this.n-1) { 
               C.subset(math.index(i,i+1),math.cos(ang[i+1] - ang[i]));
               D.subset(math.index(i,i+1),math.sin(ang[i+1] - ang[i]));
            }
        }

        // Get cinv
        var Cinv = math.inv(C);
        var DCinv = math.multiply(D,Cinv);
        var DCinvA = math.multiply(DCinv,A);
        var DCinvB = math.multiply(DCinv,B);
        var tmp1 = math.add(A,DCinvB);
        var tmp2 = math.subtract(B,DCinvA);

        // angdd = (A+D.Cinv.B)inv.[wc - D.Cinv.ws + (B-D.Cinv.A).angd^2]
        var Y = math.matrix(math.zeros(y.size()));
        Y.subset(math.index(math.range(0,this.n)), math.subset(y,math.index(math.range(this.n,2*this.n))));
        var Y2 = math.multiply(
            math.inv(tmp1)
            ,
            math.add(
                math.subtract(
                    wc
                    ,
                    math.multiply(DCinv,ws)
                )
                ,
                math.multiply(tmp2 , angd2)
            )
        ).valueOf();
        if (this.n == 1) {
            Y2 = Number(Y2[0]);
        }
        Y.subset(math.index(math.range(this.n,2*this.n)), Y2);
        return Y;
    }

    getEnergy(y) {
        // Compute energy
        //Kinetic:
        var k = 0;
        var v = 0;
        for (var i = 0; i < this.n; i++) {
            var sumr = 0;
            var sumq = 0;
            for (var j = 0; j <= i; j++) {
                sumr += this.lens[j]*this.angd[j]*sin(this.ang[j] - this.ang[i]);
                sumq += this.lens[j]*this.angd[j]*cos(this.ang[j] - this.ang[i]);
            }
            k += 0.5*this.masses[i]*(sumr*sumr + sumq*sumq);
            v -= this.masses[i]*g*y[i+1];
        }
        var totalEnergy = k + v;
        if (frameCount == 1) {
            this.initialEnergy = totalEnergy;
        }
        document.getElementById("energy").innerHTML = "Total energy: " + totalEnergy.toFixed(6) + ", Kinetic: " + k.toFixed(6) + ", Potential: " + v.toFixed(6) + ", Change from start: " + (this.initialEnergy - totalEnergy).toFixed(6);
    }
}