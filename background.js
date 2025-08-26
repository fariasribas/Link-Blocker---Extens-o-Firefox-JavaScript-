const DEFAULT_MAX_LINKS = 3; // Valor padrão
const DEFAULT_BLOCK_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

chrome.storage.local.set({ clickCount: {}, blockedDomains: [], blockTimestamps: {}, whitelist: [] });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'linkClicked') {
    const url = new URL(sender.tab.url).hostname;

    chrome.storage.local.get(['clickCount', 'blockedDomains', 'blockTimestamps', 'clickLimit', 'timeLimit', 'whitelist'], (data) => {
      let clickCount = data.clickCount || {};
      let blockedDomains = data.blockedDomains || [];
      let blockTimestamps = data.blockTimestamps || {};
      const MAX_LINKS = data.clickLimit || DEFAULT_MAX_LINKS;
      const BLOCK_DURATION = data.timeLimit || DEFAULT_BLOCK_DURATION;
      const whitelist = data.whitelist || [];

      // Verifica se a URL está na whitelist
      const isWhitelisted = whitelist.some(whitelistUrl => {
        try {
          const whitelistHostname = new URL(whitelistUrl).hostname;
          return url === whitelistHostname;
        } catch (e) {
          console.error(`URL inválida na whitelist: ${whitelistUrl}`);
          return false;
        }
      });

      if (isWhitelisted) {
        // Se a URL está na whitelist, não faça nada
        return;
      }

      if (!clickCount[url]) {
        clickCount[url] = 0;
      }

      clickCount[url] += 1;

      if (clickCount[url] >= MAX_LINKS && !blockedDomains.includes(url)) {
        blockedDomains.push(url);
        blockTimestamps[url] = Date.now();

        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (new URL(tab.url).hostname === url) {
              chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`blockpage.html?url=${encodeURIComponent(url)}`) });
            }
          });
        });

        chrome.storage.local.set({ clickCount, blockedDomains, blockTimestamps });
      } else {
        chrome.storage.local.set({ clickCount });
      }
    });
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  const url = new URL(tab.url).hostname;

  chrome.storage.local.get(['blockedDomains', 'blockTimestamps', 'timeLimit'], (data) => {
    const blockedDomains = data.blockedDomains || [];
    const blockTimestamps = data.blockTimestamps || {};
    const BLOCK_DURATION = data.timeLimit || DEFAULT_BLOCK_DURATION;

    if (blockedDomains.includes(url)) {
      const remainingTime = blockTimestamps[url] + BLOCK_DURATION - Date.now();

      if (remainingTime > 0) {
        chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(`blockpage.html?url=${encodeURIComponent(url)}`) });
      } else {
        // Remove o domínio da lista de bloqueio se o tempo expirou
        const index = blockedDomains.indexOf(url);
        if (index > -1) {
          blockedDomains.splice(index, 1);
          delete blockTimestamps[url];
        }

        chrome.storage.local.set({ blockedDomains, blockTimestamps });
      }
    }
  });
});

chrome.webNavigation.onCompleted.addListener((details) => {
  const url = new URL(details.url).hostname;

  chrome.storage.local.get(['blockedDomains', 'blockTimestamps', 'timeLimit'], (data) => {
    const blockedDomains = data.blockedDomains || [];
    const blockTimestamps = data.blockTimestamps || {};
    const BLOCK_DURATION = data.timeLimit || DEFAULT_BLOCK_DURATION;

    if (blockedDomains.includes(url)) {
      const remainingTime = blockTimestamps[url] + BLOCK_DURATION - Date.now();

      if (remainingTime > 0) {
        chrome.tabs.update(details.tabId, { url: chrome.runtime.getURL(`blockpage.html?url=${encodeURIComponent(url)}`) });
      } else {
        // Remove o domínio da lista de bloqueio se o tempo expirou
        const index = blockedDomains.indexOf(url);
        if (index > -1) {
          blockedDomains.splice(index, 1);
          delete blockTimestamps[url];
        }

        chrome.storage.local.set({ blockedDomains, blockTimestamps });
      }
    }
  });
}, { url: [{ urlMatches: '.*' }] });

setInterval(() => {
  chrome.storage.local.get(['blockedDomains', 'blockTimestamps', 'timeLimit'], (data) => {
    let blockedDomains = data.blockedDomains || [];
    let blockTimestamps = data.blockTimestamps || {};
    const BLOCK_DURATION = data.timeLimit || DEFAULT_BLOCK_DURATION;
    let currentTime = Date.now();

    blockedDomains = blockedDomains.filter((domain) => {
      if (currentTime - blockTimestamps[domain] > BLOCK_DURATION) {
        delete blockTimestamps[domain];
        return false;
      }
      return true;
    });

    chrome.storage.local.set({ blockedDomains, blockTimestamps });
  });
}, 60 * 1000); // Verifica a cada minuto
