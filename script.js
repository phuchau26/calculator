// Lấy các phần tử cần thiết từ HTML
const currentValueDisplay = document.querySelector(".current-value");
const expressionDisplay = document.querySelector(".calculation-expression");
const keys = document.querySelector(".calculator-keys");
const historyList = document.querySelector(".history-list"); // Vùng hiển thị lịch sử (UL)
// History/memory tab in the aside
const historyTab = document.getElementById("history-tab");
const memoryTab = document.getElementById("memory-tab");
const memoryPanelAside = document.querySelector(".memory-panel-aside"); // Vùng hiển thị bộ nhớ (DIV)
const historyUl = document.querySelector(".history-list"); // Dùng lại biến historyList cho nhất quán

// Biến lưu trữ trạng thái của máy tính
let displayValue = "0";
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;
let lastInputWasEqual = false;
let calculationExpression = "";

// Các biến toàn cục để lưu trữ lịch sử tính toán và bộ nhớ
let calculationHistory = []; // Mảng lưu các đối tượng phép tính
let memory = 0; // Giá trị bộ nhớ (sử dụng number)
let memoryStack = []; // Mảng lưu các giá trị bộ nhớ để hiển thị lịch sử bộ nhớ

// Hàm cập nhật màn hình chính
function updateScreen() {
    currentValueDisplay.textContent = displayValue;
    expressionDisplay.textContent = calculationExpression;
}

// Cập nhật chuỗi biểu thức dựa trên trạng thái hiện tại
function updateCalculationExpression() {
    if (operator && firstOperand !== null && !waitingForSecondOperand) {
        calculationExpression = `${firstOperand} ${displayOperator(operator)} ${displayValue}`;
    } else if (operator && firstOperand !== null && waitingForSecondOperand) {
        calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
    } else {
        calculationExpression = "";
    }
}

// Hàm cập nhật và hiển thị lịch sử (LƯU Ý: Đảm bảo xóa nội dung cũ)
function updateHistory() {
    // Xóa nội dung cũ trong danh sách
    historyList.innerHTML = "";

    if (!calculationHistory || calculationHistory.length === 0) {
        // Hiện text 'Chưa có lịch sử nào.'
        historyList.innerHTML = '<li class="no-history">Chưa có lịch sử nào.</li>';
    } else {
        // Hiển thị các mục lịch sử (mới nhất lên trên)
        calculationHistory
            .slice()
            .reverse()
            .forEach((item) => {
                const li = document.createElement("li");
                li.classList.add("history-item");
                
                // Item là object: { expression: '...', result: ... }
                li.innerHTML = `
                    <span class="history-expression">${item.expression}</span>
                    <span class="history-result">${item.result}</span>
                `;
                historyList.appendChild(li);
            });
    }
}

// Hàm cập nhật và hiển thị bộ nhớ (LƯU Ý: Đảm bảo xóa nội dung cũ)
function updateMemoryDisplay() {
    const memoryValueDisplay = document.querySelector(".memory-value");
    const memoryListEl = document.querySelector(".memory-list");
    
    // Nếu DOM cho memory không tồn tại (nếu thiết kế HTML thay đổi), bỏ qua cập nhật
    if (!memoryValueDisplay || !memoryListEl) return;

    // 1. Cập nhật giá trị tổng bộ nhớ
    memoryValueDisplay.textContent = memoryStack.length === 0 ? "Không có" : String(memory);

    // 2. Cập nhật danh sách bộ nhớ (Xóa nội dung cũ)
    memoryListEl.innerHTML = "";
    
    if (memoryStack.length === 0) {
        // Nếu không có bộ nhớ, không thêm gì vào danh sách
        return;
    }

    // Hiển thị các mục bộ nhớ (mới nhất trên cùng)
    memoryStack
        .slice()
        .reverse()
        .forEach((m) => {
            const li = document.createElement("li");
            li.textContent = m;
            li.className = "memory-item";
            memoryListEl.appendChild(li);
        });
}

