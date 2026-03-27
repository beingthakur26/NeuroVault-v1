// Content script for extracting specific elements or injected UI highlight tools.
console.log("NeuroVault Content Script loaded.")

// Highlight listener for capturing partial text could be added here
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString()
  if (selectedText.length > 0) {
    // Optionally render a "Save Highlight" floating button
  }
})
