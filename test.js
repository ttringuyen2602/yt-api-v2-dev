const util = require("util");
const exec = util.promisify(require("child_process").exec);
const moment = require("moment");
const fs = require("fs");

// exec(command, (err, stdout, stderr) => {
//   if (err) {
//     console.error(err);
//     return;
//   }
//   console.log(stdout);
// });

let dateString = "2023-04-10";
let dateObj = new Date(dateString);
dateObj.setDate(dateObj.getDate() - 1);
let previousDateString = dateObj.toISOString().substr(0, 10);

console.log(previousDateString);
