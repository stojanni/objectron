import { ObjectDetector, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest'

let vision
let objectDetector
let video = document.getElementById("webcam")
let liveView = document.getElementById("liveView")
let lastVideoTime = -1
let running = false

let wDiff
let hDiff

let highlighters = []
let highlighter
let label


window.onload = async () => {

    //if (navigator.userAgent.includes('Windows')) location.href = 'https://objectron.onrender.com/platform'

    document.addEventListener('touchmove', (e) => {
        e.preventDefault()
    }, { passive: false })

    document.getElementById('close').addEventListener('click', () => document.getElementsByClassName('content')[0].style.display = 'none')

    document.getElementById("models").addEventListener('change', async () => {

        if (!running) vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm")

        objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `/models/${document.getElementById("models").value}`,
                delegate: 'GPU'
            },
            scoreThreshold: 0.5,
            runningMode: 'VIDEO'
        })

        if (!running) {
            if (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
                enableCam()
            else
                toast("Not supported by your browser")

            document.getElementById("logo").remove()
        }

        running = true
        document.getElementById("models").style.display = 'inline'

    })

    fetch('https://objectron.onrender.com/models', {
        method: 'GET',
        body: null
    })
        .then(response => response.json())
        .then(result => {

            result.forEach(model => {
                let option = document.createElement('option')
                option.value = model
                option.textContent = model.slice(0, -7)
                document.getElementById("models").appendChild(option)
            })

            document.getElementById("models").dispatchEvent(new Event('change', {
                'bubbles': true,
                'cancelable': true
            }))

        })

}

/*window.addEventListener('beforeunload', () => {
    if (video.srcObject) {
        let tracks = video.srcObject.getTracks()
        tracks.forEach(track => track.stop())
    }
})

document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
        if (video.srcObject) {
            let tracks = video.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        }
    } else {
        await enableCam()
    }
})*/

function computeScaling() {
    wDiff = video.offsetWidth / video.videoWidth || 1 // fallback to 1
    hDiff = video.offsetHeight / video.videoHeight || 1 // fallback to 1
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
    }).catch(err => toast(err))

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

        highlighter = document.createElement("div")
        highlighter.setAttribute("class", "highlighter")

        label = document.createElement("p")
        label.setAttribute("class", "label")

        highlighter.appendChild(label)
        liveView.appendChild(highlighter)
        highlighters.push(highlighter)

    }

    // Hide all highlighters by default
    highlighters.forEach(h => h.style.display = "none")

    // Update the existing highlighters with new detection results
    result.detections.forEach((detection, index) => {

        highlighter = highlighters[index]
        highlighter.style.display = "block"
        highlighter.style.left = `${detection.boundingBox.originX * wDiff}px`
        highlighter.style.top = `${detection.boundingBox.originY * hDiff}px`
        highlighter.style.width = `${detection.boundingBox.width * wDiff}px`
        highlighter.style.height = `${detection.boundingBox.height * hDiff}px`
        highlighter.addEventListener('click', e => select(e))

        label = highlighter.querySelector(".label")
        label.innerText = `${detection.categories[0].categoryName}`
        label.style.left = `${detection.boundingBox.originX * wDiff}px`
        label.style.top = `${detection.boundingBox.originY * hDiff}px`
        label.style.width = `${detection.boundingBox.width * wDiff - 10}px`

    })
}

function select(e) {
    document.getElementById('title').innerText = e.target.children[0].innerText
    //document.getElementById('description').innerText = item.description
    document.getElementsByClassName('content')[0].style.display = 'flex'
}

const toast = txt => Toastify({
    text: txt,
    gravity: "top",
    position: "left",
    style: {
        background: "#212121",
        marginTop: "60px",
    }
}).showToast()