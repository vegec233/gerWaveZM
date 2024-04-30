const singleSineWave = (p) => {
  let amplitude = 20;
  let wavelength = 200;
  let r = 6;
  let canvas;
  let slider;
  
  p.setup = () => {
    canvas = p.createCanvas(600, 400);
    canvas.parent('sketchContainer');
    slider = p.createSlider(0, 45, 50, 1);
    slider.parent('sliderContainer');
    slider.input(p.updateAmplitude);
  };

  p.draw = () => {
    p.background(0);
    p.strokeWeight(2);
    // Axes
    p.stroke(0,255,0);
    p.line(p.width/2,0,p.width/2,p.height);
    p.line(0,p.height/2,p.width,p.height/2);

    p.translate(300, 200); // Translate to center point

    //Show wave motion
    for (let x = -300; x <= 300; x += 20) { // Generate points with different x coordinates
      let y = amplitude * p.sin((p.TWO_PI / wavelength) * (x-p.frameCount)); // Changing y coordinates
      p.stroke(0,255,0);
      p.fill(12, 238, 233);// Points
      p.circle(x, y, r);
      p.stroke(255);  
      p.line(x, 0, x, y); // Show each point's moving trail
    }
  };

  p.updateAmplitude = () => { // Update slider value
    amplitude = slider.value();
  };
};

const sineWaves = (p) => {
  let amplitudes = [20, 40, 60, 80];
  let wavelengths = [100, 150, 200, 250];
  let r = 6;
  let canvas;
  let sliders = [];

  p.setup = () => {
    canvas = p.createCanvas(600, 400);
    canvas.parent('sketchContainer1');
    
    for (let i = 0; i < 4; i++) { // Create four sliders
      let slider = p.createSlider(0, 45, amplitudes[i], 1);
      slider.parent('sliderContainer1');
      slider.input(p.updateAmplitude);
      sliders.push(slider);
    }
  };

  p.draw = () => {
    p.background(0);
    p.stroke(0, 255, 0);

    p.line(p.width / 2, 0, p.width / 2, p.height);
    p.line(0, p.height / 2, p.width, p.height / 2);

    p.strokeWeight(2);
    p.translate(300, 200);
    p.fill(12, 238, 233);

    for (let x = -300; x <= 300; x += 20) {
      let y = 0;
      // Sum of four waves with different amplitudes
      for (let i = 0; i < 4; i++) {  
        let y1 = amplitudes[i] * p.sin((p.TWO_PI / wavelengths[i]) * (x + p.frameCount));
        y += y1;
      }

      p.stroke(0, 255, 0);
      p.fill(12, 238, 233);
      p.circle(x, y, r);
      p.noFill();
      p.stroke(255);
      p.line(x, 0, x, y);
    }
  };

  p.updateAmplitude = () => {
    for (let i = 0; i < 4; i++) {
      amplitudes[i] = sliders[i].value(); // Update four sliders' values
    }
  };
};

const singleGerstnerWave = (p) => { 
  let amplitude = 20;
  let wavelength = 200;
  let r = 6;
  let canvas;
  let slider;
  
  p.setup = () => {
    canvas = p.createCanvas(600, 400);
    canvas.parent('sketchContainer2');
    slider = p.createSlider(0, 45, 50, 1);
    slider.parent('sliderContainer2');
    slider.input(p.updateAmplitude);
  };

  p.draw = () => {
    p.background(0);
    p.strokeWeight(2);
    // Axes
    p.stroke(0,255,0);
    p.line(p.width/2,0,p.width/2,p.height);
    p.line(0,p.height/2,p.width,p.height/2);

    p.translate(300, 200);
    p.fill(12, 238, 233);

    // Draw the circle 
    for (let x = -300; x <= 300; x += 20) {
      //Gerstner wave formual in 2D from dawing a circle
      let x1 = amplitude * p.cos((p.TWO_PI / wavelength) * (x + p.frameCount));
      let y = amplitude * p.sin((p.TWO_PI / wavelength) * (x + p.frameCount));

      p.stroke(0,255,0);
      p.fill(12, 238, 233);
      p.circle(x1-x, y, r);
      p.noFill();
      p.stroke(255);
      p.circle(x, 0, amplitude*2); // Show the points' moving trail
    }
  };

  p.updateAmplitude = () => {
    amplitude = slider.value();
  };
};
 
const multiGerstnerWave = (p) => { // Sum of four gerstner waves
  let amplitudes = [30, 30, 30, 30];
  let wavelengths = [200, 150, 100, 75];
  let r = 7;

  let sliders = [];

  p.setup = () => {
    canvas = p.createCanvas(600, 400);
    canvas.parent('sketchContainer3');

    for (let i = 0; i < amplitudes.length; i++) {
      sliders[i] = p.createSlider(0, 45, amplitudes[i], 1);
      sliders[i].parent('sliderContainer3');
      sliders[i].input(() => {
        amplitudes[i] = sliders[i].value();
      });
    }
  };

  p.draw = () => {
    p.background(0);
    p.strokeWeight(2);
    p.stroke(0, 255, 0);
    p.line(p.width / 2, 0, p.width / 2, p.height);
    p.line(0, p.height / 2, p.width, p.height / 2);

    p.translate(300, 200);
    p.fill(12, 238, 233);

    for (let x = -300; x <= 300; x += 10) {
      let sumX = 0;
      let sumY = 0;

      for (let i = 0; i < amplitudes.length; i++) {
        // Sum of four gerstner waves with different amplitudes and wavelength
        let xWave = amplitudes[i] * p.cos((p.TWO_PI / wavelengths[i]) * (x + p.frameCount));
        let yWave = amplitudes[i] * p.sin((p.TWO_PI / wavelengths[i]) * (x + p.frameCount));
        sumX += xWave;
        sumY += yWave;
      }

      p.stroke(0, 255, 0);
      p.fill(12, 238, 233);

      p.circle(sumX - x * amplitudes.length, sumY, r); // Draw Points
      p.noFill();
      p.stroke(255);

      p.circle(sumX - x * amplitudes.length, 0, (sumY) * 2); // Draw moving tails
    }
  }
};
 
new p5(singleSineWave);
new p5(sineWaves);
new p5(singleGerstnerWave);
new p5(multiGerstnerWave);

 