// Hàm xử lý nhập số
function inputDigit(digit) {
    if (lastInputWasEqual) {
        displayValue = digit;
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = false;
        lastInputWasEqual = false;
        calculationExpression = "";
        return;
    }

    if (waitingForSecondOperand) {
        displayValue = digit;
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
    if (lastInputWasEqual) {
        displayValue = "0.";
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = false;
        lastInputWasEqual = false;
        calculationExpression = "";
        updateCalculationExpression();
        return;
    }

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

// Đối tượng chứa các hàm tính toán
const performCalculation = {
    "/": (first, second) => first / second,
    "*": (first, second) => first * second,
    "+": (first, second) => first + second,
    "-": (first, second) => first - second,
};

// Hàm xử lý khi nhấn các toán tử
function handleOperator(nextOperator) {
    const inputValue = parseFloat(displayValue);

    // Bỏ qua nếu không phải là số (ví dụ: nhấn operator ngay sau khi reset)
    if (isNaN(inputValue) && nextOperator !== "=") return; 

    // Xử lý khi nhấn "="
    if (nextOperator === "=") {
        // Nếu không có firstOperand hoặc operator, thì chỉ làm mới trạng thái
        if (firstOperand === null || operator === null) {
            lastInputWasEqual = true;
            return;
        }
        
        // Thực hiện phép tính
        const result = performCalculation[operator](firstOperand, inputValue);
        const rounded = parseFloat(result.toFixed(7));

        const displayExpr = `${firstOperand} ${displayOperator(operator)} ${inputValue}`;
        const entryObj = { expression: `${displayExpr} =`, result: rounded };
        
        // Thêm vào lịch sử
        calculationHistory.push(entryObj);
        updateHistory();

        displayValue = `${rounded}`;
        firstOperand = rounded;
        waitingForSecondOperand = true;
        lastInputWasEqual = true;
        calculationExpression = `${displayExpr} =`; // Hiển thị biểu thức đầy đủ
        operator = null; // Xóa toán tử sau khi tính toán xong
        return;
    }

    // Xử lý đổi toán tử (ví dụ: 5 * rồi đổi thành -)
    if (operator && waitingForSecondOperand) {
        operator = nextOperator;
        calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
        updateScreen();
        return;
    }
    
    // Nếu đã có toán hạng đầu tiên và toán tử, tính toán kết quả tạm thời
    if (firstOperand !== null && operator) {
        const result = performCalculation[operator](firstOperand, inputValue);
        const rounded = parseFloat(result.toFixed(7));
        
        firstOperand = rounded;
        displayValue = `${rounded}`;
    } else {
        // Gán toán hạng đầu tiên
        firstOperand = inputValue;
    }

    waitingForSecondOperand = true;
    operator = nextOperator;
    lastInputWasEqual = false;
    
    // Cập nhật chuỗi biểu thức trên màn hình
    calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
}


// Hàm xử lý các phép toán một ngôi như %, 1/x, x^2, sqrt
function handleUnary(op) {
    const value = parseFloat(displayValue);
    if (isNaN(value)) return;

    let result;
    let expr;

    switch (op) {
        case "%":
            // Phép tính % độc lập (ví dụ: 50% = 0.5)
            if (firstOperand === null || operator === null) {
                result = value / 100;
                expr = `${value}%`;
            } 
            // Phép tính % trong biểu thức (ví dụ: 2 + 30% = 2 + 0.6)
            else {
                result = (firstOperand * value) / 100;
                // Cập nhật biểu thức để hiển thị % nhưng không reset trạng thái máy tính
                const roundedPercent = parseFloat(result.toFixed(7));
                displayValue = `${roundedPercent}`;
                calculationExpression = `${firstOperand} ${displayOperator(operator)} ${value}%`;
                updateScreen();
                return;
            }
            break;
        case "1/x":
            result = value === 0 ? Infinity : 1 / value;
            expr = `1/(${value})`;
            break;
        case "x^2":
            result = value * value;
            expr = `sqr(${value})`;
            break;
        case "sqrt":
            result = value < 0 ? NaN : Math.sqrt(value);
            expr = `√(${value})`;
            break;
        default:
            return;
    }

    const rounded = parseFloat(Number(result).toFixed(7));

    displayValue = `${rounded}`;
    
    // Lưu vào lịch sử (chỉ cho unary độc lập hoặc unary kết thúc biểu thức)
    if (firstOperand === null || operator === null) {
         firstOperand = rounded;
         waitingForSecondOperand = true;
         operator = null;
         calculationExpression = expr;
         
         const entryObj = { expression: `${expr} =`, result: rounded };
         calculationHistory.push(entryObj);
         updateHistory();
    }
    // Nếu đang trong biểu thức, chỉ áp dụng kết quả cho displayValue
    else {
        // Cập nhật biểu thức (ví dụ: 5 * sqr(2))
        calculationExpression = `${firstOperand} ${displayOperator(operator)} ${expr}`;
    }
    
    updateScreen();
}

// Hàm reset máy tính về trạng thái ban đầu (All Clear)
function resetCalculator() {
    displayValue = "0";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    calculationExpression = "";
    lastInputWasEqual = false;
    updateScreen();
}

// Hàm CE: chỉ xóa giá trị đang nhập hiện tại, giữ nguyên firstOperand/operator
function clearEntry() {
    displayValue = "0";
    updateCalculationExpression();
    updateScreen();
}

// === MEMORY FUNCTIONS ===

function memoryClear() {
    memory = 0;
    memoryStack = [];
    updateMemoryDisplay();
}

function memoryRecall() {
    // Đặt giá trị bộ nhớ vào màn hình hiện tại
    displayValue = String(memory);
    // Khi recall, coi như bắt đầu nhập số mới
    waitingForSecondOperand = false;
    lastInputWasEqual = false;
    updateCalculationExpression();
    updateScreen();
}

function memoryAdd() {
    const val = parseFloat(displayValue) || 0;
    memory = Number((memory + val).toFixed(7));
    memoryStack.push(memory);
    updateMemoryDisplay();
}

function memorySubtract() {
    const val = parseFloat(displayValue) || 0;
    memory = Number((memory - val).toFixed(7));
    memoryStack.push(memory);
    updateMemoryDisplay();
}

function memoryStore() {
    const val = parseFloat(displayValue) || 0;
    memory = Number(val.toFixed(7));
    memoryStack.push(memory);
    updateMemoryDisplay();
}

// === MAIN EVENT LISTENER (Xử lý Click Nút) ===

keys.addEventListener("click", (event) => {
    const { target } = event;
    const { value } = target;

    if (!target.matches("button")) {
        return;
    }

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
        case "negate": // Đổi dấu ±
            displayValue = String(parseFloat(displayValue) * -1);
            updateCalculationExpression();
            break;
        case "%":
        case "1/x":
        case "x^2":
        case "sqrt":
            handleUnary(value);
            break;
        case "clear-entry":
            clearEntry();
            break;
        case "mc": // Chưa có nút MC trong HTML, nhưng thêm logic dự phòng
            memoryClear();
            break;
        case "mr":
            memoryRecall();
            break;
        case "mplus":
            memoryAdd();
            break;
        case "mminus":
            memorySubtract();
            break;
        case "ms":
            memoryStore();
            break;
        case "all-clear":
            resetCalculator();
            break;
        case "backspace":
            displayValue = displayValue.slice(0, -1) || "0";
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

// === LOGIC CHUYỂN ĐỔI TAB (Theo yêu cầu của bạn) ===

// Hàm quản lý việc chuyển đổi giữa tab Lịch sử và Bộ nhớ
function showAsidePanel(name) {
    const activeClass = "active";
    const hiddenClass = "hidden";

    // Nếu chưa có CSS .hidden thì thêm dòng này để đảm bảo hoạt động
    const style = document.createElement("style");
    style.innerHTML = `.hidden { display: none !important; }`;
    document.head.appendChild(style);

    if (name === "memory") {
        // Hiện panel bộ nhớ
        if (memoryPanelAside) memoryPanelAside.classList.remove(hiddenClass);
        // Ẩn panel lịch sử
        if (historyUl) historyUl.classList.add(hiddenClass);

        updateMemoryDisplay();
    } else {
        // Hiện panel lịch sử
        if (historyUl) historyUl.classList.remove(hiddenClass);
        // Ẩn panel bộ nhớ
        if (memoryPanelAside) memoryPanelAside.classList.add(hiddenClass);

        updateHistory();
    }

    // Cập nhật class active cho tab
    if (historyTab && memoryTab) {
        historyTab.classList.remove(activeClass);
        memoryTab.classList.remove(activeClass);

        if (name === "history") {
            historyTab.classList.add(activeClass);
        } else {
            memoryTab.classList.add(activeClass);
        }
    }
}

// Gán sự kiện click cho hai tab
if (historyTab) {
    historyTab.addEventListener("click", () => showAsidePanel("history"));
}
if (memoryTab) {
    memoryTab.addEventListener("click", () => showAsidePanel("memory"));
}

// Khởi tạo ban đầu
updateScreen();
showAsidePanel("history");
