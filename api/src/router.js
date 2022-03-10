const { Router } = require('express')
const { diskStorage } = require('multer')
const multer = require('multer')
const { call } = require('ramda')
const path = require('path')
const imageProcessor = require('./imageProcessor')

const router = Router()

const photoPath = path.resolve(__dirname, '../../client/photo-viewer.html')

const filename = function (request, file, callback) {
  callback(null, file.originalname)
}

const storage = diskStorage({
    destination:'api/uploads/',
    filename:filename
})

const fileFilter = function (request, file, callback) {
  if(file.mimetype !== 'image/png') {
    request.fileValidationError = 'Wrong file type'
    callback(null, false, new Error('Wrong file type'))
  } else {
    callback(null, true)
  }
}

const upload = multer({
  fileFilter:fileFilter,
  storage: storage
})



router.post('/upload', upload.single('photo'), async (request, response) => {
  if(request.fileValidationError) {
    return response.status(400).json({error: request.fileValidationError})
  } else {
    try {
      await imageProcessor(request.file.filename)
    } catch (error) {
      
    }
    return response.status(201).json({sucess: true})
  }
})

router.get('/photo-viewer', (request, response) => {
  response.sendFile(photoPath)
})

module.exports = router