import './lib/webaudio-controls.js';


const getBaseURL = () => {
	const base = new URL('.', import.meta.url);
	return `${base}`;
}


const template = document.createElement("template");
template.innerHTML = `
<style>
    h1 {
      color : black
    }

    div {
      border: 2px solid black;
      width: 1024px;
      height: 1024px;
      text-align: center;
      background-image: url("https://www.pixelstalk.net/wp-content/uploads/2016/08/1080-x-1920-HD-Wallpaper-Vertical.jpg");
      margin-left: 180px;
      
    }

    .Button {
      background-color: #e7e7e7; 
      color: black;
      font-size: 25px;
      border-radius: 50%;

    }

    .allCanvas{
      background-image: url("https://c4.wallpaperflare.com/wallpaper/307/863/729/music-1920x1080-music-notes-music-notes-wallpaper-preview.jpg");
    }



</style>

<div id = "monLecteur">
    <h1>Ici le lecteur audio de Hassan Mazyad</h1>

    <br>
    <h3>URL Mp3: </h3>
    <input id = "URL" type="text" id="textinput">
    <br>

    <audio id= "myPlayer" crossorigin>
        <source src="https://mainline.i3s.unice.fr/mooc/LaSueur.mp3" type="audio/ogg" />
    </audio>
    <br>
    <br>
    <webaudio-knob id="timer" src="./assets/imgs/Number.png" ></webaudio-knob>
    <br>
    <br>
    <button class = "Button" id = "moins10">-10</button>
    
    <button class = "Button" id = "replayButton">Replay</button>
    
    <button class = "Button" id = "plus10">+10</button>
    <br>
    
    <br>
    <br>

    

    <webaudio-knob id="angel1" src="./assets/imgs/ANGEL_Sewage_62x62knob.png" >Effect 1</webaudio-knob>
   

    <webaudio-switch class = "OnOff" id="Canvas1OnOff" " src="./assets/imgs/Power_switch_01.png" value="1">frequencies</webaudio-switch>
    <webaudio-switch class = "OnOff" id="Canvas2OnOff"  src="./assets/imgs/Power_switch_01.png" value="1" >waveform</webaudio-switch>
    <webaudio-switch class = "OnOff" id="Canvas3OnOff" src="./assets/imgs/Power_switch_01.png" value="1">volume meter</webaudio-switch>
    
    
    <webaudio-knob id="angel2" src="./assets/imgs/ANGEL_Sewage_62x62knob.png" >Effect 2</webaudio-knob>
    <br>
    
    <br>
    <br>
    <webaudio-switch id="OnOff" src="./assets/imgs/switch_metal.png" value = "1" width="64" height="64"></webaudio-switch>
    <br>
    <webaudio-knob id="vernier" src="./assets/imgs/vernier.png" width="120" height="120" ></webaudio-knob>
    
    <webaudio-knob id="knobVolume" tooltip="Volume:%s" src="./assets/imgs/LittlePhatty.png" value="0.5" min="0" max="1" step="0.01"></webaudio-knob>

    <webaudio-knob id="ProgressVisu" tooltip="currentTime:%s" src="./assets/imgs/Vintage_Knob.png" min="0"></webaudio-knob>

    <webaudio-knob id="knobBalance" tooltip="Balance:%s" src="./assets/imgs/MiniMoog_Main.png" value = "0" min="-1" max="1" step="0.1"></webaudio-knob>
   
    <webaudio-knob id="VUMeter" src="./assets/imgs/Vintage_VUMeter.png" step="3"></webaudio-knob>
   
    <br>
    <br>
    <br>
    <canvas id="myCanvas" class="allCanvas" width="300" height="200"></canvas>
    <canvas id="myCanvas2" class="allCanvas" width="300" height="200"></canvas>
    <canvas id="myCanvas3" class="allCanvas" width="300" height="200"></canvas>
    <br>

    

</div>
` ;

class MyAudioPlayer extends HTMLElement {

  constructor() {
    super();
    this.volume = 0.4;
    this.attachShadow({ mode: "open" });
    
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.basePath = getBaseURL();
    this.fixRelativeImagePaths();

  }


