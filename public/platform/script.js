let drawing = false
let rectangles = []
let currentSecond = 0
let loaded = false
let selectedLabel = ''
let video

let details = {}

const videoElement = document.getElementById('video')

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const canvas1 = document.getElementById('canvas1')
const ctx1 = canvas1.getContext('2d')

const list = document.getElementById('list')

ctx.fillStyle = '#212121'
ctx.fillRect(0, 0, canvas.width, canvas.height)

//----------------------------------------------------------------------

if (!navigator.userAgent.includes('Windows')) location.href = 'https://objectron.onrender.com'

canvas1.style.top = `${canvas.getBoundingClientRect().top}px`
canvas1.style.left = `${canvas.getBoundingClientRect().left}px`

window.addEventListener("resize", e => resize(e))

document.getElementById(`videoFile`).addEventListener('change', e => videoFileLoaded(e))
document.getElementById(`video`).addEventListener('loadedmetadata', e => videoLoaded(e))
document.getElementById(`video`).addEventListener('seeked', drawSecond)

document.getElementById(`canvas1`).addEventListener('mousedown', e => mouseDown(e))
document.getElementById(`canvas1`).addEventListener('mousemove', e => mouseMove(e))
document.getElementById(`canvas1`).addEventListener('mouseup', mouseUp)

document.getElementById(`addLabel`).addEventListener('click', addLabel)
document.getElementById(`removeLabel`).addEventListener('click', removeLabel)

document.getElementById(`itemImage`).addEventListener('change', e => imageFileLoaded(e))
document.getElementById(`description`).addEventListener('change', e => descriptionChanged(e))

document.getElementById(`export`).addEventListener('click', exportData)

document.onkeyup = (e) => {

    if (document.activeElement.id == 'canvas') {
        if (e.code == 'KeyA') changeSecond(-0.04)
        else if (e.code == 'KeyD') changeSecond(0.04)
        else if (e.code == 'Space') changeSecond(0)
    } else if (document.activeElement.id == 'labelInput') {
        if (e.code == 'Enter') addLabel()
    }

}

//----------------------------------------------------------------------

/*introJs().setOptions({
    showBullets: false,
    steps: [{
        title: 'Guide',
        intro: "Welcome to Lens!"
    }, {
        element: document.getElementById('uploadVideo'),
        title: 'Step 1:',
        intro: "Upload a video."
    },
    {
        element: document.getElementById('buttonsLeft'),
        title: 'Step 2:',
        intro: "Add/remove labels in this format (Label-ID). Each label should have a unique id number."
    },
    {
        element: document.getElementById('shortcuts'),
        title: 'Step 3:',
        intro: "Use the buttons to move through the frames and annotate objects. At least 100 per object."
    },
    {
        element: document.getElementById('export'),
        title: 'Step 4:',
        intro: "Export the data for training."
    }]
}).start()*/

//----------------------------------------------------------------------

function resize() {
    canvas1.style.top = `${canvas.getBoundingClientRect().top}px`
    canvas1.style.left = `${canvas.getBoundingClientRect().left}px`
}

//load file to video tag
function videoFileLoaded(e) {

    console.log('videoFileLoaded')

    video = e.target.files[0]
    videoElement.src = URL.createObjectURL(video)

}

function videoLoaded(e) {

    console.log('videoLoaded')

    canvas.width = (canvas.height * e.target.videoWidth) / e.target.videoHeight
    canvas1.width = canvas.width

    canvas1.style.top = `${canvas.getBoundingClientRect().top}px`
    canvas1.style.left = `${canvas.getBoundingClientRect().left}px`

    loaded = true
    videoElement.currentTime = 0

    document.getElementById('addLabel').disabled = false
    document.getElementById('labelInput').disabled = false
}

//load file to video tag
function imageFileLoaded(e) {

    console.log('imageFileLoaded')

    details[selectedLabel] = {
        image: e.target.files[0],
        description: details[selectedLabel] ? details[selectedLabel].description : ''
    }

    document.getElementById('imageFilename').innerText = `Select image... (${e.target.files[0].name})`

}

function descriptionChanged(e) {

    console.log('descriptionChanged')

    details[selectedLabel] = {
        image: details[selectedLabel] ? details[selectedLabel].image : null,
        description: e.target.value
    }

    console.log(details)
}

function addLabel() {

    console.log('addLabel')

    if (document.getElementById('labelInput').value == '') return

    //add label
    listItem = document.createElement('li')
    listItem.id = 'item'
    listItem.innerText = document.getElementById('labelInput').value.replace(/ /g, '').toUpperCase()
    listItem.style.cursor = 'pointer'
    listItem.addEventListener('click', e => selectLabel(e))
    list.appendChild(listItem)

    //enable remove btn
    document.getElementById('removeLabel').disabled = false

    //if its first make it bold
    if (list.getElementsByTagName('li').length == 1) {
        selectedLabel = list.getElementsByTagName('li')[0].innerText
        list.getElementsByTagName('li')[0].style.fontWeight = 'bold'
    }

    //clear input
    document.getElementById('labelInput').value = ''

    //enable details btns
    document.getElementById('itemImage').disabled = false
    document.getElementById('description').disabled = false

}

function selectLabel(e) {

    console.log('selectLabel')

    selectedLabel = e.target.innerText
    for (let element of list.children) element.style.fontWeight = 'normal'
    e.target.style.fontWeight = 'bold'

}

