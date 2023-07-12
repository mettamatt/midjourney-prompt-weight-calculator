/**
 * Retrieves an HTML element by its id.
 *
 * @function
 * @param {string} id - The id of the HTML element to retrieve.
 * @returns {Element} - The HTML element retrieved.
 */
const element = (id) => document.getElementById(id);

/**
 * A mapping of HTML element ids to their corresponding elements. This object is created by 
 * reducing over a list of ids, using the 'element' function to retrieve each HTML element.
 *
 * @constant
 * @type {Object.<string, Element>}
 */
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

/**
 * Key used to access weight calculation data in local storage.
 *
 * @constant
 * @type {string}
 */
const localStorageKey = "weightCalculationData";

/**
 * HTML element for the copy to clipboard button.
 *
 * @constant
 * @type {Element}
 */
const copyButton = elements.copyToClipboard;

/**
 * Retrieves the weight calculation data from local storage.
 *
 * @function
 * @returns {Object} - The weight calculation data from local storage, if it exists. Otherwise, an 
 * empty object.
 */
const getDataFromLocalStorage = () => JSON.parse(localStorage.getItem(localStorageKey)) || {};

/**
 * Stores the provided data to local storage using the `localStorageKey`.
 *
 * @function
 * @param {Object} data - The data to store.
 */
const setDataToLocalStorage = (data) => localStorage.setItem(localStorageKey, JSON.stringify(data));

/**
 * Calculates the final prompt string to be used in the image generation, based on the given 
 * positive and negative weights and prompts.
 *
 * @function
 * @param {number} positiveWeight - The weight for the positive prompts.
 * @param {number} negativeWeight - The weight for the negative prompts.
 * @param {string[]} positivePrompts - The positive prompts.
 * @param {string[]} negativePrompts - The negative prompts.
 * @returns {string|null} - The final prompt string, or null if inputs are invalid.
 */
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

  const positivePromptCount = positivePrompts.filter((prompt) => prompt.trim() !== "").length;
  const negativePromptCount = negativePrompts.filter((prompt) => prompt.trim() !== "").length;

  const positivePromptWeight = positivePromptCount ? positiveWeight / positivePromptCount : 0;
  const negativePromptWeight = negativePromptCount ? negativeWeight / negativePromptCount : 0;

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

/**
 * Formats a number to have two decimal places if it is not an integer.
 *
 * @function
 * @param {number} num - The number to format.
 * @returns {string} - The formatted number.
 */
const formatNumber = (num) => (Number.isInteger(num) ? num : num.toFixed(2));

/**
 * Retrieves the positive weight from the HTML element and validates its value.
 *
 * @function
 * @returns {number} - The validated positive weight.
 */
const getPositiveWeight = () => {
  let positiveWeight = parseInt(elements.positiveWeight.value) || 0;
  if (positiveWeight > 100) {
    positiveWeight = 100;
    showToast("Positive weight cannot be more than 100.");
  }
  return positiveWeight;
};

/**
 * Updates the value of the negative weight element.
 *
 * @function
 * @param {number} negativeWeight - The new value for the negative weight.
 */
const updateNegativeWeight = (negativeWeight) => {
  elements.negativeWeightValue.value = `${negativeWeight}`;
};

/**
 * Validates that the total weight is not negative.
 *
 * @function
 * @param {number} negativeWeight - The negative weight.
 * @returns {boolean} - true if the total weight is valid, false otherwise.
 */
const validateTotalWeight = (negativeWeight) => {
  if (negativeWeight < 0) {
    showToast("Total weight cannot be negative. Please adjust your positive weight.");
    return false;
  }
  return true;
};

/**
 * Calculates the final prompt and updates the relevant HTML elements.
 *
 * @function
 * @param {number} positiveWeight - The positive weight.
 * @param {number} negativeWeight - The negative weight.
 * @param {string[]} positivePrompts - The positive prompts.
 * @param {string[]} negativePrompts - The negative prompts.
 */
const calculateFinalPrompt = (positiveWeight, negativeWeight, positivePrompts, negativePrompts) => {
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

/**
 * Retrieves the prompts from the HTML elements.
 *
 * @function
 * @param {string} promptPrefix - The prefix for the prompt element ids.
 * @param {string} promptCountId - The id for the prompt count element.
 * @returns {string[]} - The retrieved prompts.
 */
const getPrompts = (promptPrefix, promptCountId) => {
  const promptCountElement = document.getElementById(promptCountId);
  const promptCount = Math.min(parseInt(promptCountElement.value) || 0, 9);
  const prompts = [];

  for (let i = 1; i <= promptCount; i++) {
    const promptInput = document.getElementById(`${promptPrefix}${i}`);
    if (promptInput) {
      const promptText = promptInput.value;
      prompts.push(promptText.trim());
    }
  }

  return prompts;
};

/**
 * Performs the calculations and updates the HTML elements to display the results.
 *
 * @function
 */
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

  calculateFinalPrompt(positiveWeight, negativeWeight, positivePrompts, negativePrompts);
};

