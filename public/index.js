const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Get element in DOM
const analyticsListRecord = $(".analytics__list-record");
const findDateForm = $(".find-date");
const loadBtn = $(".find-date__load-btn");
const nct = $(".find-date__nct");
const startDateInput = $("#start-date");
const endDateInput = $("#end-date");
let startEndDates = $("#start-end-dates");

// Global variables
const modifyStyles = ["success", "error", "warning"];

///////////////////////////////////////////////////////////////////////
window.onload = async function () {
  loadBtn.classList.add("button--disabled");
  const keyAnalytics = localStorage.getItem("analytics");

  if (keyAnalytics !== null) {
    const data = JSON.parse(keyAnalytics);
    console.log(data);
    loadData(data);
    startEndDates.textContent = `(${startDateInput.value} - ${endDateInput.value})`;
  }
};

const loadData = (data) => {
  const dataRows = data.rows;
  let dataRecords = dataRows.slice(1); // Dùng trick bỏ đi dòng đầu tiên để hiển thị các giá trị increasing-value
  let incrRecords = [];
  var days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

  let html = "";
  let day = "";

  let toggleSubStyle = "",
    toggleViewStyle = "",
    toggleLikeStyle = "",
    toggleWatchedStyle = "",
    toggleAvgViewStyle = "";

  let incrRecord_i0 = "",
    incrRecord_i1 = "",
    incrRecord_i2 = "",
    incrRecord_i3 = "",
    incrRecord_i4 = "";

  let incrRecord_temp = "";

  // ****
  // Đẩy dữ liệu hiển thị sự tăng lên vào trong mảng incrRecords bằng vòng lặp for bên dưới
  // Khi đẩy thì sẽ bỏ cột đầu tiên đi vì cột đó là ngày
  // Mảng incrRecords có cấu trúc tương tự như dataRecords nhưng
  // cột đầu tiên của incrRecords là view thay vì ngày
  // ****
  for (let i = 0; i < dataRows.length - 1; i++) {
    let record = [];
    for (let j = 0; j < dataRows[i].length - 1; j++) {
      record.push(dataRows[i + 1][j + 1] - dataRows[i][j + 1]);
    }
    incrRecords.push(record);
  }

  dataRecords.forEach((record, index) => {
    day = new Date(record[0]);
    incrRecord_temp = incrRecords[index];

    // Toggle increasing-field style
    toggleSubStyle = incrRecord_temp[0] <= 0 ? "no-value" : "--increased";
    toggleViewStyle = incrRecord_temp[1] <= 0 ? "no-value" : "--increased";
    toggleLikeStyle = incrRecord_temp[2] <= 0 ? "no-value" : "--increased";
    toggleWatchedStyle = incrRecord_temp[3] <= 0 ? "no-value" : "--increased";
    toggleAvgViewStyle = incrRecord_temp[4] <= 0 ? "no-value" : "--increased";

    // Hiển thị increasing-value nếu có sự tăng lên (increasing-value > 0)
    incrRecord_i0 =
      incrRecord_temp[0] > 0 ? "+" + intToString(incrRecord_temp[0]) : "";
    incrRecord_i1 =
      incrRecord_temp[1] > 0 ? "+" + intToString(incrRecord_temp[1]) : "";
    incrRecord_i2 =
      incrRecord_temp[2] > 0 ? "+" + intToString(incrRecord_temp[2]) : "";
    incrRecord_i3 =
      incrRecord_temp[3] > 0 ? `+${incrRecord_temp[3]} mins.` : "";
    incrRecord_i4 =
      incrRecord_temp[4] > 0 ? `+${incrRecord_temp[4]} secs.` : "";

    html += `
      <div class="flex analytics__record px-5">
        <div class="analytics__date flex">
          <div>${record[0]}</div>
          <div>${days[day.getDay()]}</div>
        </div>
        <div class="analytics__sub flex">
          <div class="${toggleSubStyle}">${incrRecord_i0}</div>
          <div>${intToString(record[1])}</div>
        </div>
        <div class="analytics__view flex">
          <div class="${toggleViewStyle}">${incrRecord_i1}</div>
          <div>${intToString(record[2])}</div>
        </div>
        <div class="analytics__like flex">
          <div class="${toggleLikeStyle}">${incrRecord_i2}</div>
          <div>${intToString(record[3])}</div>
        </div>
        <div class="analytics__watched flex">
          <div class="${toggleWatchedStyle}">${incrRecord_i3}</div>
          <div>${addTimeTail(record[4], "mins.")}</div>
        </div>
        <div class="analytics__avg-view flex">
          <div class="${toggleAvgViewStyle}">${incrRecord_i4}</div>
          <div>${addTimeTail(record[5], "secs.")}</div>
        </div>
      </div>
    `;
  });

  analyticsListRecord.innerHTML = html;
};

