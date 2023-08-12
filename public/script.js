import { ObjectDetector, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0'

let objectDetector
let video = document.getElementById("webcam")
let liveView = document.getElementById("liveView")
let childrenPool = []
let activeChildren = []
let lastVideoTime = -1
let model

let wDiff
let hDiff

let frameCount = 0 // Number of frames processed
let lastTimestamp = 0 // Last timestamp FPS was calculated


window.addEventListener('resize', computeScaling)

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
const initializeObjectDetector = async () => {

    try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm")

        objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `${model}.tflite`,
                delegate: 'GPU'
            },
            scoreThreshold: 0.5,
            runningMode: 'VIDEO'
        })

        if (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) enableCam()
        else console.warn("Not supported by your browser")
    }
    catch {
        alert('Wrong email')
        location.reload()
    }

}

// Enable the live webcam view and start detection.
async function enableCam() {

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia({ video: true/*{ facingMode: { exact: "environment" } }*/ }).then(stream => {
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

async function predictWebcam(timestamp) {

    frameCount++
    let elapsedTime = timestamp - lastTimestamp
    if (elapsedTime >= 1000) { // 1000 ms = 1 second
        let fps = frameCount / (elapsedTime / 1000)
        document.getElementsByClassName('fpsDisplay')[0].innerText = `FPS: ${fps.toFixed(2)}` // Display the FPS rounded to two decimal places
        frameCount = 0
        lastTimestamp = timestamp
    }

    //----------------------------------------

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

    // Remove text elements from the previous frame
    for (let child of activeChildren) {
        if (child.tagName === 'P') {
            liveView.removeChild(child)
        }
    }

    // Move all active highlighters to the pool
    while (activeChildren.length > 0) {
        let child = activeChildren.pop()
        if (child.tagName === 'DIV') {
            child.style.visibility = 'hidden'
            childrenPool.push(child)
        }
    }

    // Iterate through predictions and update or create new highlight boxes
    for (let detection of result.detections) {

        let highlighter

        if (childrenPool.length > 0) {
            highlighter = childrenPool.pop()
            highlighter.style.visibility = 'visible'
        } else {
            highlighter = document.createElement("div")
            highlighter.setAttribute("class", "highlighter")
            liveView.appendChild(highlighter)
        }

        // Set highlighter box properties
        highlighter.style.left = `${detection.boundingBox.originX * wDiff}px`
        highlighter.style.top = `${detection.boundingBox.originY * hDiff}px`
        highlighter.style.width = `${detection.boundingBox.width * wDiff}px`
        highlighter.style.height = `${detection.boundingBox.height * hDiff}px`

        activeChildren.push(highlighter)

        if (!document.getElementsByClassName('fpsDisplay')[0].innerText.includes(detection.categories[0].categoryName))
            document.getElementsByClassName('fpsDisplay')[0].innerText += ` - ${detection.categories[0].categoryName}`

        // Create and add the label (text)
        /*const p = document.createElement("p")
        p.innerText = `${detection.categories[0].categoryName} - ${Math.round(parseFloat(detection.categories[0].score) * 100)}% confidence.`
        p.style = `left: ${detection.boundingBox.originX * wDiff}px; top: ${detection.boundingBox.originY * hDiff}px; width: ${(detection.boundingBox.width * wDiff - 10)}px;`
        liveView.appendChild(p)
        activeChildren.push(p)*/

    }

}

window.focus()
model = prompt('Enter your email:', 'efficientdet_lite0')
initializeObjectDetector()