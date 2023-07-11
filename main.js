const element = (id) => document.getElementById(id);
const elements = [
  "positiveWeight",
  "positiveWeightValue",
  "negativeWeightValue",
  "result",
  "instructionsOverlay",
  "showInstructions",
  "closeInstructions",
  "positivePromptCount",
  "negativePromptCount",
  "clearLocalStorage",
  "positivePromptIncrement",
  "positivePromptDecrement",
  "negativePromptIncrement",
  "negativePromptDecrement",
  "copyToClipboard",
  "toast",
].reduce((acc, id) => ({ ...acc, [id]: element(id) }), {});

const localStorageKey = "weightCalculationData";
const copyButton = elements.copyToClipboard;

const getDataFromLocalStorage = () =>
  JSON.parse(localStorage.getItem(localStorageKey)) || {};
const setDataToLocalStorage = (data) =>
  localStorage.setItem(localStorageKey, JSON.stringify(data));

const calculateWeights = (
  positiveWeight = 60,
  negativeWeight = 100 - positiveWeight,
  positivePrompts = [],
  negativePrompts = [],
) => {
  if (
    typeof positiveWeight !== "number" ||
    typeof negativeWeight !== "number" ||
    positiveWeight < 0 ||
    negativeWeight < 0
  ) {
    console.error("Invalid weights provided");
    return;
  }

  if (!Array.isArray(positivePrompts) || !Array.isArray(negativePrompts)) {
    console.error("Prompts must be arrays");
    return;
  }

  const positivePromptCount = positivePrompts.filter(
    (prompt) => prompt.trim() !== "",
  ).length;
  const negativePromptCount = negativePrompts.filter(
    (prompt) => prompt.trim() !== "",
  ).length;

  const positivePromptWeight = positivePromptCount
    ? positiveWeight / positivePromptCount
    : 0;
  const negativePromptWeight = negativePromptCount
    ? negativeWeight / negativePromptCount
    : 0;

  let finalPrompt = "";

  positivePrompts.forEach((prompt) => {
    if (prompt.trim() !== "") {
      finalPrompt += `${prompt}::${formatNumber(positivePromptWeight)} `;
    }
  });

  negativePrompts.forEach((prompt) => {
    if (prompt.trim() !== "") {
      finalPrompt += `${prompt}::-${formatNumber(negativePromptWeight)} `;
    }
  });

  return finalPrompt.trim();
};

const formatNumber = (num) => (Number.isInteger(num) ? num : num.toFixed(2));

const getPositiveWeight = () => {
  let positiveWeight = parseInt(elements.positiveWeight.value) || 0;
  if (positiveWeight > 100) {
    positiveWeight = 100;
    showToast("Positive weight cannot be more than 100.");
  }
  return positiveWeight;
};

const updateNegativeWeight = (negativeWeight) => {
  elements.negativeWeightValue.value = `${negativeWeight}`;
};

const validateTotalWeight = (negativeWeight) => {
  if (negativeWeight < 0) {
    showToast(
      "Total weight cannot be negative. Please adjust your positive weight.",
    );
    return false;
  }
  return true;
};

const calculateFinalPrompt = (
  positiveWeight,
  negativeWeight,
  positivePrompts,
  negativePrompts,
) => {
  if (positivePrompts.length > 0 || negativePrompts.length > 0) {
    const finalPrompt = calculateWeights(
      positiveWeight,
      negativeWeight,
      positivePrompts,
      negativePrompts,
    );
    elements.result.value = `${finalPrompt}`;
    elements.result.classList.add("flash");
    setTimeout(() => elements.result.classList.remove("flash"), 1000);
    elements.negativeWeightValue.value = `${negativeWeight}`;
  }
};

const getPrompts = (promptPrefix, promptCountId) => {
  const promptCountElement = document.getElementById(promptCountId);
  const promptCount = Math.min(parseInt(promptCountElement.value) || 0, 9);
  const prompts = [];

  for (let i = 1; i <= promptCount; i++) {
    const promptInput = document.getElementById(`${promptPrefix}${i}`);
    if (promptInput) {
      const promptText = promptInput.value;
      prompts.push(promptText);
    }
  }

  return prompts;
};

const calculateAndDisplay = () => {
  const positiveWeight = getPositiveWeight();
  elements.positiveWeightValue.textContent = positiveWeight;

  const negativeWeight = 100 - positiveWeight;

  if (!validateTotalWeight(negativeWeight)) {
    return;
  }

  updateNegativeWeight(negativeWeight);

  const positivePrompts = getPrompts("positivePrompt", "positivePromptCount");
  const negativePrompts = getPrompts("negativePrompt", "negativePromptCount");

  calculateFinalPrompt(
    positiveWeight,
    negativeWeight,
    positivePrompts,
    negativePrompts,
  );
};

const addPrompts = (containerId, promptCountId, promptPrefix) => {
  const countElement =
    promptCountId === "positivePromptCount"
      ? elements.positivePromptCount
      : elements.negativePromptCount;
  const count = Math.min(Number(countElement.value) || 0, 9);
  const container = document.getElementById(containerId);

  const data = getDataFromLocalStorage();

  while (container.firstChild) {
    container.firstChild.remove();
  }

  for (let i = 1; i <= count; i++) {
    addPrompt(i, promptPrefix, container, count);
    const promptInput = document.getElementById(`${promptPrefix}${i}`);
    if (promptInput) {
      promptInput.value = data[promptInput.id] || "";
    }
  }

  calculateAndDisplay();
};

