const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const browserSync = require("browser-sync").create();
const cors = require("cors");
const exec = require("child_process").exec;
const path = require("path");
const fs = require("fs");
const moment = require("moment");

app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/submit", (req, res) => {
  const { startDate, endDate } = req.body;
  const _filePath = path.join(__dirname, "resources", "date_request.json");

  const dateObj = new Date(startDate);
  const prevDate = new Date(dateObj.setDate(dateObj.getDate() - 1));
  const previousStartDate = prevDate.toISOString().substring(0, 10);

  fs.writeFileSync(
    _filePath,
    JSON.stringify({ startDate: previousStartDate, endDate })
  );

  if (!startDate || !endDate) {
    // Kiểm tra các trường bắt buộc
    return res
      .status(400)
      .json({ error: "Start date and end date are required!" });
  }

  const date1 = new Date(startDate);
  const date2 = new Date(endDate);
  const now = new Date();

  if (date2.getTime() > now.getTime()) {
    return res
      .status(400)
      .json({ error: "End date cannot be greater than current date!" });
  }

  if (date1.getTime() > date2.getTime()) {
    return res
      .status(400)
      .json({ error: "Start date cannot be greater than end date!" });
  }

  run_ytApiPy();

  return res
    .status(200)
    .json({ message: "The server has been received data successfully!" });
});

app.get("/result", (req, res) => {
  const filePath = path.join(__dirname, "resources", "result.json");
  const resultJson = fs.readFileSync(filePath, "utf-8");
  const resultObj = JSON.parse(resultJson);
  return res.status(200).json(resultObj);
});

app.listen(3000, () => {
  console.log("Server started on port 3000");

  browserSync.init({
    proxy: "http://localhost:3000",
    files: ["public/**/*.*"],
    port: 4000,
    reloadOnRestart: true,
    open: false,
    notify: false,
  });
});

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

function run_ytApiPy() {
  const ytApi_pyFile = "yt_api.py";
  const command = `python -u "${path.join(
    __dirname,
    "resources",
    ytApi_pyFile
  )}"`;

  (function () {
    exec("netstat -ano | findstr 127.0.0.1:9900", (err, stdout, stderr) => {
      console.log(command);
      if (err) {
        return runCommand(command);
      }

      // Lấy danh sách các tiến trình đang sử dụng cổng 127.0.0.1:9900
      const processes = stdout
        .trim() // Loại bỏ khoảng trắng thừa
        .split("\n") // Tách các dòng
        .map((line) => {
          const [_, __, ___, isListening, pid] = line.trim().split(/\s+/);
          return { isListening, pid };
        });

      // Tắt các tiến trình sử dụng cổng 127.0.0.1:9900
      processes.forEach(({ isListening, pid }) => {
        if (isListening === "LISTENING")
          exec(`taskkill /F /PID ${pid}`, (err, stdout, stderr) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log(stdout);
          });
      });
    });

    return runCommand(command);
  })()
    .then((stdout) => {
      console.log(stdout);
    })
    .catch((error) => {
      console.error(error);
    });
}
