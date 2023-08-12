let stylesheetText = `
#slider-container {
    --value : 0 ;
    --slider-track-color : #B0EFEF45 ;
    --slider-thumb-color : #fff ;

    width: __SLIDER_WIDTH__;
    height: 1rem ;
    display: flex ;
    align-items: center ;
    justify-content: center ;
    padding: 0 ;
    margin: 0 ;
    flex: 1 1 100%;
    margin: 0;
    margin-top: auto;
}

#__SLIDER_ID__ {
    -webkit-appearance: none;
    appearance: none;

    height: 1rem ;
    width: 100% ;
    margin : 0 ;
    padding: 0 ;

    background-color: #00000000 ;
    outline: none ;
    z-index: 99 ;
}

#slider-track {
    position: absolute ;
    top: calc(50% - 0.25rem);
    left: 0 ;
    width: inherit ;
    height: 0.5rem ;
    border-radius: 0.25rem ;
    background-color: var(--slider-track-color) ;
    overflow: hidden ;
}

#slider-track::before {
    position: absolute ;
    content: "" ;
    left: calc(-100% + 1.5rem) ;
    top : 0 ;
    width : calc(100% - 1rem) ;
    height: 100% ;
    background-color: var(--slider-fill-color) ;
    transition: background-color 300ms ease-out ;
    transform-origin: 100% 0%;
    transform: translateX(calc( var(--value) * 100% )) scaleX(1.2);
}

#__SLIDER_ID__::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width : 1rem ;
    height: 1rem ;
    border-radius: 50% ;
    background-color: var(--slider-thumb-color) ;
    cursor: pointer ;
    z-index: 99 ;
    border: 2px solid var(--slider-fill-color) ;
    transition: border-color 300ms ease-out ;
}

#value {
    position: absolute ;
    bottom: calc(100% + 0.5rem) ;
    left: calc( var(--value) * calc(3.6rem) - 0.85rem) ;
    min-width: 3ch ;
    border-radius: 4px ;
    pointer-events: none ;

    padding: 0.5rem ;
    display: flex ;
    align-items: center ;
    justify-content: center ;

    color: #FFF ;
    background-color: var(--slider-fill-color);
    opacity: 0 ;
    font-weight: 600;

    z-index: 999;

    transition: left 300ms ease-out , opacity 300ms 300ms ease-out , background-color 300ms ease-out ;
}

#value::before {
    position: absolute ;
    content: "" ;
    top: 100% ;
    left: 50% ;
    width: 1rem ;
    height: 1rem ;
    border-radius: 2px ;
    background-color: inherit ;
    transform: translate(-50%,-80%) rotate(45deg);
    z-index: -1 ;
}

#slider-container:hover  #value {
    opacity: 1 ;
} 
` ;

class customSlider extends HTMLElement {
    constructor() {
        super();
        this.value = parseFloat(this.getAttribute("value")) || 0;
        this.min = parseFloat(this.getAttribute("min")) || 0;
        this.max = parseFloat(this.getAttribute("max")) || 100;
        this.trackLength = 100;
        this.step = parseFloat(this.getAttribute("step")) || 1;
        this.sliderWidth = this.getAttribute("slider-width") || "23rem";
        this.sliderId = this.getAttribute("slider-id") || "slider";
        this.valueBubble = this.getAttribute("value-bubble") == "false" ? false : true;

        // this.style.minWidth = "1rem";
        this.style.minHeight = "1rem";
        this.style.position = "relative";

        // Slider Element
        this.root = this.attachShadow({ mode: "open" });

        // Functionality
        this.dragging = false;

        this.create();
        this.update();
    }

    create() {
        let slider = document.createElement("input");
        let sliderContainer = document.createElement("div");
        let sliderTrack = document.createElement("div");
        let value;
        if (this.valueBubble) {
            value = document.createElement("div");
        }
        

        // let style = document.createElement("link");
        // style.rel = "stylesheet" ;
        // style.href = "/src/custom-slider-style.css" ;

        let style = document.createElement("style");
        style.innerHTML = stylesheetText.replace("__SLIDER_WIDTH__", this.sliderWidth).replaceAll("__SLIDER_ID__", this.sliderId);

        // set properties
        slider.type = "range";
        slider.id = this.sliderId;
        slider.min = this.min;
        slider.max = this.max;
        slider.step = this.step;
        if (value) {
            slider.value = this.value;
        }

        // add ids
        sliderContainer.id = "slider-container";
        sliderTrack.id = "slider-track";
        if (value) {
            value.id = "value";
        }

        // add event listeners
        slider.addEventListener("input", this.update.bind(this));

        // Appened Elements
        sliderContainer.appendChild(slider);
        if (value) {
            sliderContainer.appendChild(value);
        }
        
        sliderContainer.appendChild(sliderTrack);
        this.root.appendChild(style);
        this.root.appendChild(sliderContainer);
    }

