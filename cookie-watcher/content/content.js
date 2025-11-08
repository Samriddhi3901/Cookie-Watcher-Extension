// Content script for monitoring cookies on the page
(function() {
    'use strict';
    
    // Monitor document.cookie access
    const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    
    Object.defineProperty(document, 'cookie', {
      get() {
        return originalCookie.get.call(document);
      },
      set(value) {
        // Log cookie setting
        console.log('🍪 Cookie set:', value);
        
        // Send to background script
        chrome.runtime.sendMessage({
          type: 'COOKIE_SET',
          value: value,
          url: window.location.href
        }).catch(() => {
          // Ignore if background script isn't ready
        });
        
        return originalCookie.set.call(document, value);
      }
    });
    
    console.log('🍪 Cookie Watcher content script loaded on', window.location.hostname);
  })();