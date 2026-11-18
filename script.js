"use strict";

/**
 * ============================================================================
 * КОНФІГУРАЦІЙНИЙ БЛОК (Динамічна архітектура без хардкоду)
 * При зміні номера варіанта або розмірності таблиці весь ланцюжок
 * валідації та матричних операцій перераховується автоматично.
 * ============================================================================
 */
const APP_CONFIG = {
  studentVariant: 24,
  table1RowOverride: null, // null = автоматичний розрахунок ((variant - 1) mod 15) + 1 -> рядок 9
  openSeparateWindowOnValid: false, // true = додатково відкривати popup-вікно при успішній валідації
  gridSize: 6, // Розмірність таблиці N x N (6x6 = 36 клітинок)
  dblClickVariantOverride: null, // null = автоматичний розрахунок (variant mod 10) -> правило 4
};

/**
 * Повний словник усіх 10 полів із Таблиці 2 методичних вказівок.
 */
const FIELD_DEFINITIONS = {
  1: {
    name: "fullName",
    label: "ПІБ",
    format: "ТТТТТТ Т.Т.",
    placeholder: "ПІБ (напр. Сардаковський Д.О.)",
    regex: /^[А-ЯІЇЄҐA-Z][а-яіїєґa-z'’-]{1,29}\s[А-ЯІЇЄҐA-Z]\.\s?[А-ЯІЇЄҐA-Z]\.$/,
    errorText: "Введіть прізвище та ініціали з крапками (напр. Сардаковський Д.О.)",
  },
  2: {
    name: "variant",
    label: "Варіант",
    format: "ЧЧ",
    placeholder: "Варіант (напр. 24)",
    regex: /^(?:[1-9]|[1-9]\d)$/,
    errorText: "Введіть номер варіанта з 1-2 цифр (напр. 24)",
  },
  3: {
    name: "group",
    label: "Група",
    format: "ТТ-ЧЧ",
    placeholder: "Група (напр. ІК-44)",
    regex: /^[А-ЯІЇЄҐA-Z]{2}-\d{2}$/,
    errorText: "Введіть шифр групи у форматі ТТ-ЧЧ (напр. ІК-44)",
  },
  4: {
    name: "phone",
    label: "Телефон",
    format: "(ЧЧЧ)-ЧЧЧ-ЧЧ-ЧЧ",
    placeholder: "Телефон (напр. (099)-123-45-67)",
    regex: /^\(\d{3}\)-\d{3}-\d{2}-\d{2}$/,
    errorText: "Введіть телефон у форматі (ЧЧЧ)-ЧЧЧ-ЧЧ-ЧЧ",
  },
  5: {
    name: "idCard",
    label: "ID-card",
    format: "ТТ №ЧЧЧЧЧЧ",
    placeholder: "ID-card (напр. КВ №123456)",
    regex: /^[А-ЯІЇЄҐA-Z]{2}\s№\d{6}$/,
    errorText: "Введіть ID-card у форматі ТТ №ЧЧЧЧЧЧ (напр. КВ №123456)",
  },
  6: {
    name: "faculty",
    label: "Факультет",
    format: "ТТТТ",
    placeholder: "Факультет (напр. ФІОТ)",
    regex: /^[А-ЯІЇЄҐA-Z]{4}$/,
    errorText: "Введіть абревіатуру факультету з 4 великих літер (напр. ФІОТ)",
  },
  7: {
    name: "birthDate",
    label: "Дата народж.",
    format: "ЧЧ.ЧЧ.ЧЧЧЧ",
    placeholder: "Дата народж. (напр. 09.08.2007)",
    regex: /^(?:0[1-9]|[12]\d|3[01])\.(?:0[1-9]|1[0-2])\.(?:19|20)\d{2}$/,
    errorText: "Введіть дату у форматі ДД.ММ.РРРР (напр. 09.08.2007)",
  },
  8: {
    name: "address",
    label: "Адреса",
    format: "м. ЧЧЧЧЧЧ",
    placeholder: "Адреса (напр. м. Бровари або м. 074000)",
    regex: /^м\.\s(?:[А-ЯІЇЄҐA-Z][а-яіїєґa-z'’-]{2,29}|\d{6})$/,
    errorText: "Введіть адресу у форматі 'м. Назва' або 'м. Індекс'",
  },
  9: {
    name: "email",
    label: "e-mail",
    format: "тттттт@ттттт.com",
    placeholder: "e-mail (напр. user@kpi.com)",
    regex: /^[a-zA-Z0-9._%+-]{2,30}@[a-zA-Z0-9.-]{2,20}\.com$/,
    errorText: "Введіть коректний e-mail із доменом .com",
  },
  10: {
    name: "telegram",
    label: "Telegram",
    format: "@Т_ТТТТТ",
    placeholder: "Telegram (напр. @D_Sardakovskyi)",
    regex: /^@[A-Za-zА-ЯІЇЄҐа-яіїєґ0-9]_[A-Za-zА-ЯІЇЄҐа-яіїєґ0-9_]{3,25}$/,
    errorText: "Введіть Telegram у форматі @Т_ТТТТТ",
  },
};

/**
 * Матриця відповідності варіантів Таблиці 1 номерам рядків Таблиці 2.
 */
const TABLE1_VARIANTS = {
  1: [1, 2, 3, 4, 5],
  2: [1, 3, 4, 5, 6],
  3: [1, 4, 5, 6, 7],
  4: [1, 5, 6, 7, 8],
  5: [1, 6, 7, 8, 9],
  6: [1, 7, 8, 9, 10],
  7: [1, 2, 4, 6, 8],
  8: [1, 3, 5, 7, 9],
  9: [1, 2, 3, 6, 7],
  10: [1, 3, 4, 8, 9],
  11: [1, 4, 6, 7, 8],
  12: [1, 5, 7, 8, 9],
  13: [1, 3, 4, 6, 8],
  14: [1, 4, 5, 7, 9],
  15: [1, 3, 6, 8, 10],
};

/**
 * ============================================================================
 * ЗАВДАННЯ 1: Формування та валідація HTML-форми регулярними виразами
 * ============================================================================
 */

/**
 * Обчислює номер рядка у Таблиці 1 для заданого варіанта студента.
 * @returns {number} Номер рядка Таблиці 1 (1..15)
 */
function getTable1RowIndex() {
  if (APP_CONFIG.table1RowOverride) {
    return APP_CONFIG.table1RowOverride;
  }
  return ((APP_CONFIG.studentVariant - 1) % 15) + 1;
}

/**
 * Синхронізує поля форми з конфігурацією поточного варіанта.
 * Якщо статична розмітка вже містить потрібні поля (1, 2, 3, 6, 7), зберігає їх;
 * якщо варіант у конфігурації змінено — динамічно перебудовує DOM форми.
 */
function initFormFields() {
  const container = document.getElementById("form-fields-container");
  if (!container) return;

  const rowIndex = getTable1RowIndex();
  const targetFieldIds = TABLE1_VARIANTS[rowIndex] || TABLE1_VARIANTS[9];

  const existingInputs = Array.from(container.querySelectorAll("input[data-field-id]"));
  const existingIds = existingInputs.map((input) => Number(input.dataset.fieldId));

  const isSameStructure =
    existingIds.length === targetFieldIds.length &&
    existingIds.every((id, idx) => id === targetFieldIds[idx]);

  if (!isSameStructure) {
    container.innerHTML = "";
    targetFieldIds.forEach((fieldId) => {
      const def = FIELD_DEFINITIONS[fieldId];
      if (!def) return;

      const group = document.createElement("div");
      group.className = "form-group";

      const label = document.createElement("label");
      label.setAttribute("for", `field-${def.name}`);
      label.textContent = `${def.label} (формат: ${def.format})`;

      const input = document.createElement("input");
      input.type = "text";
      input.id = `field-${def.name}`;
      input.name = def.name;
      input.dataset.fieldId = String(fieldId);
      input.placeholder = def.placeholder;

      const errorSpan = document.createElement("span");
      errorSpan.className = "error-hint";
      errorSpan.id = `error-${def.name}`;

      group.appendChild(label);
      group.appendChild(input);
      group.appendChild(errorSpan);
      container.appendChild(group);
    });
  }

  // Очищення помилки конкретного поля під час введення тексту користувачем
  container.querySelectorAll("input[data-field-id]").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      const def = FIELD_DEFINITIONS[Number(input.dataset.fieldId)];
      if (def) {
        const errorSpan = document.getElementById(`error-${def.name}`);
        if (errorSpan) errorSpan.textContent = "";
      }
    });
  });
}