    update() {
        let track = this.root.getElementById("slider-container");
        let slider = this.root.getElementById(this.sliderId);
        let value = this.root.getElementById("value");
        let secondsS;
        let valuePercentage = slider.value / (this.max - this.min);
        if (this.sliderId==="progressSlider") {
            let counter1 = document.getElementById("counter1");
            let counter2 = document.getElementById("counter2");
            let seconds = Math.floor(slider.value / slider.max * this.trackLength);
            secondsS = seconds;
            let minutes = Math.floor(seconds / 60);
            let hours;
            if (this.trackLength > 3600) {
                hours = Math.floor(minutes / 60);
                let tSeconds = this.trackLength;
                let tMinutes = Math.floor(tSeconds / 60);
                tSeconds = tSeconds - tMinutes * 60;
                let tHours = Math.floor(tMinutes / 60);
                tMinutes = tMinutes - tHours * 60;
                tSeconds = tSeconds.toString();
                tMinutes = tMinutes.toString();
                if (tMinutes.length === 1) {
                    tMinutes = 0 + tMinutes;
                }
                if (tSeconds.length === 1) {
                    tSeconds = 0 + tSeconds;
                }
                counter2.innerText = `${tHours}:${tMinutes}:${tSeconds}`;
            } else {
                let tSeconds = this.trackLength;
                let tMinutes = Math.floor(tSeconds / 60);
                tSeconds = tSeconds - tMinutes * 60;
                tSeconds = tSeconds.toString();
                if (tSeconds.length === 1) {
                    tSeconds = 0 + tSeconds;
                }
                counter2.innerText = `${tMinutes}:${tSeconds}`;
            }

            seconds = seconds - minutes * 60;
            seconds = seconds.toString();
            if (seconds.length === 1) {
                seconds = 0 + seconds;
            }
            if (hours !== undefined) {
                minutes = minutes - hours * 60;
                minutes = minutes.toString();
                if (minutes.length === 1) {
                    minutes = 0 + minutes;
                }
                if (value) {
                    value.innerText = `${hours}:${minutes}:${seconds}`;
                }
                counter1.innerText = `${hours}:${minutes}:${seconds}`;
            } else {
                if (value) {
                    value.innerText = `${minutes}:${seconds}`;
                }
                counter1.innerText = `${minutes}:${seconds}`;
            }
        } else {
            if (this.sliderId==="volumeSlider") {
                value.innerHTML = `${slider.value}%`;
                if (slider.value==="0") {
                    $(".playbar .right .volumeControls img").attr("src", "/img/no-volume.svg")
                } else {
                    $(".playbar .right .volumeControls img").attr("src", "/img/volume.svg")
                }
            }
        }

        track.style.setProperty("--value", valuePercentage);
    }

    setValue(tvalue) {
        let track = this.root.getElementById("slider-container");
        let slider = this.root.getElementById(this.sliderId);
        slider.value = this.max / this.trackLength * tvalue;
        let value = this.root.getElementById("value");
        let valuePercentage = slider.value / (this.max - this.min);
        if (this.sliderId === "progressSlider") {
            let counter1 = document.getElementById("counter1");
            let counter2 = document.getElementById("counter2");
            let seconds = Math.floor(slider.value / slider.max * this.trackLength);
            let minutes = Math.floor(seconds / 60);
            let hours;
            if (this.trackLength > 3600) {
                hours = Math.floor(minutes / 60);
                let tSeconds = this.trackLength;
                let tMinutes = Math.floor(tSeconds / 60);
                tSeconds = tSeconds - tMinutes * 60;
                let tHours = Math.floor(tMinutes / 60);
                tMinutes = tMinutes - tHours * 60;
                tSeconds = tSeconds.toString();
                tMinutes = tMinutes.toString();
                if (tMinutes.length === 1) {
                    tMinutes = 0 + tMinutes;
                }
                if (tSeconds.length === 1) {
                    tSeconds = 0 + tSeconds;
                }
                counter2.innerText = `${tHours}:${tMinutes}:${tSeconds}`;
            } else {
                let tSeconds = this.trackLength;
                let tMinutes = Math.floor(tSeconds / 60);
                tSeconds = tSeconds - tMinutes * 60;
                tSeconds = tSeconds.toString();
                if (tSeconds.length === 1) {
                    tSeconds = 0 + tSeconds;
                }
                counter2.innerText = `${tMinutes}:${tSeconds}`;
            }

            seconds = seconds - minutes * 60;
            seconds = seconds.toString();
            if (seconds.length === 1) {
                seconds = 0 + seconds;
            }
            if (hours !== undefined) {
                minutes = minutes - hours * 60;
                minutes = minutes.toString();
                if (minutes.length === 1) {
                    minutes = 0 + minutes;
                }
                if (value) {
                    value.innerText = `${hours}:${minutes}:${seconds}`;
                }
                counter1.innerText = `${hours}:${minutes}:${seconds}`;
            } else {
                if (value) {
                    value.innerText = `${minutes}:${seconds}`;
                }
                counter1.innerText = `${minutes}:${seconds}`;
            }
        } else {
            if (this.sliderId === "volumeSlider") {
                value.innerHTML = `${slider.value}%`;
                if (slider.value === "0") {
                    $(".playbar .right .volumeControls img").attr("src", "/img/no-volume.svg")
                } else {
                    $(".playbar .right .volumeControls img").attr("src", "/img/volume.svg")
                }
            }
        }


        track.style.setProperty("--value", valuePercentage);
    }

    setSliderColor(color) {
        this.root.setProperty('--slider-fill-color', color);
    }

    addChangeEvent(func) {
        let slider = this.root.getElementById(this.sliderId);

        slider.addEventListener('mouseup', func);
    }

    getSeconds() {
        let slider = this.root.getElementById(this.sliderId);
        let progressPercentage = slider.value / slider.max;
        return Math.floor(progressPercentage * this.trackLength);
    }


}

customElements.define('custom-slider', customSlider);