  connectedCallback() {

    this.value1 = 95;
    this.value2 = 30;


    this.vis1 = 0;
    this.vis2 = 0;
    this.vis3 = 0;

    this.player = this.shadowRoot.querySelector("#myPlayer");
    this.player.loop = true;

    //canvas1
    this.canvas = this.shadowRoot.querySelector("#myCanvas");
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.canvasContext = this.canvas.getContext("2d");

    //canvas2
    this.canvas2 = this.shadowRoot.querySelector("#myCanvas2"); 
    this.canvasContext2 = this.canvas2.getContext('2d');

    //canvas3
    this.canvas3 = this.shadowRoot.querySelector("#myCanvas3"); 
    this.canvasContext3 = this.canvas3.getContext('2d');


    this.gradient = this.canvasContext3.createLinearGradient(0,0,0, this.height);
    this.gradient.addColorStop(1,'#000000');
    this.gradient.addColorStop(0.75,'#ff0000');
    this.gradient.addColorStop(0.25,'#ffff00');
    this.gradient.addColorStop(0,'#ffffff');


    //balance editor
    this.audioContext = new AudioContext();
    this.playerNode = this.audioContext.createMediaElementSource(this.player);
    this.pannerNode = this.audioContext.createStereoPanner();
    this.playerNode.connect(this.pannerNode).connect(this.audioContext.destination); //connect to the speakers
   
    // Create an analyser node
    this.analyser = this.audioContext.createAnalyser();

    // Try changing for lower values: 512, 256, 128, 64...
    this.analyser.fftSize = 1024;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.playerNode.connect(this.pannerNode);
    this.playerNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.visualize();
    this.visualize2();
    this.visualize3();

    this.playWithAudio();

    this.declareListeners();  
  }

  //canvas1

  visualize() {

    if (this.vis1 == 0){
      this.canvasContext.clearRect(0, 0, this.width, this.height);
      this.canvasContext.strokeStyle = 'lightBlue';
      this.canvasContext.fillStyle = ('rgba(0,0,0,0.5)');
      this.canvasContext.lineWidth =2;
      
      this.analyser.getByteFrequencyData(this.dataArray);
      var barWidth = this.width / this.bufferLength;
        var barHeight;
        var x = 0;
        let heightScale = this.height/128;
        for(var i = 0; i < this.bufferLength; i++) {
          barHeight = this.dataArray[i];

          this.canvasContext.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          barHeight *= heightScale;
          this.canvasContext.fillRect(x, this.height-barHeight/2, barWidth, barHeight/2);
          x += barWidth + 1;
          }

        this.canvasContext.stroke();
      // call again the visualize function at 60 frames/s
      requestAnimationFrame(() => {this.visualize()});
    }
  }


  //canvas2

  visualize2() {

      if (this.vis2 == 0){

      this.canvasContext2.clearRect(0, 0, this.width, this.height);
      this.canvasContext2.fillStyle = 'rgba(0, 0, 0, 0.5)';
      
      // Get the analyser data
      this.analyser.getByteTimeDomainData(this.dataArray);
    
      this.canvasContext2.lineWidth = 2;
      this.canvasContext2.strokeStyle = 'lightBlue';
    
      this.canvasContext2.beginPath();
      
      var sliceWidth = this.width / this.bufferLength;
      var x = 0;
    
      for(var i = 0; i < this.bufferLength; i++) {
        // normalize the value, now between 0 and 1
        var v = this.dataArray[i] / 255;
        
        // We draw from y=0 to height
        var y = v * this.height;
    
        if(i === 0) {
            this.canvasContext2.moveTo(x, y);
        } else {
            this.canvasContext2.lineTo(x, y);
        }
    
        x += sliceWidth;
      }
    
      this.canvasContext2.lineTo(this.width, this.height/2);
    
      // draw the path at once
      this.canvasContext2.stroke();  
      
      // call again the visualize function at 60 frames/s
      requestAnimationFrame(() => {this.visualize2()});
    }
    
  }


  //canvas3

  visualize3() {
    if (this.vis3 == 0) {
      this.canvasContext3.clearRect(0, 0, this.width, this.height);
      this.canvasContext3.fillStyle = 'rgba(0, 0, 0, 0.5)';
      
      this.canvasContext3.save();
      this.analyser.getByteFrequencyData(this.dataArray);
      this.average = this.getAverageVolume(this.dataArray);
      this.canvasContext3.fillStyle=this.gradient;
      this.canvasContext3.fillRect(0,this.height-this.average,25,this.height);
      this.canvasContext3.restore();
      

      this.canvasContext3.save();

      this.analyser.getByteTimeDomainData(this.dataArray);
  
      this.canvasContext3.lineWidth = 2;
  
      this.canvasContext3.strokeStyle = 'lightBlue';
  
      this.canvasContext3.beginPath();
      
      var sliceWidth = this.width / this.bufferLength;
      var x = 0;
      this.heightScale = this.height/128;
    
      for(var i = 0; i < this.bufferLength; i++) {
         var v = this.dataArray[i] / 255;
         var y = v * this.height;
        
         if(i === 0) {
            this.canvasContext3.moveTo(x, y);
         } else {
            this.canvasContext3.lineTo(x, y);
         }
    
         x += sliceWidth;
      }
      this.canvasContext3.lineTo(this.width, this.height/2);
      this.canvasContext3.stroke();    
      this.canvasContext3.restore();

      requestAnimationFrame(() => {this.visualize3()});
    }
  }


//playWithAudio
playWithAudio(){
  this.filter = this.audioContext.createBiquadFilter();
  this.playerNode.connect(this.filter);
  this.filter.connect(this.audioContext.destination);
  this.filter.frequency.value = this.value1;
  this.filter.gain.value = this.value2;
}


  
  getAverageVolume(array) {
    var values = 0;
    var average;
    var length = array.length;  
    for (var i = 0; i < length; i++) {
       values += array[i];
    }
    average = values / length;
      return average;
 }
  
  
  fixRelativeImagePaths() {
		// change webaudiocontrols relative paths for spritesheets to absolute
		let webaudioControls = this.shadowRoot.querySelectorAll(
			'webaudio-knob, webaudio-slider, webaudio-switch, img'
		);
		webaudioControls.forEach((e) => {
			let currentImagePath = e.getAttribute('src');
			if (currentImagePath !== undefined) {
				let imagePath = e.getAttribute('src');
        e.src = this.basePath + "/" + imagePath;
			}
    });
    
    let sliders = this.shadowRoot.querySelectorAll('webaudio-slider');
		sliders.forEach((e) => {
			let currentImagePath = e.getAttribute('knobsrc');
			if (currentImagePath !== undefined) {
				console.log('Got img src as ' + e.getAttribute('src'));
				let imagePath = e.getAttribute('knobsrc');
        e.src = this.basePath + '/' + imagePath;
			}
		});
  }