/**
 * Перевіряє всі поля форми за допомогою регулярних виразів та оновлює інтерфейс.
 * @param {SubmitEvent} event - Подія відправки форми
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const inputs = Array.from(form.querySelectorAll("input[data-field-id]"));
  const outputContent = document.getElementById("output-content");

  let isFormValid = true;
  const validatedData = [];

  inputs.forEach((input) => {
    const fieldId = Number(input.dataset.fieldId);
    const def = FIELD_DEFINITIONS[fieldId];
    if (!def) return;

    const value = input.value.trim();
    const errorSpan = document.getElementById(`error-${def.name}`);
    const isValid = def.regex.test(value);

    input.classList.remove("input-error", "input-valid");

    if (!isValid) {
      isFormValid = false;
      input.classList.add("input-error");
      if (errorSpan) {
        errorSpan.textContent = def.errorText;
      }
    } else {
      input.classList.add("input-valid");
      if (errorSpan) {
        errorSpan.textContent = "";
      }
      validatedData.push({
        label: def.label,
        value: value,
      });
    }
  });

  if (!outputContent) return;

  if (isFormValid) {
    renderValidOutput(outputContent, validatedData);
    if (APP_CONFIG.openSeparateWindowOnValid) {
      openResultPopupWindow(validatedData);
    }
  } else {
    outputContent.innerHTML =
      '<p class="output-placeholder">Виправте виділені червоним поля та натисніть «Підтвердити».</p>';
  }
}

/**
 * Виводить перевірені дані у праву колонку «Введені дані» за зразком методички.
 * @param {HTMLElement} container - DOM-контейнер для виведення
 * @param {Array<{label: string, value: string}>} data - Масив валідних полів
 */
