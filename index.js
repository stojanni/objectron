const fs = require('fs');
const express = require('express')
const path = require('path')
const cors = require('cors')
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const nodemailer = require("nodemailer")
require('dotenv').config()

const storage = new Storage({
    projectId: process.env.projectId,
    keyFilename: process.env.keyFilename
})

const upload = multer({ storage: multer.memoryStorage() })

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.user,
        pass: process.env.pass
    }
})

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')))

app.get('/platform', (req, res) => res.sendFile(path.join(__dirname, 'public/platform/index.html')))

app.post('/upload', upload.single('file'), async (req, res, next) => {

    const d = new Date()

    let blob = storage.bucket('objectron_bucket').file(`${req.body.model}_${d.getTime()}_video.mp4`)
    blob.createWriteStream().on('error', err => console.log('file upload error')).end(req.file.buffer)

    let file = storage.bucket('objectron_bucket').file(`${req.body.model}_${d.getTime()}_trainLabels.json`)
    file.createWriteStream().on('error', err => console.log('file upload error')).end(req.body.trainJSON)

    file = storage.bucket('objectron_bucket').file(`${req.body.model}_${d.getTime()}_validationLabels.json`)
    file.createWriteStream().on('error', err => console.log('file upload error')).end(req.body.validationJSON)

    console.log('uploaded')

    await transporter.sendMail({
        from: process.env.user,
        to: process.env.me,
        subject: req.body.model,
        text: '',
    })

    console.log('mail sent')

    res.status(200).send('File uploaded')
})

app.get('/models', (req, res) => fs.readdir(path.join(__dirname, 'public/models'), (err, files) => res.json(files)))

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Server started at port: ${port}`))
