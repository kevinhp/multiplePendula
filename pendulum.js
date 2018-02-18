
class Pendulum {
    constructor(angles,lengths,masses,canvas) {
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
            this.g = 1;
        }
        this.canvas = canvas;
        this.g = g;
        this.n = angles.length;
        
        this.s = math.matrix(angles); // State: Column vector of angles followed by their rates
        this.s.resize([2*this.n],0);
        this.ang = this.s.subset(math.index(math.range(0,this.n))).valueOf();
        this.angd = this.s.subset(math.index(math.range(this.n,2*this.n))).valueOf();
        
        this.lens = lengths;
        var rm_scale = 15; // Proportion between mass and radius^2
        this.masses = masses;
        this.rs = math.multiply(math.sqrt(this.masses),rm_scale); // Radii
        
        this.T = math.zeros(this.n);
        this.posHistory = [];
        this.histCount = 0;
        
        this.integrateStep = this.rk4Step;

        // Generate random color for masses
        this.colors = [];
        var r;
        var b;
        for (var i = 0; i < this.n; i++) {
            r = Math.floor(255*Math.random());
            b = Math.floor(255*Math.random());
            this.colors[i] = this.canvas.color('rgba(' + r + ',255,' + b + ',0.9)');
        }
        this.traceColor = this.canvas.color('rgb(' + r + ',255,' + b + ')');
    }
    
    useRK4() {
        this.integrateStep = this.rk4Step;
    }
    
    useEuler() {
        this.integrateStep = this.eulerStep;
    }
    
    update() {
        var h = 0.05;
        var n = 20;
        for (var i = 0; i < n; i++) {
            this.integrateStep(h);
            this.ang = this.s.subset(math.index(math.range(0,this.n))).valueOf();
            this.angd = this.s.subset(math.index(math.range(this.n,2*this.n))).valueOf();
            if (this.n == 1) {
                this.ang = [this.ang];
                this.angd = [this.angd];
            }
        }
    }
    
    getRodColor(t) {
        // Make color reflect tension strength: red for tension, blue for compression and brightness for intensity
        var intensity = math.round(150 + 50/(1 + math.exp(-t))); // Sigmoid function amplified to 0-255
        var color = 'rgba(' + (t<0)*intensity + ',0,' + (t>=0)*intensity + ',1)';
        return color;
    }

    show() {
        // Get XY coordinates
        var x = [0];
        var y = [0];
        for (var i = 0; i < this.n; i++) {
            x[i+1] = x[i] + this.lens[i]*math.cos(this.ang[i]);
            y[i+1] = y[i] + this.lens[i]*math.sin(this.ang[i]);
        }
        
        // Pendula are currently paused initially until clicked on. This forces getting the energy for the display
        if (this.canvas && this.canvas.frameCount==1) {
            this.getEnergy(y);
        }
        
        // b = true: pendula in action. b = false: pendula paused
        // Update trace and energy only if pendula are in action
        if (b) {
            this.histCount++; // Not using it but I thought it might be handy in the future
            this.posHistory.push([x[this.n],y[this.n]]);
            
            // Keep only up to 500 registers
            this.maxHistory = 500;
            if (this.posHistory.length > this.maxHistory) {
                this.posHistory.shift();
            }
            
            this.getEnergy(y);        
        }
        
        if (!this.canvas) {
            return;
        }

        // Draw trace
        this.canvas.noFill();
        this.canvas.strokeWeight(1);
        for (var i = 1; i < this.posHistory.length; i++) {
            var opac = Math.floor(255*(this.maxHistory - this.posHistory.length + i)/this.posHistory.length);
            this.traceColor.setAlpha(opac);
            this.canvas.stroke(this.traceColor);
            this.canvas.line(this.posHistory[i-1][0],this.posHistory[i-1][1],this.posHistory[i][0],this.posHistory[i][1]);
        }

        // Draw pendula lines and circles
        for (var i = 1; i <= this.n; i++) {
            // Rod
            this.canvas.noFill();
            var color = this.getRodColor(this.T.valueOf()[i-1]);
            //console.log(color);
            this.canvas.stroke(color);
            this.canvas.strokeWeight(2);
            this.canvas.line(x[i-1],y[i-1],x[i],y[i]);
            // Mass
            this.canvas.noStroke();
            this.canvas.fill(this.colors[i-1]);
            this.canvas.ellipse(x[i],y[i],this.rs[i-1],this.rs[i-1]);
        }
        
    }
    
    eulerStep(h) {
        /*
        Euler method implementation
        h: step size
        */
        var y = this.s.clone();
        var k = this.evaluateAt(y);
        this.s = math.add(this.s,math.multiply(k,h));
        
    }
    
    rk4Step(h) {
        /*
        4-th order Runge-Kutta implementation
        h: step size
        */
        var y = this.s.clone();
        var k1 = this.evaluateAt(y);
        var k2 = this.evaluateAt(math.add(y,math.multiply(k1,0.5*h)));
        var k3 = this.evaluateAt(math.add(y,math.multiply(k2,0.5*h)));
        var k4 = this.evaluateAt(math.add(y,math.multiply(k3,    h)));
        
        this.s = math.add(this.s,math.multiply((math.add(math.add(k1,math.multiply(k2,2)), math.add(math.multiply(k3,2), k4))),h/6));
    }
    
    evaluateAt(y) {
        /*
        y: state, column vector containing 'ang' followed by 'angd' (read below)
        Derivative is not an explicit function of time, so I am not requiring that input.
        
        Matrices A, B, C, and D are used in the derivation of the equations:
        A.angdd - B.angd2 = wc + D.t
        -B.angdd - A.angd2 = ws + C.t
        Angles are measured from horizontal-right and positive in clock-wise direction
        ang:   vector containing angular positions
        angd:  vector containing first time derivative of angular positions
        angdd: vector containing second time derivative of angular positions
        angd2: vector containing squares of first time derivative of angular positions
        wc:    vector containing tangential component of weight (respect to their local polar frame)
        ws:    vector containing radial component of weight (respect to their local polar frame)
        t:     vector containing the value of tension by string connecting to previous particle
        */
        var A = math.zeros(this.n,this.n); 
        var B = math.zeros(this.n,this.n);
        var C = math.zeros(this.n,this.n);
        var D = math.zeros(this.n,this.n);
        
        var ang  = y.subset(math.index(math.range(0     ,  this.n))).valueOf();
        var angd = y.subset(math.index(math.range(this.n,2*this.n))).valueOf();
        
        // When n == 1 ang and angd are coming out as scalars and that's breaking several things.
        // These n==1 conditionals are patches
        if (this.n == 1) {
            ang  = [this.ang];
            angd = [this.angd];
        }
        var angd2 = math.square(angd);
        
        // Fill vectors
        var wc;
        var ws;
        if (this.n == 1) {
            wc = this.masses[0] * math.cos(ang[0]) * this.g;
            ws = this.masses[0] * math.sin(ang[0]) * this.g;
        } else {
            var wc = math.multiply(math.dotMultiply(this.masses,math.cos(ang)),this.g);
            var ws = math.multiply(math.dotMultiply(this.masses,math.sin(ang)),this.g);
        }
        
        // Fill matrices
        for (var i = 0; i < this.n; ++i) {
            A.subset(math.index(i,i),this.lens[i]*this.masses[i]);
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
        
        // angdd = (A+D.Cinv.B)inv.[wc - D.Cinv.ws + (B-D.Cinv.A).angd2]
        // Helpers to make angdd more readable
        var Cinv   = math.inv(C);              // Inverse of C
        var DCinv  = math.multiply(D,Cinv);    // D.Cinv
        var DCinvA = math.multiply(DCinv,A);   // D.Cinv.A
        var DCinvB = math.multiply(DCinv,B);   // D.Cinv.B
        var tmp1   = math.add(A,DCinvB);       // (A+D.Cinv.B)
        var tmp2   = math.subtract(B,DCinvA);  // (B-D.Cinv.A)
        
        // angdd = (tmp1)inv. (wc - DCinv.ws + tmp2.angd2)
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
        
        // Get tensions: T = -Cinv.(ws + B.angdd + A.angd2)
        this.T = math.multiply(
            math.multiply(Cinv,-1) ,
            math.add(
                math.add(
                    ws,
                    math.multiply(B,Y2)
                ),
                math.multiply(A,angd2)
            )
        )
        return Y;
    }
    
    getEnergy(y) {
        // Compute energy
        var k = 0; // Kinetic energy
        var v = 0; // Potential energy
        for (var i = 0; i < this.n; i++) {
            var sumr = 0; // Radial component of velocity
            var sumq = 0; // Tangential component of velocity
            for (var j = 0; j <= i; j++) {
                sumr += this.lens[j]*this.angd[j]*math.sin(this.ang[j] - this.ang[i]);
                sumq += this.lens[j]*this.angd[j]*math.cos(this.ang[j] - this.ang[i]);
            }
            k += 0.5*this.masses[i]*(sumr*sumr + sumq*sumq);
            v -= this.masses[i]*this.g*y[i+1]; // Negative since y points down
        }
        
        var totalEnergy = k + v;
        
        // Store initial energy
        if (this.canvas && this.canvas.frameCount == 1) {
            this.initialEnergy = totalEnergy;
        }
        
        // Print to document
        document.getElementById("energy").innerHTML = "Total energy: " + totalEnergy.toFixed(6) + ", Kinetic: " + k.toFixed(6) + ", Potential: " + v.toFixed(6) + ", Change from start: " + (this.initialEnergy - totalEnergy).toFixed(6);
    }
}