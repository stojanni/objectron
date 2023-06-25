const express = require('express')
const path = require('path')
const cors = require('cors')
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const nodemailer = require("nodemailer")

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
app.use(express.static('.'))

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.get('/platform', (req, res) => res.sendFile(path.join(__dirname, '/platform/index.html')))

app.post('/upload', upload.single('file'), async (req, res, next) => {

    const blob = storage.bucket('objectron_bucket').file(`${req.body.email}_video.mp4`)
    const blobStream = blob.createWriteStream()
    blobStream.end(req.file.buffer)

    let file = storage.bucket('objectron_bucket').file(`${req.body.email}_trainLabels.json`)
    file.createWriteStream().on('error', err => { }).on('finish', () => { }).end(req.body.trainJSON)

    file = storage.bucket('objectron_bucket').file(`${req.body.email}_validationLabels.json`)
    file.createWriteStream().on('error', err => { }).on('finish', () => { }).end(req.body.validationJSON)

    console.log('uploaded')

    await transporter.sendMail({
        from: 'awrvdaefgrsd@outlook.com',
        to: "vavylona@gmail.com",
        subject: req.body.email,
        text: '',
    })

    console.log('mail sent')

    res.status(200).send('File uploaded')
})

const port = process.env.PORT || 8080
app.listen(port, () => console.log('\nServer started at http://localhost:' + port + '\n'))
