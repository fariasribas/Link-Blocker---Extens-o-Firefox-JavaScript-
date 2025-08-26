const urlParams = new URLSearchParams(window.location.search);
const blockedUrl = decodeURIComponent(urlParams.get('url'));
const countdownElement = document.getElementById('countdown');

function updateCountdown() {
  chrome.storage.local.get(['blockTimestamps', 'timeLimit'], (data) => {
    const blockTimestamps = data.blockTimestamps || {};
    const BLOCK_DURATION = data.timeLimit || (5 * 60 * 1000); // Default to 5 minutes
    const endTime = blockTimestamps[blockedUrl] + BLOCK_DURATION;
    const currentTime = Date.now();
    const remainingTime = endTime - currentTime;

    if (remainingTime <= 0) {
      // Remover o domínio da lista de bloqueio e voltar à página anterior
      chrome.storage.local.get(['blockedDomains'], (data) => {
        const blockedDomains = data.blockedDomains || [];
        const index = blockedDomains.indexOf(blockedUrl);
        if (index > -1) {
          blockedDomains.splice(index, 1);
          chrome.storage.local.set({ blockedDomains });
        }
      });

      // Voltar para a página anterior
      window.history.back();
      return;
    }

    const minutes = Math.floor(remainingTime / (60 * 1000));
    const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
    countdownElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    setTimeout(updateCountdown, 1000);
  });
}

updateCountdown();
