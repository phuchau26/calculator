// Lấy các phần tử cần thiết từ HTML
const currentValueDisplay = document.querySelector(".current-value");
const expressionDisplay = document.querySelector(".calculation-expression");
const keys = document.querySelector(".calculator-keys");
const historyList = document.querySelector(".history-list"); // Lấy danh sách lịch sử
const noHistoryText = document.querySelector(".no-history"); // Lấy dòng chữ "no history"

// Biến lưu trữ trạng thái của máy tính
let displayValue = "0";
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;
let lastInputWasEqual = false;
let calculationExpression = "";
let history = []; // Mảng để lưu lịch sử

// Hàm cập nhật màn hình chính
function updateScreen() {
  currentValueDisplay.textContent = displayValue;
  expressionDisplay.textContent = calculationExpression;
}

// Cập nhật chuỗi biểu thức dựa trên trạng thái hiện tại
function updateCalculationExpression() {
  if (operator && firstOperand !== null && !waitingForSecondOperand) {
    calculationExpression = `${firstOperand} ${displayOperator(
      operator
    )} ${displayValue}`;
  } else if (operator && firstOperand !== null && waitingForSecondOperand) {
    calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
  } else {
    calculationExpression = "";
  }
}

// Hàm cập nhật và hiển thị lịch sử
function updateHistory() {
  // Xóa nội dung cũ trong danh sách
  historyList.innerHTML = "";

  if (history.length === 0) {
    noHistoryText.style.display = "block"; // Hiện lại text nếu không có lịch sử
  } else {
    noHistoryText.style.display = "none"; // Ẩn text đi
    // Lặp qua mảng lịch sử (đảo ngược để phép tính mới nhất lên trên)
    history
      .slice()
      .reverse()
      .forEach((item) => {
        const li = document.createElement("li");
        li.classList.add("history-item");
        li.innerHTML = `
                <span class="history-expression">${item.expression}</span>
                <span class="history-result">${item.result}</span>
            `;
        historyList.appendChild(li);
      });
  }
}

// Lắng nghe sự kiện click trên toàn bộ khu vực phím
keys.addEventListener("click", (event) => {
  const { target } = event; // Lấy phần tử được click
  const { value } = target; // Lấy giá trị của nút đó

  // Bỏ qua nếu click không phải là nút
  if (!target.matches("button")) {
    return;
  }

  // Phân loại hành động dựa trên giá trị của nút
  switch (value) {
    case "+":
    case "-":
    case "*":
    case "/":
    case "=":
      handleOperator(value);
      break;
    case ".":
      inputDecimal(value);
      break;
    case "%":
    case "1/x":
    case "x^2":
    case "sqrt":
      handleUnary(value);
      break;
    case "all-clear":
      resetCalculator();
      break;
    case "backspace":
      displayValue = displayValue.slice(0, -1) || "0";
      // Sau khi xóa, cập nhật biểu thức tương ứng
      updateCalculationExpression();
      break;
    default:
      // Nếu là một số
      if (Number.isInteger(parseFloat(value))) {
        inputDigit(value);
      }
  }
  updateScreen();
});

// Hàm xử lý nhập số
function inputDigit(digit) {
  // Nếu vừa nhấn '=', bắt đầu phép tính mới khi nhập số
  if (lastInputWasEqual) {
    displayValue = digit;
    calculationExpression = "";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    lastInputWasEqual = false;
    return;
  }

  if (waitingForSecondOperand) {
    displayValue = digit; // bắt đầu số mới
    waitingForSecondOperand = false;
  } else {
    displayValue = displayValue === "0" ? digit : displayValue + digit;
  }

  if (operator && firstOperand !== null) {
    updateCalculationExpression();
  }
}

// Hàm xử lý nhập dấu thập phân
function inputDecimal(dot) {
  // Nếu vừa nhấn '=' thì bắt đầu số mới '0.'
  if (lastInputWasEqual) {
    displayValue = "0.";
    calculationExpression = "";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    lastInputWasEqual = false;
    updateCalculationExpression();
    return;
  }

  // Nếu đang chờ toán hạng thứ hai hoặc display đang là '0', bắt đầu với '0.'
  if (waitingForSecondOperand || displayValue === "0") {
    displayValue = "0.";
    waitingForSecondOperand = false;
    updateCalculationExpression();
    return;
  }

  if (!displayValue.includes(dot)) {
    displayValue += dot;
    updateCalculationExpression();
  }
}

function displayOperator(op) {
  switch (op) {
    case "*":
      return "×";
    case "/":
      return "÷";
    default:
      return op;
  }
}

