document.addEventListener('DOMContentLoaded', () => {
  // Carregar e exibir configurações salvas
  chrome.storage.local.get(['clickLimit', 'timeLimit', 'blockTimestamps', 'blockedDomains', 'whitelist'], (data) => {
    document.getElementById('clickLimit').value = data.clickLimit || 3;
    document.getElementById('timeLimit').value = (data.timeLimit / 60 / 1000) || 5;

    const blockTimestamps = data.blockTimestamps || {};
    const blockedDomains = data.blockedDomains || [];
    const timeLimit = data.timeLimit || 5 * 60 * 1000; // Tempo padrão de 5 minutos
    const whitelist = data.whitelist || [];

    const blockedSitesContainer = document.getElementById('blockedSites');
    const whitelistInput = document.getElementById('whitelist');

    // Mostrar os sites bloqueados
    blockedDomains.forEach(domain => {
      const remainingTime = blockTimestamps[domain] + timeLimit - Date.now();
      const minutes = Math.floor(remainingTime / 1000 / 60);
      const seconds = Math.floor((remainingTime / 1000) % 60);

      const siteBlock = document.createElement('div');
      siteBlock.className = 'site-block';
      siteBlock.innerText = `${domain}: ${minutes}m ${seconds}s restantes`;

      blockedSitesContainer.appendChild(siteBlock);
    });

    // Atualizar o contador a cada segundo
    setInterval(() => {
      blockedSitesContainer.innerHTML = '';
      blockedDomains.forEach(domain => {
        const remainingTime = blockTimestamps[domain] + timeLimit - Date.now();
        const minutes = Math.floor(remainingTime / 1000 / 60);
        const seconds = Math.floor((remainingTime / 1000) % 60);

        const siteBlock = document.createElement('div');
        siteBlock.className = 'site-block';
        siteBlock.innerText = `${domain}: ${minutes}m ${seconds}s restantes`;

        blockedSitesContainer.appendChild(siteBlock);
      });
    }, 1000);

    // Mostrar a whitelist
    whitelistInput.value = whitelist.join('\n');
  });

  // Salvar novas configurações
  document.getElementById('saveButton').addEventListener('click', () => {
    const clickLimit = parseInt(document.getElementById('clickLimit').value, 10);
    const timeLimit = parseInt(document.getElementById('timeLimit').value, 10) * 60 * 1000;
    const whitelistInput = document.getElementById('whitelist').value.split('\n').map(url => url.trim()).filter(url => url);

    chrome.storage.local.set({ clickLimit, timeLimit, whitelist: whitelistInput }, () => {
      const message = document.getElementById('saveMessage');
      message.textContent = 'Configurations saved successfully!';
      message.style.display = 'block';
      setTimeout(() => {
        message.style.display = 'none';
      }, 3000); // Esconde a mensagem após 3 segundos
    });
  });
});
