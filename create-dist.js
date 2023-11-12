const fs = require('fs');
const src = fs.readFileSync('./src/index.js', { encoding: 'utf8' });

fs.writeFile('./dist/qwick-maffs.global.js', `(function () {
${src}
(typeof globalThis === 'undefined' ? window : globalThis).QwickMaffs = QwickMaffs;
})()`, { encoding: 'utf8' }, () => {});

fs.writeFile('./dist/qwick-maffs.amd.js', `define([], function () {
${src}
return QwickMaffs;
})`, { encoding: 'utf8' }, () => {});

fs.writeFile('./dist/qwick-maffs.cjs', `${src}
module.exports = QwickMaffs;`, { encoding: 'utf8' }, () => {});

fs.writeFile('./dist/qwick-maffs.mjs', `${src}
export default QwickMaffs;`, { encoding: 'utf8' }, () => {});