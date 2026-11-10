(function () {
  const HOME_VISIT_FEE = 10000;
  const PROGRESS = {
    1: 33,
    2: 66,
    3: 100
  };

  const services = document.getElementById("services");
  const weights = document.getElementById("weights");
  const homeVisit = document.getElementById("homeVisit");
  const selectedList = document.getElementById("selectedList");
  const step1Hint = document.getElementById("step1Hint");
  const next1 = document.getElementById("next1");
  const next2 = document.getElementById("next2");
  const back2 = document.getElementById("back2");
  const back3 = document.getElementById("back3");
  const totalPrice = document.getElementById("totalPrice");
  const formulaText = document.getElementById("formulaText");
  const leadForm = document.getElementById("leadForm");
  const clientName = document.getElementById("clientName");
  const clientPhone = document.getElementById("clientPhone");
  const successMsg = document.getElementById("successMsg");
  const progressLabel = document.getElementById("progressLabel");
  const progressPercent = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");

  let currentStep = 1;
  let selectedMarkup = 0;
  let selectedWeightLabel = "до 5 кг";
  let isAnimating = false;

  function formatTenge(amount) {
    return Math.round(amount).toLocaleString("ru-RU");
  }

  function getSelectedServiceButtons() {
    return Array.from(services.querySelectorAll(".option.selected"));
  }

  function getServicesSum() {
    return getSelectedServiceButtons().reduce(function (sum, button) {
      return sum + Number(button.dataset.service);
    }, 0);
  }

  function calculateTotal() {
    const servicesSum = getServicesSum();
    // Итог = (Сумма услуг) * (1 + наценка за вес) + 10000 если выезд
    let total = servicesSum * (1 + selectedMarkup / 100);
    if (homeVisit.checked) {
      total += HOME_VISIT_FEE;
    }
    return {
      servicesSum: servicesSum,
      total: Math.round(total)
    };
  }

  function updateSelectedList() {
    const names = getSelectedServiceButtons().map(function (button) {
      return button.dataset.name;
    });

    selectedList.textContent =
      names.length === 0
        ? "Выбрано: ничего"
        : "Выбрано: " + names.join(", ");
  }

  function updateStep1State() {
    const hasServices = getSelectedServiceButtons().length > 0;
    next1.disabled = !hasServices;
    next1.setAttribute("aria-disabled", hasServices ? "false" : "true");
    step1Hint.classList.toggle("hidden", hasServices);
    updateSelectedList();
  }

  function updateTotalBlock() {
    const result = calculateTotal();
    totalPrice.textContent = formatTenge(result.total);

    const markupRatio = selectedMarkup / 100;
    const visitPart = homeVisit.checked ? " + 10000" : "";
    formulaText.textContent =
      "Формула: (" +
      formatTenge(result.servicesSum) +
      ") × (1 + " +
      markupRatio +
      ")" +
      visitPart +
      " = " +
      formatTenge(result.total) +
      " ₸";
  }

  function updateProgress(step) {
    const percent = PROGRESS[step];
    progressLabel.textContent = "Шаг " + step + " из 3";
    progressPercent.textContent = percent + "%";
    progressFill.style.width = percent + "%";
  }

  function getStepEl(step) {
    return document.getElementById("step" + step);
  }

  function setStepInteractive(stepEl, enabled) {
    stepEl.setAttribute("aria-hidden", enabled ? "false" : "true");
    if ("inert" in stepEl) {
      stepEl.inert = !enabled;
    }
  }

  function showStep(nextStep, direction) {
    if (isAnimating || nextStep === currentStep) return;
    if (nextStep < 1 || nextStep > 3) return;

    const currentEl = getStepEl(currentStep);
    const nextEl = getStepEl(nextStep);
    isAnimating = true;

    currentEl.classList.remove("is-active", "from-left", "from-right");
    currentEl.classList.add(direction === "back" ? "to-right" : "to-left");
    setStepInteractive(currentEl, false);

    nextEl.classList.remove("to-left", "to-right", "is-active");
    nextEl.classList.add(direction === "back" ? "from-left" : "from-right");
    setStepInteractive(nextEl, true);

    void nextEl.offsetWidth;

    nextEl.classList.add("is-active");
    nextEl.classList.remove("from-left", "from-right");

    updateProgress(nextStep);
    if (nextStep === 3) {
      updateTotalBlock();
    }

    window.setTimeout(function () {
      currentEl.classList.remove("to-left", "to-right");
      currentStep = nextStep;
      isAnimating = false;
    }, 380);
  }

  function hideSuccess() {
    successMsg.classList.add("hidden");
  }

  function buildWhatsAppText(name, phone) {
    const selected = getSelectedServiceButtons().map(function (button) {
      return button.dataset.name;
    });
    const result = calculateTotal();
    const visitText = homeVisit.checked ? "да (+10 000 ₸)" : "нет";

    return [
      "Здравствуйте! Хочу получить смету ВетДок.",
      "Имя: " + name,
      "Телефон: " + phone,
      "Услуги: " + selected.join(", "),
      "Вес: " + selectedWeightLabel,
      "Выезд на дом: " + visitText,
      "Итого: " + formatTenge(result.total) + " ₸"
    ].join("\n");
  }

  services.addEventListener("click", function (event) {
    const button = event.target.closest(".option");
    if (!button || !services.contains(button)) return;

    const isSelected = button.classList.toggle("selected");
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    hideSuccess();
    updateStep1State();
  });

  weights.addEventListener("click", function (event) {
    const button = event.target.closest(".option");
    if (!button || !weights.contains(button)) return;

    weights.querySelectorAll(".option").forEach(function (option) {
      const isSelected = option === button;
      option.classList.toggle("selected", isSelected);
      option.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });

    selectedMarkup = Number(button.dataset.markup);
    selectedWeightLabel = button.dataset.weightLabel;
    hideSuccess();
  });

  homeVisit.addEventListener("change", function () {
    hideSuccess();
    updateTotalBlock();
  });

  next1.addEventListener("click", function () {
    if (next1.disabled) return;
    showStep(2, "forward");
  });

  next2.addEventListener("click", function () {
    showStep(3, "forward");
  });

  back2.addEventListener("click", function () {
    showStep(1, "back");
  });

  back3.addEventListener("click", function () {
    hideSuccess();
    showStep(2, "back");
  });

  leadForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = clientName.value.trim();
    const phone = clientPhone.value.trim();
    let valid = true;

    clientName.classList.toggle("is-invalid", !name);
    clientPhone.classList.toggle("is-invalid", !phone);
    if (!name) valid = false;
    if (!phone) valid = false;
    if (!valid) return;

    const text = buildWhatsAppText(name, phone);
    const whatsappUrl = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    successMsg.classList.remove("hidden");
  });

  clientName.addEventListener("input", function () {
    clientName.classList.remove("is-invalid");
  });

  clientPhone.addEventListener("input", function () {
    clientPhone.classList.remove("is-invalid");
  });

  setStepInteractive(getStepEl(1), true);
  setStepInteractive(getStepEl(2), false);
  setStepInteractive(getStepEl(3), false);
  updateProgress(1);
  updateStep1State();
})();
