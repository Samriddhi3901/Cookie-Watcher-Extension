// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      // Load content based on tab
      if (tabName === 'cookies') {
        loadCookies();
      } else if (tabName === 'analytics') {
        loadAnalytics();
      }
    });
  });
  
  // Load cookies
  async function loadCookies(searchTerm = '') {
    const cookieList = document.getElementById('cookieList');
    cookieList.innerHTML = '<div class="loading">Loading cookies...</div>';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.cookies.getAll({ url: tab.url }, (cookies) => {
        if (cookies.length === 0) {
          cookieList.innerHTML = '<div class="loading">No cookies found for this site</div>';
          document.getElementById('cookieCount').textContent = '0 cookies';
          return;
        }
        
        // Filter cookies based on search
        const filteredCookies = searchTerm 
          ? cookies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
          : cookies;
        
        // Update count
        document.getElementById('cookieCount').textContent = `${cookies.length} cookie${cookies.length !== 1 ? 's' : ''}`;
        
        if (filteredCookies.length === 0) {
          cookieList.innerHTML = '<div class="loading">No cookies match your search</div>';
          return;
        }
        
        // Render cookies
        cookieList.innerHTML = filteredCookies.map(cookie => `
          <div class="cookie-item">
            <div class="cookie-header">
              <div class="cookie-name">${escapeHtml(cookie.name)}</div>
              <button class="cookie-delete" data-name="${escapeHtml(cookie.name)}" data-domain="${escapeHtml(cookie.domain)}">Delete</button>
            </div>
            <div class="cookie-details">
              <div><strong>Domain:</strong> ${escapeHtml(cookie.domain)}</div>
              <div><strong>Path:</strong> ${escapeHtml(cookie.path)}</div>
              <div><strong>Expires:</strong> ${cookie.session ? 'Session' : new Date(cookie.expirationDate * 1000).toLocaleString()}</div>
              <div><strong>Secure:</strong> ${cookie.secure ? 'Yes' : 'No'} | <strong>HttpOnly:</strong> ${cookie.httpOnly ? 'Yes' : 'No'}</div>
            </div>
            <div class="cookie-value">${escapeHtml(cookie.value.substring(0, 200))}${cookie.value.length > 200 ? '...' : ''}</div>
          </div>
        `).join('');
        
        // Add delete handlers
        document.querySelectorAll('.cookie-delete').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = btn.dataset.name;
            const domain = btn.dataset.domain;
            deleteCookie(name, domain, tab.url);
          });
        });
      });
    } catch (error) {
      cookieList.innerHTML = '<div class="loading">Error loading cookies</div>';
      console.error('Error:', error);
    }
  }
  
  // Delete single cookie
  function deleteCookie(name, domain, url) {
    chrome.cookies.remove({ url, name }, () => {
      loadCookies();
    });
  }
  
  // Clear all cookies
  document.getElementById('clearAll').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all cookies for this site?')) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.cookies.getAll({ url: tab.url }, (cookies) => {
          cookies.forEach(cookie => {
            chrome.cookies.remove({ url: tab.url, name: cookie.name });
          });
          setTimeout(() => loadCookies(), 500);
        });
      } catch (error) {
        console.error('Error clearing cookies:', error);
      }
    }
  });
  
  // Export cookies
  document.getElementById('exportCookies').addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.cookies.getAll({ url: tab.url }, (cookies) => {
        const data = JSON.stringify(cookies, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cookies_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error exporting cookies:', error);
    }
  });
  
  // Search functionality
  document.getElementById('searchInput').addEventListener('input', (e) => {
    loadCookies(e.target.value);
  });
  
  // Load analytics
  async function loadAnalytics() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.cookies.getAll({ url: tab.url }, (cookies) => {
        const totalCookies = cookies.length;
        const sessionCookies = cookies.filter(c => c.session).length;
        const persistentCookies = cookies.filter(c => !c.session).length;
        
        // Calculate third-party cookies
        const currentDomain = new URL(tab.url).hostname;
        const thirdPartyCookies = cookies.filter(c => {
          const cookieDomain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
          return !currentDomain.includes(cookieDomain) && !cookieDomain.includes(currentDomain);
        }).length;
        
        document.getElementById('totalCookies').textContent = totalCookies;
        document.getElementById('sessionCookies').textContent = sessionCookies;
        document.getElementById('persistentCookies').textContent = persistentCookies;
        document.getElementById('thirdPartyCookies').textContent = thirdPartyCookies;
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }
  
  // Settings
  document.getElementById('autoRefresh').addEventListener('change', (e) => {
    chrome.storage.sync.set({ autoRefresh: e.target.checked });
  });
  
  document.getElementById('notifyChanges').addEventListener('change', (e) => {
    chrome.storage.sync.set({ notifyChanges: e.target.checked });
  });
  
  document.getElementById('blockThirdParty').addEventListener('change', (e) => {
    chrome.storage.sync.set({ blockThirdParty: e.target.checked });
  });
  
  // Load settings
  chrome.storage.sync.get(['autoRefresh', 'notifyChanges', 'blockThirdParty'], (data) => {
    document.getElementById('autoRefresh').checked = data.autoRefresh || false;
    document.getElementById('notifyChanges').checked = data.notifyChanges || false;
    document.getElementById('blockThirdParty').checked = data.blockThirdParty || false;
  });
  
  // Utility function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Initialize - load cookies when popup opens
  loadCookies();