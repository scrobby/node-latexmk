// get required modules
const fs = require('fs')
const tmp = require('tmp')

latexmk = function (input, output, options, callback) {
    if (callback === undefined) {
        // options was not passed so let's set the callback properly
        if (typeof options === 'function') {
            callback = options

            // set default options
            options = { default: "default" }
        } else {
            throw new Error('No callback was passed to the function')
        }
    }


}