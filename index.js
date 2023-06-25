const express = require('express')
const path = require('path')
const cors = require('cors')
const multer = require('multer')
const { Storage } = require('@google-cloud/storage')
const nodemailer = require("nodemailer")
const fs = require('fs')

const storage = new Storage({
    projectId: 'object-384510',
    keyFilename: 'object-384510-e73264702d4f.json'
})

const upload = multer({ dest: 'uploads/' })

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: 'awrvdaefgrsd@outlook.com',
        pass: 'a*Erf&z(V&:T@K9'
    }
})

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('./'))

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.get('/platform', (req, res) => res.sendFile(path.join(__dirname, '/platform/index.html')))

app.post('/upload', upload.single('file'), async (req, res, next) => {

    await storage.bucket('objectron_bucket').upload(req.file.path, {
        destination: req.body.email + '_video.mp4',
    })

    let file = storage.bucket('objectron_bucket').file(`${req.body.email}_trainLabels.json`)
    file.createWriteStream().on('error', err => { }).on('finish', () => { }).end(req.body.trainJSON)

    file = storage.bucket('objectron_bucket').file(`${req.body.email}_validationLabels.json`)
    file.createWriteStream().on('error', err => { }).on('finish', () => res.send('Uploaded')).end(req.body.validationJSON)

    fs.readdir('/uploads', files => files.forEach(file => fs.unlink(path.join(directory, file))))

    console.log('uploaded')

    await transporter.sendMail({
        from: 'awrvdaefgrsd@outlook.com',
        to: "vavylona@gmail.com",
        subject: req.body.email,
        text: '',
    })

    console.log('mail sent')

})

const port = process.env.PORT || 8080
app.listen(port, () => console.log('\nServer started at http://localhost:' + port + '\n'))