  declareListeners(){

    this.shadowRoot.querySelector("#angel1").addEventListener("input", (event)=>{
      let p = this.shadowRoot.querySelector("#angel1");
      this.value1 = p.value;
      this.playWithAudio();
    });

    this.shadowRoot.querySelector("#angel2").addEventListener("input", (event)=>{
      let p = this.shadowRoot.querySelector("#angel2");
      this.value2 = p.value ;
      this.playWithAudio();
    });


    this.shadowRoot.querySelector("#knobVolume").addEventListener("input", (event)=>{
        this.setVolume(event.target.value);
    });

    this.shadowRoot.querySelector("#knobBalance").addEventListener("input", (event)=>{
      this.setBalance(event.target.value);
    });

    this.shadowRoot.querySelector("#OnOff").addEventListener("click", (event)=>{
      let p = this.shadowRoot.querySelector("#OnOff");
      if(p.value === 0){
        this.play();
      }
      else{
        this.pause();
      }
    });
    
    this.player.addEventListener('timeupdate' , (event) => {
      let p = this.shadowRoot.querySelector("#ProgressVisu");
      try{
        p.max = this.player.duration;
        p.value = this.player.currentTime;
      } catch{
          return;
      }
    });


    this.player.addEventListener('timeupdate' , (event) => {
      let p = this.shadowRoot.querySelector("#VUMeter");
      p.value = this.getAverageVolume(this.dataArray)%50;
    });

    this.player.addEventListener('timeupdate' , (event) => {
      let p = this.shadowRoot.querySelector("#vernier");
      p.value = this.getAverageVolume(this.dataArray)%100;
    });

    this.player.addEventListener('timeupdate' , (event) => {
      let p = this.shadowRoot.querySelector("#timer");
      p.value = this.player.currentTime;
    });


    this.shadowRoot.querySelector("#replayButton").addEventListener("click", (event)=>{
      this.replay();
    });

    this.shadowRoot.querySelector("#plus10").addEventListener("click", (event)=>{
      this.player.currentTime+=10;
    });

    this.shadowRoot.querySelector("#moins10").addEventListener("click", (event)=>{
      this.player.currentTime-=10;
    });

    this.shadowRoot.querySelector("#URL").addEventListener("input", (event)=>{
      this.setURL(event.target.value);
    });
    

    this.shadowRoot.querySelector("#Canvas1OnOff").addEventListener("change", (event)=>{
      let p = this.shadowRoot.querySelector("#Canvas1OnOff");
      if(p.value === 1){
        this.vis1 = 0;
        this.visualize();
      }
      else {
        this.vis1 = 1;
        this.canvasContext.clearRect(0, 0, this.width, this.height);
      }     
    });

    this.shadowRoot.querySelector("#Canvas2OnOff").addEventListener("change", (event)=>{
      let p = this.shadowRoot.querySelector("#Canvas2OnOff");
      if(p.value === 1){
        this.vis2 = 0;
        this.visualize2();
      }
      else {
        this.vis2 = 1;
        this.canvasContext2.clearRect(0, 0, this.width, this.height);
      }     
    });

    this.shadowRoot.querySelector("#Canvas3OnOff").addEventListener("change", (event)=>{
      let p = this.shadowRoot.querySelector("#Canvas3OnOff");
      if(p.value === 1){
        this.vis3 = 0;
        this.visualize3();
      }
      else {
        this.vis3 = 1;
        this.canvasContext3.clearRect(0, 0, this.width, this.height);
      }     
    });

    
  }

  //API
  setVolume(val) {
    this.player.volume = val;
  }

  play(){
      this.player.play();
  }

  pause(){
    this.player.pause();
  }

  replay(){
    this.player.currentTime = 0;
  }

  setBalance(val){
    this.pannerNode.pan.value = val;
  }

  setURL(url){
    this.player.src = url;
  }

}

customElements.define("my-audioplayer", MyAudioPlayer);