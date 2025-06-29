const fs = require('fs');
const path = require('path');

// Post-build processing: replace CSS selectors with .au-root prefix
function processCssFiles() {
  const cssFilePath = path.join(__dirname, '../dist/styles/global.css');
  
  if (fs.existsSync(cssFilePath)) {
    console.log('📄 Processing CSS file:', cssFilePath);
    
    const builtCss = fs.readFileSync(cssFilePath, 'utf8');
    const updatedCss = builtCss.replace(
      /(\*,\n::before,\n::after)/g,
      '.au-root *,\n.au-root ::before,\n.au-root ::after'
    );
    
    fs.writeFileSync(cssFilePath, updatedCss);
    console.log('✅ CSS selectors updated with .au-root prefix');
  } else {
    console.log('⚠️ CSS file not found:', cssFilePath);
  }
}

// Run the processing
processCssFiles(); 