///////////////////////////////////////////////////////////////////////
// Add events

// Add submit event for Form
findDateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  if (!startDate || !endDate) {
    showNCT("No start date or end date selected!", "error");
    return;
  }

  const date1 = new Date(startDate);
  const date2 = new Date(endDate);
  const now = new Date();

  if (date2.getTime() > now.getTime()) {
    showNCT("The end date cannot be greater than the current date!", "error");
    return;
  }

  if (date1.getTime() > date2.getTime()) {
    showNCT("The start date cannot be greater than the end date!", "error");
    return;
  }

  try {
    const postResponse = await postData("http://localhost:4000/submit", {
      startDate,
      endDate,
    });
    console.log(postResponse);
    showNCT("Please verify your identity!", "warning");
    loadBtn.classList.remove("button--disabled");
  } catch (error) {
    showNCT("Bad request! 400", "error");
    console.error(error);
  }
});

// Add onclick event for Load button
loadBtn.onclick = async () => {
  try {
    const getResponse = await getData(`http://localhost:4000/result`);
    console.log(getResponse);
    loadData(getResponse);
    const analytics = JSON.stringify(getResponse);
    localStorage.setItem("analytics", analytics);
    showNCT("Load data from server successfully!", "success");
    startEndDates.textContent = `(${startDateInput.value} - ${endDateInput.value})`;
  } catch (error) {
    showNCT("Not Found Resources! 404", "error");
    console.error(error);
  }
};

// Add oninput event for 2 Date Picker
startDateInput.oninput = () => {
  removeNCT();
};
endDateInput.oninput = () => {
  removeNCT();
};

///////////////////////////////////////////////////////////////////////
// Create Async function

async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error posting data to server.");
  }

  return response.json();
}

async function getData(url = "") {
  const response = await fetch(url);
  return response.json();
}

///////////////////////////////////////////////////////////////////////
// My Mini Library

const intToString = (num) => {
  const negative = num < 0 ? num : 0;
  num = num.toString().replace(/[^0-9.]/g, "");

  if (num < 1000) {
    if (negative < 0) {
      return "-" + num;
    }
    return num;
  }

  let si = [
    { v: 1e3, s: "K" },
    { v: 1e6, s: "M" },
    { v: 1e9, s: "B" },
    { v: 1e12, s: "T" },
    { v: 1e15, s: "P" },
    { v: 1e18, s: "E" },
  ];
  let index;
  for (index = si.length - 1; index > 0; index--) {
    if (num >= si[index].v) {
      break;
    }
  }
  let result =
    (num / si[index].v).toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") +
    si[index].s;

  if (negative < 0) {
    return "-" + result;
  }

  return result;
};

const addTimeTail = (num, tail) => {
  if (num === 0 || num === undefined) {
    return "0";
  }

  return num + " " + tail;
};

function showNCT(notification = "", className = "") {
  removeNCT();
  nct.textContent = notification;

  const lowerCN = className.toLowerCase();
  const trueCN = "--" + lowerCN;

  if (!nct.classList.contains(trueCN)) {
    nct.classList.add(trueCN);
  }
}

function removeNCT() {
  nct.textContent = "";
  modifyStyles.forEach((modify) => {
    nct.classList.remove("--" + modify);
  });
}
