const fs = require('fs');
const colors = require('colors');
const spawn = require('child_process').spawn;

function filterIgnored(basePath, files, howToRead, cb) {
  var checker = spawn('git', ['check-ignore', '--stdin'], { cwd: basePath });
  var result = '';
  checker.stdout.on('data', (data) => {
    result += data;
  });
  checker.stdout.on('end', () => {
    var ignoredFiles = result.split('\n');
    var filteredFiles = [];
    files.forEach((file) => {
      var sanitized = howToRead(file);
      if (sanitized != '.git' && ignoredFiles.indexOf(sanitized) == -1) {
        filteredFiles.push(file);
      }
    });
    cb(filteredFiles);
  });
  files.forEach((file) => checker.stdin.write(howToRead(file) + '\n'));
  checker.stdin.end();
}

function examine(path, recursive) {
  var result = [];
  fs.readdir(path, (err, files) => {
    filterIgnored(path, files, (x) => x, (filteredFiles) => {
      filteredFiles.forEach((file) => {
        fs.lstat(file, (err, stats) => {
          if (err) {
            console.error(err);
            return;
          }
          if (stats.isDirectory()) {
            result = result.concat(examine(file, true));
          }
        });
      });
    });
  });
  return result;
}

module.exports = {
  filterIgnored: filterIgnored,
  examine: examine
};