// Hàm xử lý khi nhấn các toán tử
function handleOperator(nextOperator) {
  const inputValue = parseFloat(displayValue);

  // Nếu vừa nhấn '=' trước đó và bây giờ nhấn một toán tử khác,
  // dùng giá trị hiển thị (kết quả) làm firstOperand để tiếp tục tính
  if (lastInputWasEqual && nextOperator !== "=") {
    firstOperand = inputValue;
    operator = nextOperator;
    waitingForSecondOperand = true;
    calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
    lastInputWasEqual = false;
    updateScreen();
    return;
  }

  // Xử lý trường hợp người dùng đổi toán tử (ví dụ: 5 * rồi đổi thành -)
  if (operator && waitingForSecondOperand) {
    operator = nextOperator;
    calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
    updateScreen();
    return;
  }

  // Gán toán hạng đầu tiên
  if (firstOperand === null) {
    firstOperand = inputValue;
  } else if (operator) {
    // Nếu đã có toán tử, thực hiện phép tính
    const currentExpression = calculationExpression + inputValue; // Ghi lại biểu thức đầy đủ
    const result = performCalculation[operator](firstOperand, inputValue);

    // Làm tròn kết quả để tránh lỗi điểm nổi (ví dụ -3.9999999)
    const rounded = parseFloat(result.toFixed(7));

    // Thêm vào lịch sử khi nhấn "=" (lưu kết quả đã làm tròn)
    if (nextOperator === "=") {
      const displayExpr = `${firstOperand} ${displayOperator(
        operator
      )} ${inputValue}`;
      history.push({ expression: `${displayExpr} =`, result: rounded });
      updateHistory();
    }

    displayValue = `${rounded}`;
    firstOperand = rounded;
  }

  waitingForSecondOperand = true;
  operator = nextOperator;

  // Nếu nhấn '=', đánh dấu để lần nhập số tiếp theo bắt đầu phép tính mới
  if (nextOperator === "=") {
    lastInputWasEqual = true;
  } else {
    lastInputWasEqual = false;
  }

  // Cập nhật chuỗi biểu thức trên màn hình
  if (nextOperator !== "=") {
    calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
  }
}

// Hàm xử lý các phép toán một ngôi như %, 1/x, x^2, sqrt
function handleUnary(op) {
  const value = parseFloat(displayValue);

  if (isNaN(value)) return;

  let result;
  let expr;

  switch (op) {
    case "%":
      // Nếu đang trong một phép với firstOperand (ví dụ 2 - 30%),
      // chuyển second operand (30) thành phần trăm của firstOperand (0.6)
      if (firstOperand !== null && operator) {
        result = (firstOperand * value) / 100;
        expr = `${firstOperand} ${displayOperator(operator)} ${value}%`;
        // Cập nhật display chỉ cho operand hiện tại, không thay đổi firstOperand/operator
        const roundedPercent = parseFloat(result.toFixed(7));
        displayValue = `${roundedPercent}`;
        // Cập nhật biểu thức để vẫn hiển thị '2 - 30%'
        calculationExpression = expr;
        // Không lưu vào lịch sử và không reset operator/firstOperand
        updateScreen();
        return;
      } else {
        result = value / 100;
        expr = `${value}%`;
      }
      break;
    case "1/x":
      result = value === 0 ? Infinity : 1 / value;
      expr = `1/(${value})`;
      break;
    case "x^2":
      result = value * value;
      expr = `(${value})^2`;
      break;
    case "sqrt":
      result = value < 0 ? NaN : Math.sqrt(value);
      expr = `√(${value})`;
      break;
    default:
      return;
  }

  const rounded = parseFloat(Number(result).toFixed(7));

  // Nếu đang ở giữa một biểu thức (có operator và đang nhập operand thứ hai),
  // áp dụng kết quả cho operand hiện tại nhưng giữ firstOperand và operator.
  if (operator && !waitingForSecondOperand) {
    displayValue = `${rounded}`;
    calculationExpression = `${firstOperand} ${displayOperator(
      operator
    )} ${displayValue}`;
    updateScreen();
    return;
  }

  // Nếu không trong biểu thức (hoạt động độc lập), đặt kết quả làm firstOperand
  displayValue = `${rounded}`;
  firstOperand = rounded;
  waitingForSecondOperand = true;
  operator = null;
  calculationExpression = expr;

  // Lưu vào lịch sử (chỉ cho unary độc lập)
  history.push({ expression: `${expr} =`, result: rounded });
  updateHistory();
  updateScreen();
}

// Đối tượng chứa các hàm tính toán
const performCalculation = {
  "/": (first, second) => first / second,
  "*": (first, second) => first * second,
  "+": (first, second) => first + second,
  "-": (first, second) => first - second,
  "=": (first, second) => second, // Khi nhấn bằng, kết quả là toán hạng thứ hai
};

// Hàm reset máy tính về trạng thái ban đầu
function resetCalculator() {
  displayValue = "0";
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
  calculationExpression = "";
  // Tùy chọn: Xóa cả lịch sử khi nhấn C. Bỏ comment dòng dưới nếu muốn.
  // history = [];
  // updateHistory();
}

// Khởi tạo màn hình khi tải trang
updateScreen();
updateHistory();
