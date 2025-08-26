document.addEventListener('click', (event) => {
  let element = event.target;

  while (element && element.tagName !== 'A') {
    element = element.parentElement;
  }

  if (element && element.tagName === 'A') {
    chrome.runtime.sendMessage({ type: 'linkClicked' });
  }
});

document.addEventListener('auxclick', (event) => {
  if (event.button === 1) {  // botão do meio
    let element = event.target;

    while (element && element.tagName !== 'A') {
      element = element.parentElement;
    }

    if (element && element.tagName === 'A') {
      chrome.runtime.sendMessage({ type: 'linkClicked' });
    }
  }
});
