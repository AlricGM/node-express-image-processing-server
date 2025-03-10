const path = require('path')
const  { Worker, isMainThread } = require('worker_threads')

const pathToResizeWorker = path.resolve(__dirname, 'resizeWorker.js')
const pathToMonochromeWorker = path.resolve(__dirname, 'monochromeWorker.js')

const uploadPathResolver = function (filename) {
  return path.resolve(__dirname, '../uploads', filename)
}

const imageProcessor = function (filename) {
  
  const sourcePath = uploadPathResolver(filename)
  const resizedDestination = uploadPathResolver('resized-'+filename)
  const monochromeDestination = uploadPathResolver('monochrome-'+filename)

  let resizeWorkerFinished = false
  let monochromeWorkerFinished = false
  
  let output = new Promise((resolve, reject) => {

    if (isMainThread) {
      try {
        
        resizeWorker = new Worker(pathToResizeWorker, {
          workerData: {
            source: sourcePath,
            destination: resizedDestination
          }
        })

        monochromeWorker = new Worker(pathToMonochromeWorker, {
          workerData: {
            source: sourcePath,
            destination: monochromeDestination
          }
        })

        resizeWorker.on('message', (message) => {
          resizeWorkerFinished = true
          if (monochromeWorkerFinished) {
            resolve('resizeWorker finished processing')
          }
        })

        monochromeWorker.on('message', (message) => {
          monochromeWorkerFinished = true
          if (resizeWorkerFinished) {
            resolve('monochromeWorker finished processing')
          }
        })

        resizeWorker.on('error', (error) => {
          reject(new Error(error.message))
        })

        resizeWorker.on('exit', (code) => {
          if( code !== 0 ){
            reject(new Error('Exited with status code '+code))
          }
        })

        monochromeWorker.on('error', (error) => {
          reject(new Error(error.message))
        })

        monochromeWorker.on('exit', (code) => {
          if( code !== 0 ){
            reject(new Error('Exited with status code '+code))
          }
        })


      } catch (error) {
        reject(error)
      }
    } else {
      reject(new Error('not on main thread'))
    }

  })

  return output
}

module.exports = imageProcessor