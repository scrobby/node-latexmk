# node-latexmk
*This is very much still a work in progress*

A wrapper for latexmk in nodejs. Inspired by [node-latex](https://www.npmjs.com/package/node-latex).

The only scope I will personally be using this for, at least at the moment, is for generating PDFs. If this ends up being useful to anyone else and you want to make changes, pull requests are very welcome.


## Requirements
You need to have LaTeX installed on your system. I believe latexmk is part of TeX Live. [Installation instructions](https://www.latex-project.org/get/) are on the LaTeX website.

If you're on a Mac with Homebrew you can install using
```bash
brew cask install mactex
```

It's technically possible to do a lightweight installation using basictex, but that requires a lot of manually installing packages, which is too much for me to go into here.


## Installation
```bash
npm install node-latexmk
```


## Usage
```javascript
const latex = require('node-latexmk')

const input = 'pathto/input.tex'
const output = 'pathto/output.pdf'

latex(input, output, [options], (err) => {
  if (err) {
    console.error(err)
  } else {
    // do something now the pdf has been generated
  }
})
```
| Parameter | Type | Description |
| --- | --- | --- |
| **input** | string | A full path to your input .tex file |
| **output** | string | A full path to where you want your generated pdf to go (again, this only works with PDFs for now) |
| **options** (optional) | object | An object that can be used to set various options |
| **callback** | function | A callback that contains an error if it exists, null if all is okay |


### Options
Please note, if an option with a default hasn't been set, the defaults will automatically be added to the options object.

| Option | Type | Default | Description |
| --- |:---:|:---:| --- |
| **passes** | number | 1 | How many times latexmk should run (use 2 or more for pythontex) |
| **args** | array\<string\> | \['-pdf', '-g', '-f', '-interaction=nonstopmode'\] | The arguments that will be sent by default. Any arguments passed in the options object will be considered as additional to these four, unless **noargs** is set to true |
| **noargs** | boolean | false | Set this to true if you want to remove the arguments above and set them all yourself |
| **dependencies** | array\<string\> | - | An array of paths to files you would like copied in addition to the tex file, for example a JSON object of options or a template file.
| **dependencyRenames** | Object\<string, string\> | - | A dictionary that will allow the dependency files to be renamed upon copy. Useful if you need to dynamically generate them with random filenames but your `.tex` file expects something with a certain name |
| **ignoreNoTex** | boolean | false | node-latexmk will return an error if your input file does not end in `.tex`. Set this to true to ignore that behaviour


## Troubleshooting
### pythontex doesn't run
If your code includes pythontex, you need at least 2 passes to generate a valid PDF. See above for how to add this to the options object.

If that still doesn't work, you may need to include the following in your `.latexmkrc` file:
```python
add_cus_dep(’pytxcode’, ’tex’, 0, ’pythontex’);
sub pythontex { return system("pythontex \"$_[0]\""); }
```

