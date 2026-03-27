let floatBtn = null;

document.addEventListener('mouseup', (e) => {
  // Use a slight timeout to let the selection register properly in the browser
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText.length > 5) {
      if (!floatBtn) {
        floatBtn = document.createElement('button');
        floatBtn.innerText = '🧠 Save to NeuroVault';
        floatBtn.style.position = 'absolute';
        floatBtn.style.zIndex = '99999999';
        floatBtn.style.padding = '8px 12px';
        floatBtn.style.background = '#6366f1';
        floatBtn.style.color = '#fff';
        floatBtn.style.border = '1px solid rgba(255,255,255,0.2)';
        floatBtn.style.borderRadius = '8px';
        floatBtn.style.cursor = 'pointer';
        floatBtn.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
        floatBtn.style.fontFamily = 'Inter, sans-serif';
        floatBtn.style.fontSize = '12px';
        floatBtn.style.fontWeight = '600';
        floatBtn.style.transition = 'transform 0.1s ease';
        
        floatBtn.onmouseover = () => floatBtn.style.transform = 'scale(1.05)';
        floatBtn.onmouseout = () => floatBtn.style.transform = 'scale(1)';
        
        document.body.appendChild(floatBtn);
        
        floatBtn.addEventListener('mousedown', (ev) => {
          ev.preventDefault(); // prevent selection from clearing immediately
          ev.stopPropagation();
          const currentSelection = window.getSelection().toString().trim();
          if (currentSelection) {
             const dashboardUrl = `http://localhost:5173/dashboard?saveUrl=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(document.title)}&snippet=${encodeURIComponent(currentSelection)}`;
             window.open(dashboardUrl, '_blank');
          }
          removeBtn();
        });
      }
      
      // Position it slightly below the cursor
      floatBtn.style.top = `${e.pageY + 15}px`;
      floatBtn.style.left = `${e.pageX + 10}px`;
    } else {
      removeBtn();
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  // If clicking anywhere outside the button, remove it
  if (floatBtn && e.target !== floatBtn) {
    removeBtn();
  }
});

function removeBtn() {
  if (floatBtn) {
    floatBtn.remove();
    floatBtn = null;
  }
}
