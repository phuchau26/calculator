const currentValueDisplay = document.querySelector(".current-value");
const expressionDisplay = document.querySelector(".calculation-expression");
const keys = document.querySelector(".calculator-keys");
const historyList = document.querySelector(".history-list");
const historyTab = document.getElementById("history-tab");
const memoryTab = document.getElementById("memory-tab");
const memoryPanelAside = document.querySelector(".memory-panel-aside");
const historyUl = document.querySelector(".history-list");

let displayValue = "0";
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;
let lastInputWasEqual = false;
let calculationExpression = "";

let calculationHistory = [];
let memory = 0;
let memoryStack = [];

function updateScreen() {
  currentValueDisplay.textContent = displayValue;
  expressionDisplay.textContent = calculationExpression;
}

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

function updateHistory() {
  historyList.innerHTML = "";
  if (!calculationHistory || calculationHistory.length === 0) {
    historyList.innerHTML = '<li class="no-history">Chưa có lịch sử nào.</li>';
  } else {
    calculationHistory
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

function updateMemoryDisplay() {
  const memoryValueDisplay = document.querySelector(".memory-value");
  const memoryListEl = document.querySelector(".memory-list");
  if (!memoryValueDisplay || !memoryListEl) return;
  memoryValueDisplay.textContent =
    memoryStack.length === 0 ? "Không có" : String(memory);
  memoryListEl.innerHTML = "";
  if (memoryStack.length === 0) return;
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
  if (operator && firstOperand !== null) updateCalculationExpression();
}

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

const performCalculation = {
  "/": (first, second) => first / second,
  "*": (first, second) => first * second,
  "+": (first, second) => first + second,
  "-": (first, second) => first - second,
};

function handleOperator(nextOperator) {
  const inputValue = parseFloat(displayValue);
  if (isNaN(inputValue) && nextOperator !== "=") return;
  if (nextOperator === "=") {
    if (firstOperand === null || operator === null) {
      lastInputWasEqual = true;
      return;
    }
    const result = performCalculation[operator](firstOperand, inputValue);
    const rounded = parseFloat(result.toFixed(7));
    const displayExpr = `${firstOperand} ${displayOperator(
      operator
    )} ${inputValue}`;
    const entryObj = { expression: `${displayExpr} =`, result: rounded };
    calculationHistory.push(entryObj);
    updateHistory();
    displayValue = `${rounded}`;
    firstOperand = rounded;
    waitingForSecondOperand = true;
    lastInputWasEqual = true;
    calculationExpression = `${displayExpr} =`;
    operator = null;
    return;
  }
  if (operator && waitingForSecondOperand) {
    operator = nextOperator;
    calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
    updateScreen();
    return;
  }
  if (firstOperand !== null && operator) {
    const result = performCalculation[operator](firstOperand, inputValue);
    const rounded = parseFloat(result.toFixed(7));
    firstOperand = rounded;
    displayValue = `${rounded}`;
  } else {
    firstOperand = inputValue;
  }
  waitingForSecondOperand = true;
  operator = nextOperator;
  lastInputWasEqual = false;
  calculationExpression = `${firstOperand} ${displayOperator(operator)} `;
}

function handleUnary(op) {
  const value = parseFloat(displayValue);
  if (isNaN(value)) return;
  let result;
  let expr;
  switch (op) {
    case "%":
      if (firstOperand === null || operator === null) {
        result = value / 100;
        expr = `${value}%`;
      } else {
        if (operator === "+" || operator === "-") {
          result = (firstOperand * value) / 100;
        } else {
          result = value / 100;
        }
        const roundedPercent = parseFloat(Number(result).toFixed(7));
        displayValue = `${roundedPercent}`;
        calculationExpression = `${firstOperand} ${displayOperator(
          operator
        )} ${value}%`;
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
  if (firstOperand === null || operator === null) {
    firstOperand = rounded;
    waitingForSecondOperand = true;
    operator = null;
    calculationExpression = expr;
    const entryObj = { expression: `${expr} =`, result: rounded };
    calculationHistory.push(entryObj);
    updateHistory();
  } else {
    calculationExpression = `${firstOperand} ${displayOperator(
      operator
    )} ${expr}`;
  }
  updateScreen();
}

function resetCalculator() {
  displayValue = "0";
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
  calculationExpression = "";
  lastInputWasEqual = false;
  updateScreen();
}

function clearEntry() {
  displayValue = "0";
  updateCalculationExpression();
  updateScreen();
}

function memoryClear() {
  memory = 0;
  memoryStack = [];
  updateMemoryDisplay();
}

function memoryRecall() {
  displayValue = String(memory);
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

keys.addEventListener("click", (event) => {
  const { target } = event;
  const { value } = target;
  if (!target.matches("button")) return;
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
    case "negate":
      if (firstOperand === 0 && operator === "-") {
        const toggled = String(parseFloat(displayValue) * -1);
        displayValue = toggled;
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = false;
        calculationExpression = "";
        updateScreen();
      } else {
        displayValue = String(parseFloat(displayValue) * -1);
        updateCalculationExpression();
        updateScreen();
      }
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
    case "mc":
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
      if (Number.isInteger(parseFloat(value))) inputDigit(value);
  }
  updateScreen();
});

function showAsidePanel(name) {
  const activeClass = "active";
  const hiddenClass = "hidden";
  const style = document.createElement("style");
  style.innerHTML = `.hidden { display: none !important; }`;
  document.head.appendChild(style);
  if (name === "memory") {
    if (memoryPanelAside) memoryPanelAside.classList.remove(hiddenClass);
    if (historyUl) historyUl.classList.add(hiddenClass);
    updateMemoryDisplay();
  } else {
    if (historyUl) historyUl.classList.remove(hiddenClass);
    if (memoryPanelAside) memoryPanelAside.classList.add(hiddenClass);
    updateHistory();
  }
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

if (historyTab) {
  historyTab.addEventListener("click", () => showAsidePanel("history"));
}
if (memoryTab) {
  memoryTab.addEventListener("click", () => showAsidePanel("memory"));
}

updateScreen();
showAsidePanel("history");

document.addEventListener("keydown", (e) => {
  const k = e.key;
  if (/^[0-9]$/.test(k)) {
    inputDigit(k);
    flashButton(k);
    updateScreen();
    e.preventDefault();
    return;
  }
  if (k === "." || k === ",") {
    inputDecimal(".");
    flashButton(".");
    updateScreen();
    e.preventDefault();
    return;
  }
  if (k === "+" || k === "-" || k === "*" || k === "/") {
    handleOperator(k);
    flashButton(k);
    updateScreen();
    e.preventDefault();
    return;
  }
  if (k === "Enter" || k === "=") {
    handleOperator("=");
    flashButton("=");
    updateScreen();
    e.preventDefault();
    return;
  }
  if (k === "%") {
    handleUnary("%");
    flashButton("%");
    updateScreen();
    e.preventDefault();
    return;
  }
  if (k === "Backspace") {
    displayValue = displayValue.slice(0, -1) || "0";
    flashButton("backspace");
    updateCalculationExpression();
    updateScreen();
    e.preventDefault();
    return;
  }
  if (k === "Escape" || k === "c" || k === "C") {
    resetCalculator();
    flashButton("all-clear");
    e.preventDefault();
    return;
  }
});

document.addEventListener("keyup", (e) => {
  removeAllKeyPressed();
});

function flashButton(key) {
  let selector;
  switch (key) {
    case "*":
      selector = 'button[value="*"]';
      break;
    case "/":
      selector = 'button[value="/"]';
      break;
    case "+":
      selector = 'button[value="+"]';
      break;
    case "-":
      selector = 'button[value="-"]';
      break;
    case "=":
      selector = 'button[value="="]';
      break;
    case ".":
      selector = 'button[value="."]';
      break;
    case "%":
      selector = 'button[value="%"]';
      break;
    case "backspace":
      selector = 'button[value="backspace"]';
      break;
    case "all-clear":
      selector = 'button[value="all-clear"]';
      break;
    default:
      if (/^[0-9]$/.test(key)) selector = `button[value="${key}"]`;
  }
  if (!selector) return;
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.classList.add("key-pressed");
}

function removeAllKeyPressed() {
  document
    .querySelectorAll(".calculator-keys button.key-pressed")
    .forEach((b) => b.classList.remove("key-pressed"));
}
