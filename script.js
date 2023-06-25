import { ObjectDetector, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0'

let objectDetector
let video = document.getElementById("webcam")
let liveView = document.getElementById("liveView")
let children = [] // Keep a reference of all the child elements we create so we can remove them easilly on each render.
let lastVideoTime = -1

// Initialize the object detector
const initializeObjectDetector = async () => {

    let model = null

    do {

        model = prompt('Enter your email:')

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
            model = null
        }

    } while (model == null)

}

// Enable the live webcam view and start detection.
async function enableCam(event) {

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } }).then(stream => {
        video.srcObject = stream
        video.addEventListener("loadeddata", predictWebcam)
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

    // Remove any highlighting from previous frame.
    for (let child of children)
        liveView.removeChild(child)

    children.splice(0)

    // Iterate through predictions and draw them to the live view
    for (let detection of result.detections) {

        const p = document.createElement("p")
        p.innerText = `${detection.categories[0].categoryName} - ${Math.round(parseFloat(detection.categories[0].score) * 100)}% confidence.`
        p.style = `left: ${video.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px; top: ${detection.boundingBox.originY}px; width: ${detection.boundingBox.width - 10}px;`

        const highlighter = document.createElement("div")
        highlighter.setAttribute("class", "highlighter")
        highlighter.style = `left: ${video.offsetWidth - detection.boundingBox.width - detection.boundingBox.originX}px; top: ${detection.boundingBox.originY}px; width: ${detection.boundingBox.width - 10}px; height: ${detection.boundingBox.height}px;`

        liveView.appendChild(highlighter)
        liveView.appendChild(p)

        // Store drawn objects in memory so they are queued to delete at next call
        children.push(highlighter)
        children.push(p)

    }

}

initializeObjectDetector()