function removeLabel() {

    console.log('removeLabel')

    //clean up boxes
    rectangles = rectangles.filter(element => element.label != selectedLabel)

    //remove list item
    for (let i = 0; i < list.children.length; i++)
        list.children[i].innerText == selectedLabel ? list.removeChild(list.children[i]) : null

    //remove details item
    delete details[selectedLabel]

    //if left one make it bold otherwise disable btns
    if (list.children.length > 0) {
        selectedLabel = list.children[0].innerText
        for (let element of list.children) element.style.fontWeight = 'normal'
        list.children[0].style.fontWeight = 'bold'
    } else {
        selectedLabel = ''
        document.getElementById('removeLabel').disabled = true
        document.getElementById('itemImage').disabled = true
        document.getElementById('description').disabled = true
    }

}

function mouseDown(e) {

    console.log('mouseDown')

    if (!loaded || selectedLabel == '') return

    drawing = true

    const rectangleObject = {
        x: e.offsetX,
        y: e.offsetY,
        width: 0,
        height: 0,
        label: selectedLabel,
        second: currentSecond
    }

    rectangles.push(rectangleObject)
}

function mouseMove(e) {

    if (loaded) {
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height)
        ctx1.strokeStyle = 'lightblue'
        ctx1.beginPath()
        ctx1.moveTo(e.offsetX, 0)
        ctx1.lineTo(e.offsetX, canvas1.height)
        ctx1.moveTo(0, e.offsetY)
        ctx1.lineTo(canvas1.width, e.offsetY)
        ctx1.stroke()
    }

    if (!drawing) return

    console.log('mouseMove')

    if (e.offsetX < rectangles[rectangles.length - 1].x || e.offsetY < rectangles[rectangles.length - 1].y) {
        rectangles.pop()
        drawing = false
        drawSecond()
        toast('Draw the rectangle from top left to bottom right')
        return
    }

    rectangles[rectangles.length - 1].width = e.offsetX - rectangles[rectangles.length - 1].x
    rectangles[rectangles.length - 1].height = e.offsetY - rectangles[rectangles.length - 1].y

    drawSecond()

}

function mouseUp() {

    console.log('mouseUp')

    if (!drawing) return
    drawing = false

    if (rectangles[rectangles.length - 1] == null) return

    if (rectangles[rectangles.length - 1].width < 10 || rectangles[rectangles.length - 1].height < 10) {
        toast('Too small')
        rectangles.pop()
        drawSecond()
        return
    }

}

function drawSecond() {

    //console.log('drawSecond')

    document.getElementById('frameCount').innerHTML = `<b>Second</b>: ${Math.round(currentSecond * 100) / 100}/${Math.round(videoElement.duration * 100) / 100} (25fps)`

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    rectangles.forEach(rect => {
        if (rect.second == currentSecond) {
            ctx.lineJoin = 'round'
            ctx.lineWidth = 1
            ctx.strokeStyle = 'lightblue'
            ctx.font = '14px Courier'
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
            ctx.strokeText(rect.label, rect.x + rect.width + 2, rect.y + rect.height - 5)
        }
    })
}


function changeSecond(value) {

    //console.log('changeSecond')

    if (value == 0) {
        rectangles = rectangles.filter(rect => rect.second != currentSecond)
        drawSecond()
        return
    }

    currentSecond += value
    currentSecond = clamp(currentSecond, 0, videoElement.duration)
    videoElement.currentTime = currentSecond

}

async function exportData() {

    console.log('exportData')

    if (!video || list.children.length == 0) {
        toast("Video & labels required")
        return
    }

    document.getElementById('export').disabled = true

    let model = ''
    while (model == '') prompt("Enter your a model name:")

    const formData = new FormData()
    formData.append('file', video)
    formData.append('trainJSON', JSON.stringify(generateAnnotationJson(true)))
    formData.append('validationJSON', JSON.stringify(generateAnnotationJson(false)))
    formData.append('model', model)

    fetch(`${window.location.href.replace('platform/', 'upload')}`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.text())
        .then(result => toast(result))

}

function generateAnnotationJson(train) {

    console.log('generateAnnotationJson')

    let images = []
    let boxes = []
    let categories = []

    //cleanup
    rectangles.filter(rectangle => rectangle && rectangle.width > 10 && rectangle.height > 10)
    let arr = [...list.children].map(element => element.textContent || element.value)
    let point = videoElement.duration * 80 / 100

    //images
    for (let i = 0; i < videoElement.duration; i += 0.04) {

        if (train && i >= point || !train && i < point) continue

        images.push({
            "id": Math.round(i * 100) / 100,
            "file_name": `${Math.round(i * 100) / 100}.jpg`
        })

    }

    //annotations
    for (let i = 0; i < rectangles.length; i++) {

        if (train && rectangles[i].second >= point || !train && rectangles[i].second < point) continue

        boxes.push({
            "image_id": rectangles[i].second,
            "bbox": [rectangles[i].x, rectangles[i].y, rectangles[i].width, rectangles[i].height],
            "category_id": arr.indexOf(rectangles[i].label) + 1,
            "time": rectangles[i].second
        })

    }

    //categories
    categories.push({ "id": 0, "name": "background" })
    for (let i = 0; i < arr.length; i++) {
        categories.push({
            "id": i + 1,
            "name": arr[i]
        })
    }

    //final
    let json = {
        "images": images,
        "annotations": boxes,
        "categories": categories
    }

    return json

}

//------------------------------------------------------------------

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

const toast = txt => Toastify({
    text: txt,
    gravity: "top",
    position: "left",
    style: {
        background: "#212121",
        marginTop: "60px",
    }
}).showToast()