/**
 * Adds the prompts to the specified container.
 *
 * @function
 * @param {string} containerId - The id of the container to add the prompts to.
 * @param {string} promptCountId - The id for the prompt count element.
 * @param {string} promptPrefix - The prefix for the prompt element ids.
 */
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

/**
 * Adds a single prompt to a container.
 *
 * @function
 * @param {number} index - The index of the prompt to add.
 * @param {string} promptPrefix - The prefix for the prompt element id.
 * @param {Element} container - The container to add the prompt to.
 * @param {number} count - The total number of prompts.
 */
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

/**
 * Listens for a click event on the copy button, then copies the final prompt to the clipboard.
 *
 * @event
 */
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

/**
 * Fallback function for copying text to the clipboard, used when the navigator.clipboard API is 
 * not available.
 *
 * @function
 * @param {string} text - The text to copy to the clipboard.
 */
const fallbackCopyTextToClipboard = (text) => {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand("copy");
    var msg = successful ? "Copied to clipboard!" : "Failed to copy. Try again!";
    showToast(msg);
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
    showToast("Failed to copy. Try again!");
  }

  document.body.removeChild(textArea);
};

/**
 * Displays a toast message.
 *
 * @function
 * @param {string} message - The message to display.
 */
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

/**
 * Attaches a change event listener to the prompt count element, which triggers an update of the 
 * prompts and their display.
 *
 * @function
 * @param {string} promptCountId - The id for the prompt count element.
 * @param {string} containerId - The id of the container to add the prompts to.
 * @param {string} promptPrefix - The prefix for the prompt element ids.
 */
const attachPromptCountListener = (promptCountId, containerId, promptPrefix) => {
  const promptCountElement = document.getElementById(promptCountId);
  promptCountElement.addEventListener("change", () => {
    const data = getDataFromLocalStorage();
    data[promptCountId] = Number(promptCountElement.value);
    setDataToLocalStorage(data);

    addPrompts(containerId, promptCountId, promptPrefix);
  });
};

/**
 * Attach an event listener to the positivePromptIncrement button. 
 */
elements.positivePromptIncrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.positivePromptCount.value);
  if (currentValue < 9) {
    // Max value is 9
    elements.positivePromptCount.value = currentValue + 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["positivePromptCount"] = elements.positivePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts("positive-prompts-container", "positivePromptCount", "positivePrompt");
  }
});

/**
 * Attach an event listener to the positivePromptDecrement button. 
 */
elements.positivePromptDecrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.positivePromptCount.value);
  if (currentValue > 1) {
    // Min value is 1
    elements.positivePromptCount.value = currentValue - 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["positivePromptCount"] = elements.positivePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts("positive-prompts-container", "positivePromptCount", "positivePrompt");
  }
});

/**
 * Attach an event listener to the negativePromptIncrement button. 
 */
elements.negativePromptIncrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.negativePromptCount.value);
  if (currentValue < 9) {
    // Max value is 9
    elements.negativePromptCount.value = currentValue + 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["negativePromptCount"] = elements.negativePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts("negative-prompts-container", "negativePromptCount", "negativePrompt");
  }
});

/**
 * Attach an event listener to the negativePromptDecrement button. 
 */
elements.negativePromptDecrement.addEventListener("click", () => {
  let currentValue = parseInt(elements.negativePromptCount.value);
  if (currentValue > 1) {
    // Min value is 1
    elements.negativePromptCount.value = currentValue - 1;
    // update local storage and refresh prompts
    const data = getDataFromLocalStorage();
    data["negativePromptCount"] = elements.negativePromptCount.value;
    setDataToLocalStorage(data);
    addPrompts("negative-prompts-container", "negativePromptCount", "negativePrompt");
  }
});

/**
 * Attach an event listener to the positiveWeight input field. 
 */
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

/**
 * Attach an event listener to the DOMContentLoaded event. This event fires when the initial HTML 
 * document has been completely loaded and parsed.
 */
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

  addPrompts("positive-prompts-container", "positivePromptCount", "positivePrompt");
  addPrompts("negative-prompts-container", "negativePromptCount", "negativePrompt");

  attachPromptCountListener("positivePromptCount", "positive-prompts-container", "positivePrompt");
  attachPromptCountListener("negativePromptCount", "negative-prompts-container", "negativePrompt");

  calculateAndDisplay();
});

/**
 * Attach an event listener to the window's load event. This event fires when the whole page has 
 * loaded, including all dependent resources such as stylesheets and images.
 */
window.addEventListener("load", () => {
  elements.clearLocalStorage.addEventListener("click", () => {
    localStorage.removeItem(localStorageKey);
    location.reload();
  });
});