function renderValidOutput(container, data) {
  container.innerHTML = "";
  const list = document.createElement("ul");
  list.className = "output-list";

  data.forEach((item) => {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = `${item.label}: `;
    const textNode = document.createTextNode(item.value);

    li.appendChild(strong);
    li.appendChild(textNode);
    list.appendChild(li);
  });

  container.appendChild(list);
}

/**
 * Додаткова функція виведення валідних даних в окремому вікні браузера.
 * @param {Array<{label: string, value: string}>} data - Масив валідних полів
 */
function openResultPopupWindow(data) {
  const popup = window.open("", "_blank", "width=420,height=340,left=200,top=200");
  if (!popup) return;

  const rowsHtml = data
    .map((item) => `<p><strong>${item.label}:</strong> ${item.value}</p>`)
    .join("");

  popup.document.write(`
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <title>Введені дані — Варіант ${APP_CONFIG.studentVariant}</title>
      <style>
        body { font-family: "Times New Roman", serif; padding: 20px 28px; line-height: 1.5; }
        h2 { margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
        p { font-size: 18px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h2>Введені дані</h2>
      ${rowsHtml}
    </body>
    </html>
  `);
  popup.document.close();
}

/**
 * ============================================================================
 * ЗАВДАННЯ 2: Таблиця 6х6 та обробка подій mouseover, click, dblclick
 * ============================================================================
 */

/**
 * Генерує випадковий колір у форматі RGB.
 * @returns {string} Рядок виду "rgb(r, g, b)"
 */
function getRandomRgbColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Визначає правило для події dblclick (1..10) за номером варіанта.
 * Для варіанта 24: (24 mod 10) = 4 (побічна діагональ таблиці).
 * @returns {number} Номер правила (1..10)
 */
function getDblClickRuleNumber() {
  if (APP_CONFIG.dblClickVariantOverride) {
    return APP_CONFIG.dblClickVariantOverride;
  }
  const mod = APP_CONFIG.studentVariant % 10;
  return mod === 0 ? 10 : mod;
}

/**
 * Перевіряє, чи підпадає клітинка (row, col) під правило dblclick поточного варіанта.
 * Підтримує всі 10 варіантів із методичних вказівок для універсальності на захисті.
 * @param {number} row - Індекс рядка клітинки (0..N-1)
 * @param {number} col - Індекс стовпця клітинки (0..N-1)
 * @param {number} targetRow - Індекс рядка клітинки варіанта
 * @param {number} targetCol - Індекс стовпця клітинки варіанта
 * @param {number} gridSize - Розмірність матриці N
 * @param {number} ruleNumber - Номер варіанта дії dblclick (1..10)
 * @returns {boolean}
 */
