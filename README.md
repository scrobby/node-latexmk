# node-latexmk
*This is very much still a work in progress*

A wrapper for latexmk in nodejs. Inspired by [node-latex](https://www.npmjs.com/package/node-latex).

The only scope I will personally be using this for, at least at the moment, is for generating PDFs. If this ends up being useful to anyone else and you want to make changes, pull requests are very welcome.


## Requirements
You need to have LaTeX installed on your system. I beleive latexmk is part of TeX Live. [Installation instructions](https://www.latex-project.org/get/) are on the LaTeX website.


## Installation
`npm install node-latexmk`


## Usage
```javascript
const latex = require('node-latexmk')

const input = 'pathto/input.tex'
const output = 'pathto/output.pdf'

latex(input, output, (err) => {
  if (err) {
    console.error(err)
  } else {
    // do something now the pdf has been generated
  }
})
```
