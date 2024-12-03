// get required modules
const fs = require('fs')
const { spawn } = require('child_process')
const tmp = require('tmp')
const del = require('del')

var hasHandledError = false
const defaultOptions = {
    args: ['-pdf', '-g', '-f', '-interaction=nonstopmode'],
    noargs: false,
    ignoreNoTex: false,
    passes: 1
}

/**
 * @description Call latexmk with specified options
 * @param {string} input The path for the input file
 * @param {string} output The path for the output file (should be .pdf for this version)
 * @param {object} [options]
 * @param {number} [passes] Number of times to execute the command. Defaults to 1
 * @param {string[]} [options.args] Arguments that should be passed. The defaults are ['-pdf', '-g', '-f', '-interaction=nonstopmode'] and will be included unless `options.noargs` is set to true
 * @param {boolean} [options.noargs] Set to true to override all default arguments
 * @param {string} [options.dependencies] An array of filepaths that should be copied in addition to the input file (e.g. JSON data).
 * @param {Object.<string, string>} [options.dependencyRenames] A dictionary with the original filename and what it should be renamed to when it's copied.
 * @param {boolean} [options.ignoreNoTex] Overrides the check for the .tex extension on the input file. A .tex extension will automatically be added regardless, so only use this if you're sure it won't break things
 * @param {latexmk~callback} callback The callback that handles the response
 */
module.exports = latexmk = function (input, output, options, callback) {
    if (callback === undefined) {
        // options was not passed so let's set the callback properly
        if (typeof options === 'function') {
            callback = options

            // set default options
            options = defaultOptions
        } else {
            throw new Error('No callback was passed to the function')
        }
    } else {
        if (options) {
            // add the existing options to the defaults
            var newOptions = defaultOptions

            for (let [key, value] of Object.entries(options)) {
                // do something slightly differently for the arguments to make sure we don't overwite, unless that option is selected
                if (key.includes('args') && !options.noargs) {
                    value.forEach(val => {
                        // see if the argument exists in the defaults 
                        if (newOptions.args.filter(a => a.includes(val)).length === 0) {
                            // if it doesn't, add it to the array
                            newOptions.args.push(val)
                        }
                    })
                } else {
                    newOptions[key] = value
                }
            }

            options = newOptions
        }
    }

    function handleErr(err) {
        // Make sure we don't send any extra errors
        if (!hasHandledError) {
            hasHandledError = true
            callback(err, null)
        }
    }


    // --- check for some common errors --- 
    // make sure the input file is a tex file, unless ignoreNoTex has been set to true
    if (!input.substring(input.lastIndexOf('.') + 1).includes('tex') && !ignoreNoTex) {
        handleErr(new Error('Input file does not have extension \'.tex\'. To ignore this error, set the \'ignoreNoTex\' option to false.'))
        return
    }

    // check to see if the file exists first 
    try {
        if (!fs.existsSync(input)) {
            handleErr(new Error(`File ${input} does not exist`))
            return
        }
    } catch (err) { handleErr(err) }

    // make sure passes is more than zero
    if (!(options.passes > 0)) {
        handleErr(new Error(`Passes must be 1 or higher, not ${options.passes}`))
        return
    }

    // create the temporary directory
    tmp.dir({ prefix: 'node-latexmk_' }, function _tempDirCreated(err, path, cleanupCallback) {
        if (err) {
            handleErr(err)
            cleanupCallback()
            return
        }

        // make the new destination
        let dest = path + '/input.tex'

        // set up the file copies
        var fileCopyPromises = [copyFromFile(input, dest)]

        if (options.dependencies) {
            options.dependencies.forEach(dep => {
                var fileName = ""

                if (options.dependencyRenames[dep.toString()]) {
                    fileName = options.dependencyRenames[dep]
                } else {
                    fileName = dep.toString().substring(dep.toString().lastIndexOf('/') + 1)
                }

                let newPath = path + '/' + fileName
                fileCopyPromises.push(copyFromFile(dep.toString(), newPath))

            })
        }

        Promise.all(fileCopyPromises)
            .then((result) => {
                // all the files copied succesfully so let's run the code

                options.args.push('input.tex')

                spawnLoop(options.passes, options, path, err => {
                    if (err) {
                        handleErr(err)
                        cleanupCallback()
                        return
                    }

                    let pdfName = path + '/' + 'input.pdf'

                    fs.copyFile(pdfName, output, (err) => {
                        if (err) {
                            handleErr(err)
                            return
                        }

                        callback(null, output)

                        // now let's clean up the directory
                        fs.readdir(path, (err, files) => {
                            if (err) {
                                console.log(err)
                            } else {
                                var fileRemovePromises = []

                                for (const file of files) {
                                    fileRemovePromises.push(del(path + '/' + file, { force: true }))
                                }

                                Promise.all(fileRemovePromises)
                                    .then((result) => {
                                        cleanupCallback()
                                    })
                                    .catch((err) => {
                                        console.log(err)
                                    })
                            }
                        })
                    })

                })
            })
            .catch((err) => {
                callback(err)
                cleanupCallback()
                return
            })
    })
}
/**
 * @callback latexmk~callback
 * @param {error} [err] An error, if it exists
 * @param {string} [path] The path of the newly-created object
 */

/**
 * @description Promise-based file copying
 * @param {string} from Path of the file to copy
 * @param {string} to Path to copy to
 * @returns {string} Path of copied file (or an error)
 */
function copyFromFile(from, to) {
    return new Promise((res, rej) => {
        fs.copyFile(from, to, (err) => {
            if (err) rej(err)
            else res(to)
        })
    })
}

function removeFile(file) {
    return new Promise((res, rej) => {
        fs.unlink(file, (err) => {
            if (err) rej(err)
            else res(file)
        })
    })
}

var loopCounter = 0

function spawnLoop(times, options, path, callback) {
    loopCounter = times

    makeLatexHappen(options, path, (err) => {
        if (err) {
            callback(err)
            loopCounter = 0
            return
        }

        loopCounter--

        if (loopCounter > 0) {
            spawnLoop(loopCounter, options, path, callback)
        } else {
            callback(null)
        }
    })
}

function makeLatexHappen(options, path, callback) {
    runSpawn('latexmk', options.args, { cwd: path }, (stdout, stderr, err, code) => {
        if (err) {
            callback(err)
            return
        }

        // TODO: make this properly handle stdout/stderr/code
        callback(null)
    })
}

function runSpawn(command, arguments, options, callback) {
    var stdout = ""
    var stderr = ""

    const cmd = spawn(command, arguments, options)

    cmd.stdout.on('data', data => {
        stdout += data
    })

    cmd.stderr.on('data', data => {
        stderr += data
    })

    cmd.on('error', err => {
        callback(stdout, stderr, err, null)
    })

    cmd.on('close', code => {
        callback(stdout, stderr, null, code)
    })
}