function isCellMatchedByDblClickRule(row, col, targetRow, targetCol, gridSize, ruleNumber) {
  switch (ruleNumber) {
    case 1: // 1. Відповідний рядок таблиці
      return row === targetRow;
    case 2: // 2. Відповідний стовпець таблиці
      return col === targetCol;
    case 3: // 3. Головна діагональ таблиці
      return row === col;
    case 4: // 4. Побічна діагональ таблиці (Варіант 24 -> 24 mod 10 = 4)
      return row + col === gridSize - 1;
    case 5: // 5. Усі клітинки таблиці, крім обраної
      return !(row === targetRow && col === targetCol);
    case 6: // 6. Прямокутник, починаючи з вибраної комірки
      return row >= targetRow && col >= targetCol;
    case 7: // 7. Рядки таблиці, починаючи з обраного, через один
      return row >= targetRow && (row - targetRow) % 2 === 0;
    case 8: // 8. Стовпці таблиці, починаючи з обраного, через один
      return col >= targetCol && (col - targetCol) % 2 === 0;
    case 9: // 9. Клітинки в обраному стовпці, починаючи з обраної, через одну
      return col === targetCol && row >= targetRow && (row - targetRow) % 2 === 0;
    case 10: // 10. Клітинки в обраному рядку, починаючи з обраної, через одну
      return row === targetRow && col >= targetCol && (col - targetCol) % 2 === 0;
    default:
      return row + col === gridSize - 1;
  }
}

/**
 * Динамічно будує таблицю N x N (6x6) та призначає обробники подій клітинці варіанта.
 */
function initMatrixTable() {
  const tbody = document.getElementById("matrix-body");
  const colorPicker = document.getElementById("color-picker");
  if (!tbody || !colorPicker) return;

  const gridSize = APP_CONFIG.gridSize;
  const totalCells = gridSize * gridSize;
  const targetNumber =
    APP_CONFIG.studentVariant <= totalCells
      ? APP_CONFIG.studentVariant
      : ((APP_CONFIG.studentVariant - 1) % totalCells) + 1;

  tbody.innerHTML = "";
  const allCells = [];

  for (let r = 0; r < gridSize; r++) {
    const tr = document.createElement("tr");

    for (let c = 0; c < gridSize; c++) {
      const cellNumber = r * gridSize + c + 1;
      const td = document.createElement("td");
      td.textContent = String(cellNumber);
      td.dataset.row = String(r);
      td.dataset.col = String(c);
      td.dataset.number = String(cellNumber);

      if (cellNumber === targetNumber) {
        td.classList.add("variant-cell");
        td.title = `Клітинка варіанта №${targetNumber}: наведення — випадковий колір, клік — колір палітри, подвійний клік — побічна діагональ`;

        // Подія 1: Наведення курсора (mouseover) -> випадковий колір фону та тексту
        td.addEventListener("mouseover", () => {
          td.style.backgroundColor = getRandomRgbColor();
          td.style.color = getRandomRgbColor();
        });

        // Подія 2: Одинарний клік (click) -> колір із палітри
        td.addEventListener("click", () => {
          td.style.backgroundColor = colorPicker.value;
          td.style.color = "#000000";
        });

        // Подія 3: Подвійний клік (dblclick) -> зафарбування побічної діагоналі (варіант 4)
        td.addEventListener("dblclick", () => {
          const ruleNumber = getDblClickRuleNumber();
          const selectedColor = colorPicker.value;

          allCells.forEach((cell) => {
            const cellRow = Number(cell.dataset.row);
            const cellCol = Number(cell.dataset.col);

            if (isCellMatchedByDblClickRule(cellRow, cellCol, r, c, gridSize, ruleNumber)) {
              cell.style.backgroundColor = selectedColor;
              cell.style.color = "#000000";
            }
          });
        });
      }

      allCells.push(td);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }
}

/**
 * Точка входу: ініціалізація застосунку після завантаження DOM.
 */
document.addEventListener("DOMContentLoaded", () => {
  initFormFields();

  const validationForm = document.getElementById("validation-form");
  if (validationForm) {
    validationForm.addEventListener("submit", handleFormSubmit);
  }

  initMatrixTable();
});