const addPrompt = (index, promptPrefix, container, count) => {
  const prompt = document.createElement("input");
  prompt.id = `${promptPrefix}${index}`;
  prompt.classList.add("prompt-input");
  prompt.type = "text";
  prompt.placeholder = `Prompt ${index}`;

  prompt.addEventListener("input", () => {
    calculateAndDisplay();

    let data = getDataFromLocalStorage();
    data[prompt.id] = prompt.value.trim();
    setDataToLocalStorage(data);
  });

  const separator = document.createElement("span");
  separator.textContent = "::";

  container.appendChild(prompt);

  if (count > 1 && index !== count) {
    container.appendChild(separator);
  }
};

copyButton.addEventListener("click", () => {
  const finalPrompt = elements.result.value;
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(finalPrompt);
    return;
  }
  navigator.clipboard.writeText(finalPrompt).then(
    function () {
      showToast("Copied to clipboard!");
    },
    function (err) {
      console.error("Async: Could not copy text: ", err);
      showToast("Failed to copy. Try again!");
    },
  );
});

const fallbackCopyTextToClipboard = (text) => {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand("copy");
    var msg = successful
      ? "Copied to clipboard!"
      : "Failed to copy. Try again!";
    showToast(msg);
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
    showToast("Failed to copy. Try again!");
  }

  document.body.removeChild(textArea);
};

const showToast = (message) => {
  if (!message) return;
  const toast = elements.toast;
  toast.innerHTML = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.innerHTML = "";
    }, 1000);
  }, 5000);
};

const attachPromptCountListener = (
  promptCountId,
  containerId,
  promptPrefix,
) => {
  const promptCountElement = document.getElementById(promptCountId);
  promptCountElement.addEventListener("change", () => {
    const data = getDataFromLocalStorage();
    data[promptCountId] = Number(promptCountElement.value);
    setDataToLocalStorage(data);

    addPrompts(containerId, promptCountId, promptPrefix);
  });
};

elements.positivePromptIncrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.positivePromptCount.value);
  if (currentValue < 9) {
    // Max value is 9
    elements.positivePromptCount.value = currentValue + 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["positivePromptCount"] = elements.positivePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts(
      "positive-prompts-container",
      "positivePromptCount",
      "positivePrompt",
    );
  }
});

elements.positivePromptDecrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.positivePromptCount.value);
  if (currentValue > 1) {
    // Min value is 1
    elements.positivePromptCount.value = currentValue - 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["positivePromptCount"] = elements.positivePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts(
      "positive-prompts-container",
      "positivePromptCount",
      "positivePrompt",
    );
  }
});

elements.negativePromptIncrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.negativePromptCount.value);
  if (currentValue < 9) {
    // Max value is 9
    elements.negativePromptCount.value = currentValue + 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["negativePromptCount"] = elements.negativePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts(
      "negative-prompts-container",
      "negativePromptCount",
      "negativePrompt",
    );
  }
});

elements.negativePromptDecrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.negativePromptCount.value);
  if (currentValue > 1) {
    // Min value is 1
    elements.negativePromptCount.value = currentValue - 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["negativePromptCount"] = elements.negativePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts(
      "negative-prompts-container",
      "negativePromptCount",
      "negativePrompt",
    );
  }
});

elements.positiveWeight.addEventListener("input", () => {
  const positiveWeight = getPositiveWeight();
  elements.positiveWeightValue.textContent = positiveWeight;

  const negativeWeight = 100 - positiveWeight;
  updateNegativeWeight(negativeWeight);

  const data = getDataFromLocalStorage();
  data["positiveWeight"] = positiveWeight;
  setDataToLocalStorage(data);

  calculateAndDisplay();
});

document.addEventListener("DOMContentLoaded", () => {
  const data = getDataFromLocalStorage();

  elements.positiveWeight.value = data.positiveWeight || 60;
  elements.positivePromptCount.value = data.positivePromptCount || 1;
  elements.negativePromptCount.value = data.negativePromptCount || 1;

  elements.showInstructions.addEventListener(
    "click",
    () => (elements.instructionsOverlay.style.display = "block"),
  );
  elements.closeInstructions.addEventListener(
    "click",
    () => (elements.instructionsOverlay.style.display = "none"),
  );

  addPrompts(
    "positive-prompts-container",
    "positivePromptCount",
    "positivePrompt",
  );
  addPrompts(
    "negative-prompts-container",
    "negativePromptCount",
    "negativePrompt",
  );

  attachPromptCountListener(
    "positivePromptCount",
    "positive-prompts-container",
    "positivePrompt",
  );
  attachPromptCountListener(
    "negativePromptCount",
    "negative-prompts-container",
    "negativePrompt",
  );

  calculateAndDisplay();
});

window.addEventListener("load", () => {
  elements.clearLocalStorage.addEventListener("click", () => {
    localStorage.removeItem(localStorageKey);
    location.reload();
  });
});