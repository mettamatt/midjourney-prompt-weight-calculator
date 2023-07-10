const localStorageKey = 'weightCalculationData';
const negativeWeightValueElement = document.getElementById('negativeWeightValue');
const resultElement = document.getElementById('result');

// Open instructions overlay
const instructionsOverlay = document.getElementById('instructionsOverlay');
const openInstructionsButton = document.getElementById('openInstructions');
const closeInstructionsButton = document.getElementById('closeInstructions');

const getDataFromLocalStorage = () => {
  return JSON.parse(localStorage.getItem(localStorageKey)) || {};
};

const setDataToLocalStorage = (data) => {
  localStorage.setItem(localStorageKey, JSON.stringify(data));
};

const calculateWeights = (positiveWeight = 60, negativeWeight = 100 - positiveWeight, positivePrompts = [], negativePrompts = []) => {
  const positivePromptCount = positivePrompts.filter(prompt => prompt.trim() !== "").length;
  const negativePromptCount = negativePrompts.filter(prompt => prompt.trim() !== "").length;

  const positivePromptWeight = positivePromptCount ? positiveWeight / positivePromptCount : 0;
  const negativePromptWeight = negativePromptCount ? negativeWeight / negativePromptCount : 0;

  let finalPrompt = '';

  positivePrompts.forEach(prompt => {
    if (prompt.trim() !== "") {
      finalPrompt += `${prompt}::${formatNumber(positivePromptWeight)} `;
    }
  });

  negativePrompts.forEach(prompt => {
    if (prompt.trim() !== "") {
      finalPrompt += `${prompt}::-${formatNumber(negativePromptWeight)} `;
    }
  });

  return finalPrompt.trim();
}

const formatNumber = (num) => Number.isInteger(num) ? num : num.toFixed(2);

const getPositiveWeight = () => {
  const positiveWeightElement = document.getElementById('positiveWeight');
  const positiveWeight = parseInt(positiveWeightElement.value) || 0;
  return positiveWeight;
}

const updateNegativeWeight = (negativeWeight) => {
  negativeWeightValueElement.value = `${negativeWeight}`;
}

const validateTotalWeight = (negativeWeight) => {
  if (negativeWeight < 0) {
    showToast("Total weight cannot be negative. Please adjust your positive weight.");
    return false;
  }
  return true;
}

const calculateFinalPrompt = (positiveWeight, negativeWeight, positivePrompts, negativePrompts) => {
  if (positivePrompts.length > 0 || negativePrompts.length > 0) {
    const finalPrompt = calculateWeights(positiveWeight, negativeWeight, positivePrompts, negativePrompts);
    resultElement.value = `${finalPrompt}`;
    resultElement.classList.add('flash');
    setTimeout(() => resultElement.classList.remove('flash'), 1000);
    negativeWeightValueElement.value = `${negativeWeight}`;
  }
}

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
}

const calculateAndDisplay = () => {
  const positiveWeight = getPositiveWeight();

  const negativeWeight = 100 - positiveWeight;

  if (!validateTotalWeight(negativeWeight)) {
    return;
  }

  updateNegativeWeight(negativeWeight);

  const positivePrompts = getPrompts('positivePrompt', 'positivePromptCount');
  const negativePrompts = getPrompts('negativePrompt', 'negativePromptCount');

  calculateFinalPrompt(positiveWeight, negativeWeight, positivePrompts, negativePrompts);
}

const addPrompts = (containerId, promptCountId, promptPrefix) => {
  const countElement = document.getElementById(promptCountId);
  const count = Math.min(Number(countElement.value) || 0, 9);
  const container = document.getElementById(containerId);

  const data = getDataFromLocalStorage(); 

  while (container.firstChild) {
    container.firstChild.remove();
  }

  for (let i = 1; i <= count; i++) {
    addPrompt(i, promptPrefix, container, data, count);
    const promptInput = document.getElementById(`${promptPrefix}${i}`);
    if (promptInput) {
      promptInput.value = data[promptInput.id] || "";
    }
  }

  calculateAndDisplay();
};

const addPrompt = (index, promptPrefix, container, count) => {
  const prompt = document.createElement('input');
  prompt.id = `${promptPrefix}${index}`;
  prompt.classList.add('prompt-input');
  prompt.type = 'text';
  prompt.placeholder = `Prompt ${index}`;

  prompt.addEventListener('input', () => {
    calculateAndDisplay();

    let data = getDataFromLocalStorage();
    data[prompt.id] = prompt.value;
    setDataToLocalStorage(data);
  });

  const separator = document.createElement('span');
  separator.textContent = '::';

  container.appendChild(prompt);

  if(count > 1 && index !== count) {
    container.appendChild(separator);
  }
};

