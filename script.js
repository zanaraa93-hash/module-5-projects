(function () {
  "use strict";

  var THEME_KEY = "wedding-card-theme";

  var themeToggle = document.getElementById("themeToggle");
  var openCalculatorBtn = document.getElementById("openCalculator");
  var calculator = document.getElementById("calculator");
  var guestsInput = document.getElementById("guests");
  var guestsRange = document.getElementById("guestsRange");
  var budgetInput = document.getElementById("budget");
  var calcEstimateBtn = document.getElementById("calcEstimate");
  var estimateBox = document.getElementById("estimate");
  var estimateTotal = document.getElementById("estimateTotal");
  var estimateList = document.getElementById("estimateList");
  var leadForm = document.getElementById("leadForm");
  var nameInput = document.getElementById("name");
  var phoneInput = document.getElementById("phone");
  var weddingDateInput = document.getElementById("weddingDate");
  var nameError = document.getElementById("nameError");
  var phoneError = document.getElementById("phoneError");
  var dateError = document.getElementById("dateError");
  var toast = document.getElementById("toast");
  var toastClose = document.getElementById("toastClose");
  var budgetChips = document.querySelectorAll(".chip");

  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = saved || (prefersDark ? "dark" : "light");
    applyTheme(theme);
  }

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function toggleTheme() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  }

  function formatTenge(amount) {
    return (
      new Intl.NumberFormat("ru-KZ").format(Math.round(amount)) + " ₸"
    );
  }

  function syncGuests(fromRange) {
    if (fromRange) {
      guestsInput.value = guestsRange.value;
    } else {
      var value = Number(guestsInput.value) || 10;
      value = Math.min(300, Math.max(10, value));
      guestsInput.value = value;
      guestsRange.value = value;
    }
  }

  function setActiveBudgetChip(value) {
    budgetChips.forEach(function (chip) {
      var chipValue = Number(chip.getAttribute("data-budget"));
      chip.classList.toggle("is-active", chipValue === value);
    });
  }

  function buildEstimate(guests, budget) {
    var perGuest = budget / guests;
    var venue = budget * 0.35;
    var catering = guests * Math.max(12000, Math.min(perGuest * 0.4, 35000));
    var photoVideo = budget * 0.12;
    var decor = budget * 0.1;
    var music = budget * 0.08;
    var dress = budget * 0.1;
    var other = Math.max(0, budget - (venue + catering + photoVideo + decor + music + dress));

    var items = [
      { name: "Площадка / банкетный зал", amount: venue },
      { name: "Кейтеринг на гостей", amount: catering },
      { name: "Фото + видео", amount: photoVideo },
      { name: "Декор и флористика", amount: decor },
      { name: "Ведущий / музыка", amount: music },
      { name: "Платье / костюм", amount: dress },
      { name: "Прочее и резерв", amount: other },
    ];

    var total = items.reduce(function (sum, item) {
      return sum + item.amount;
    }, 0);

    return { items: items, total: total, perGuest: total / guests };
  }

  function showEstimate() {
    var guests = Number(guestsInput.value) || 50;
    var budget = Number(budgetInput.value) || 3000000;

    if (guests < 10) guests = 10;
    if (budget < 500000) budget = 500000;

    guestsInput.value = guests;
    budgetInput.value = budget;
    guestsRange.value = Math.min(300, guests);

    var result = buildEstimate(guests, budget);

    estimateTotal.textContent =
      formatTenge(result.total) +
      " • ~" +
      formatTenge(result.perGuest) +
      " на гостя";

    estimateList.innerHTML = "";
    result.items.forEach(function (item) {
      var li = document.createElement("li");
      var left = document.createElement("span");
      var right = document.createElement("span");
      left.textContent = item.name;
      right.textContent = formatTenge(item.amount);
      li.appendChild(left);
      li.appendChild(right);
      estimateList.appendChild(li);
    });

    estimateBox.hidden = false;
  }

  function openCalculator() {
    calculator.hidden = false;
    openCalculatorBtn.setAttribute("aria-expanded", "true");
    calculator.scrollIntoView({ behavior: "smooth", block: "start" });
    showEstimate();
  }

  function showFieldError(input, errorEl, message) {
    input.classList.add("is-invalid");
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function clearFieldError(input, errorEl) {
    input.classList.remove("is-invalid");
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function normalizeKzPhone(value) {
    var digits = String(value || "").replace(/\D/g, "");

    if (digits.length === 11 && digits.charAt(0) === "8") {
      digits = "7" + digits.slice(1);
    }

    if (digits.length === 10 && digits.charAt(0) === "7") {
      digits = "7" + digits;
    }

    return digits;
  }

  function isValidKzPhone(value) {
    var digits = normalizeKzPhone(value);
    // Казахстан: +7 и 10 цифр номера, операторский код 700–778 и городские 7xx
    return /^7(7\d{9})$/.test(digits);
  }

  function formatPhoneDisplay(value) {
    var digits = normalizeKzPhone(value);
    if (digits.length !== 11) return value;

    return (
      "+7 " +
      digits.slice(1, 4) +
      " " +
      digits.slice(4, 7) +
      " " +
      digits.slice(7, 9) +
      " " +
      digits.slice(9, 11)
    );
  }

  function validateForm() {
    var valid = true;

    clearFieldError(nameInput, nameError);
    clearFieldError(phoneInput, phoneError);
    clearFieldError(weddingDateInput, dateError);

    var name = nameInput.value.trim();
    if (name.length < 2) {
      showFieldError(nameInput, nameError, "Введи имя (минимум 2 буквы)");
      valid = false;
    }

    if (!isValidKzPhone(phoneInput.value)) {
      showFieldError(
        phoneInput,
        phoneError,
        "Введи телефон Казахстана в формате +7 XXX XXX XX XX"
      );
      valid = false;
    }

    if (!weddingDateInput.value) {
      showFieldError(weddingDateInput, dateError, "Выбери дату свадьбы");
      valid = false;
    } else {
      var selected = new Date(weddingDateInput.value + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        showFieldError(
          weddingDateInput,
          dateError,
          "Дата свадьбы не может быть в прошлом"
        );
        valid = false;
      }
    }

    return valid;
  }

  function showToast() {
    toast.hidden = false;
  }

  function hideToast() {
    toast.hidden = true;
  }

  function onSubmit(event) {
    event.preventDefault();

    if (!validateForm()) return;

    phoneInput.value = formatPhoneDisplay(phoneInput.value);

    // Здесь позже можно подключить реальную отправку
    showToast();
    leadForm.reset();
  }

  themeToggle.addEventListener("click", toggleTheme);
  openCalculatorBtn.addEventListener("click", openCalculator);
  calcEstimateBtn.addEventListener("click", showEstimate);

  guestsInput.addEventListener("input", function () {
    syncGuests(false);
  });

  guestsRange.addEventListener("input", function () {
    syncGuests(true);
  });

  budgetChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var value = Number(chip.getAttribute("data-budget"));
      budgetInput.value = value;
      setActiveBudgetChip(value);
    });
  });

  budgetInput.addEventListener("input", function () {
    setActiveBudgetChip(Number(budgetInput.value));
  });

  phoneInput.addEventListener("blur", function () {
    if (isValidKzPhone(phoneInput.value)) {
      phoneInput.value = formatPhoneDisplay(phoneInput.value);
      clearFieldError(phoneInput, phoneError);
    }
  });

  leadForm.addEventListener("submit", onSubmit);
  toastClose.addEventListener("click", hideToast);

  toast.addEventListener("click", function (event) {
    if (event.target === toast) hideToast();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !toast.hidden) hideToast();
  });

  openCalculatorBtn.setAttribute("aria-expanded", "false");
  initTheme();
})();
