import { ObjectDetector, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0'

let objectDetector
let video = document.getElementById("webcam")
let liveView = document.getElementById("liveView")
let lastVideoTime = -1

let wDiff
let hDiff

let highlighters = []


window.onload = initializeObjectDetector()

screen.orientation.addEventListener('change', computeScaling)

document.getElementById('close').addEventListener('click', () => document.getElementsByClassName('content')[0].style.display = 'none')

window.addEventListener('beforeunload', () => {
    if (video.srcObject) {
        let tracks = video.srcObject.getTracks()
        tracks.forEach(track => track.stop())
    }
})

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (video.srcObject) {
            let tracks = video.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        }
    } else {
        location.reload()
    }
})

function computeScaling() {
    wDiff = video.offsetWidth / video.videoWidth || 1 // fallback to 1
    hDiff = video.offsetHeight / video.videoHeight || 1 // fallback to 1
}

// Initialize the object detector
async function initializeObjectDetector() {

    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm")

        objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'efficientdet_lite0.tflite',
                delegate: 'GPU'
            },
            scoreThreshold: 0.5,
            runningMode: 'VIDEO'
        })

        if (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
            enableCam()
        else {
            alert("Not supported by your browser")
            return
        }

        document.getElementById("logo").remove()
    }
    catch {
        alert('Model not found')
    }

}

// Enable the live webcam view and start detection.
async function enableCam() {

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia({ video: navigator.userAgent.includes('Windows') ? true : { facingMode: { exact: "environment" } } }).then(stream => {
        video.srcObject = stream
        video.addEventListener("loadeddata", () => {
            computeScaling()
            predictWebcam()
        })
    }).catch(err => {
        console.error(err)
        alert('Cannot enable camera')
    })

}

async function predictWebcam() {

    let nowInMs = Date.now()

    // Detect objects using detectForVideo
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime
        const detections = await objectDetector.detectForVideo(video, nowInMs)
        displayVideoDetections(detections)
    }

    // Call this function again to keep predicting when the browser is ready
    window.requestAnimationFrame(predictWebcam)

}

function displayVideoDetections(result) {

    // If there are more detections than existing highlighters, create the needed ones
    while (highlighters.length < result.detections.length) {

        let highlighter = document.createElement("div")
        highlighter.setAttribute("class", "highlighter")

        let label = document.createElement("p")
        label.setAttribute("class", "label")

        highlighter.appendChild(label)
        liveView.appendChild(highlighter)
        highlighters.push(highlighter)
        
    }

    // Hide all highlighters by default
    highlighters.forEach(h => h.style.display = "none")

    // Update the existing highlighters with new detection results
    result.detections.forEach((detection, index) => {

        let highlighter = highlighters[index]
        highlighter.style.display = "block"
        highlighter.style.left = `${detection.boundingBox.originX * wDiff}px`
        highlighter.style.top = `${detection.boundingBox.originY * hDiff}px`
        highlighter.style.width = `${detection.boundingBox.width * wDiff}px`
        highlighter.style.height = `${detection.boundingBox.height * hDiff}px`

        let label = highlighter.querySelector(".label")
        label.innerText = `${detection.categories[0].categoryName}`
        label.style.left = `${detection.boundingBox.originX * wDiff}px`
        label.style.top = `${detection.boundingBox.originY * hDiff}px`
        label.style.width = `${detection.boundingBox.width * wDiff}px`
        label.addEventListener('click', () => document.getElementsByClassName('content')[0].style.display = 'flex')

    })
}


//if (navigator.userAgent.includes('Windows')) location.href = 'https://objectron.onrender.com/platform'