const showToast = message => {
  const toast = document.getElementById("toast");
  toast.textContent = "";
  toast.insertAdjacentHTML("afterbegin", message);
  toast.classList.add("show");

  setTimeout(() => { 
    toast.classList.remove("show");
  }, 4000);
}      

const attachPromptCountListener = (promptCountId, containerId, promptPrefix) => {
  const promptCountElement = document.getElementById(promptCountId);
  promptCountElement.addEventListener('change', () => {
    const data = getDataFromLocalStorage();
    data[promptCountId] = Number(promptCountElement.value);
    setDataToLocalStorage(data);

    addPrompts(containerId, promptCountId, promptPrefix);
  });
}

document.getElementById('positiveWeight').addEventListener('input', () => {
  const positiveWeightElement = document.getElementById('positiveWeight');

  if (positiveWeightElement.value < 51) {
    positiveWeightElement.value = 51;
    showToast("<strong>Positive Weight</strong> must be 51% or higher so total prompt weight remains positive.<br>See the <a href='https://docs.midjourney.com/docs/multi-prompts#negative-prompt-weights' target='_blank'>Midjourney docs</a> for details.");
  }

  const data = getDataFromLocalStorage();
  data['positiveWeight'] = positiveWeightElement.value;
  setDataToLocalStorage(data);

  calculateAndDisplay();

  const negativeWeight = 100 - positiveWeightElement.value;
  updateNegativeWeight(negativeWeight);
});

document.addEventListener('DOMContentLoaded', (event) => {
  const instructionsOverlay = document.getElementById('instructionsOverlay');
  const showInstructionsButton = document.getElementById('showInstructions');
  const closeInstructionsButton = document.getElementById('closeInstructions');

  showInstructionsButton.addEventListener('click', () => {
      instructionsOverlay.style.display = 'block';
  });

  closeInstructionsButton.addEventListener('click', () => {
      instructionsOverlay.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
      if (event.target == instructionsOverlay) {
          instructionsOverlay.style.display = 'none';
      }
  });

  document.addEventListener('keydown', (event) => {
      const keyCode = event.key || event.which;
      if (keyCode === 'Escape' && instructionsOverlay.style.display === 'block') {
          instructionsOverlay.style.display = 'none';
      }
  });
});

window.onload = () => {
  const data = getDataFromLocalStorage();

  const positiveWeightElement = document.getElementById('positiveWeight');
  const positivePromptCountElement = document.getElementById('positivePromptCount');
  const negativePromptCountElement = document.getElementById('negativePromptCount');

  positiveWeightElement.value = data['positiveWeight'] || 60;
  positivePromptCountElement.value = data['positivePromptCount'] || 1;
  negativePromptCountElement.value = data['negativePromptCount'] || 1;

  attachPromptCountListener('positivePromptCount', 'positive-prompts-container', 'positivePrompt');
  attachPromptCountListener('negativePromptCount', 'negative-prompts-container', 'negativePrompt');

  addPrompts('positive-prompts-container', 'positivePromptCount', 'positivePrompt');
  addPrompts('negative-prompts-container', 'negativePromptCount', 'negativePrompt');
  
  document.getElementById('positiveWeight').addEventListener('input', calculateAndDisplay);
    
  const clearLocalStorageButton = document.getElementById('clearLocalStorage');
  clearLocalStorageButton.addEventListener('click', () => {
    localStorage.removeItem(localStorageKey);
    location.reload();
  });

  document.getElementById('copyToClipboard').addEventListener('click', function() {
    let finalPromptText = document.getElementById('result').value;

    if (navigator.clipboard) {
      // Use the Clipboard API if available
      navigator.clipboard.writeText(finalPromptText).then(function() {
        showToast("Copied to clipboard!");
      }, function(err) {
        showToast("Could not copy to clipboard!");
      });
    } else if (window.clipboardData) {
      // For Internet Explorer
      window.clipboardData.setData('Text', finalPromptText);
      showToast("Copied to clipboard!");
    } else {
      // Fallback for other browsers
      var textArea = document.createElement("textarea");
      textArea.value = finalPromptText;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        var successful = document.execCommand('copy');
        showToast(successful ? "Copied to clipboard!" : "Could not copy to clipboard!");
      } catch (err) {
        showToast("Could not copy to clipboard!");
      }

      document.body.removeChild(textArea);
    }
  });
  calculateAndDisplay();
}
