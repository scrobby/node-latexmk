// get required modules
const fs = require('fs')
const tmp = require('tmp')

const hasHandledError = false
const defaultOptions = {
    args: [ '-pdf', '-g', '-f', '-interaction=nonstopmode' ],
    noargs: false,
    ignoreNoTex: false
}

/**
 * @description Call latexmk with specified options
 * @param {string} input The path for the input file
 * @param {string} output The path for the output file (should be .pdf for this version)
 * @param {object} [options]
 * @param {string[]} [options.args] Arguments that should be passed. The defaults are ['-pdf', '-g', '-f', '-interaction=nonstopmode'] and will be included unless `options.noargs` is set to true
 * @param {boolean} [options.noargs] Set to true to override all default arguments
 * @param {string[]} [options.dependencies] An array of filepaths that should be copied in addition to the input file (e.g. JSON data)
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
                newOptions[key] = [value]
            }

            options = newOptions
        }
    }


    // --- check for some common errors --- 
    // make sure the input file is a tex file, unless ignoreNoTex has been set to true
    if ( !input.substring(input.lastIndexOf('.') + 1).includes('tex') && !ignoreNoTex ) {
        handleErr(new Error('Input file does not have extension \'.tex\'. To ignore this error, set the \'ignoreNoTex\' option to false.'))
        return
    }

    // check to see if the file exists first 
    try {
        if (!fs.existsSync(input)) {
            handleErr(new Error(`File \(input) does not exist`))
            return
        }
    } catch(err) { handleErr(err) }

    // create the temporary directory
    tmp.dir({ prefix: 'node-latexmk_' }, function _tempDirCreated(err, path, cleanupCallback) {
        if (err) {
            handleErr(err)
            return
        }

        // make the new destination
        let dest = path + '/input.tex'

        // set up the file copies
        var fileCopyPromises = []

        fileCopyPromises.push(copyFromFile(input, dest))

        if (options.dependencies) {
            options.dependencies.forEach(dep => {
                let newPath = path + dep.substring(dep.lastIndexOf('/') + 1)
                fileCopyPromises.push(copyFromFile(dep, newPath))
            })
        }

        Promise.all(fileCopyPromises)
            .then(() => {

            })
            .catch((err) => {
                handleErr(err)
            })

        cleanupCallback()
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
            if (err) {
                rej(err)
            } else {
                res(to)
            }
        })
    })
}

function handleErr(err) {
    // Make sure we don't send any extra errors
    if (!hasHandledError) {
        hasHandledError = true
        callback(err)
    }
}