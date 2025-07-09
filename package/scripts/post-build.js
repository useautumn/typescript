const fs = require('fs');
const path = require('path');

// Post-build processing: replace CSS selectors with .au-root prefix
function processCssFiles() {
  const cssFiles = [
    path.join(__dirname, '../dist/styles/global.css'),
    path.join(__dirname, '../dist/libraries/react/index.css')
  ];
  
  cssFiles.forEach(cssFilePath => {
    if (fs.existsSync(cssFilePath)) {
      console.log('📄 Processing CSS file:', cssFilePath);
      
      const builtCss = fs.readFileSync(cssFilePath, 'utf8');
      let updatedCss = builtCss.replace(
        /(\*,\n::before,\n::after)/g,
        '.au-root *,\n.au-root ::before,\n.au-root ::after'
      );
      
      // Also handle standalone * selectors (for custom base styles)
      updatedCss = updatedCss.replace(
        /^(\* \{[^}]*\})$/gm,
        (match) => match.replace('* {', '.au-root * {')
      );
      
      fs.writeFileSync(cssFilePath, updatedCss);
      console.log('✅ CSS selectors updated with .au-root prefix');
    } else {
      console.log('⚠️ CSS file not found:', cssFilePath);
    }
  });
}

// Process injected CSS in JS files
function processInjectedCss() {
  const reactDir = path.join(__dirname, '../dist/libraries/react');
  const files = fs.readdirSync(reactDir).filter(file => 
    file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')
  );
  
  files.forEach(file => {
    const filePath = path.join(reactDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if this file has styleInject and CSS content
    if (content.includes('styleInject')) {
      let updated = false;
      let updatedContent = content;
      
      // Pattern 1: *,\n::before,\n::after (with newlines)
      if (updatedContent.includes('*,\\n::before,\\n::after')) {
        console.log('📄 Processing injected CSS pattern 1 in:', file);
        updatedContent = updatedContent.replace(
          /(\*,\\n::before,\\n::after)/g,
          '.au-root *,\\n.au-root ::before,\\n.au-root ::after'
        );
        updated = true;
      }
      
      // Pattern 2: *,::before,::after (without newlines)
      if (updatedContent.includes('*,::before,::after')) {
        console.log('📄 Processing injected CSS pattern 2 in:', file);
        updatedContent = updatedContent.replace(
          /(\*,::before,::after)/g,
          '.au-root *,.au-root ::before,.au-root ::after'
        );
        updated = true;
      }
      
      // Pattern 3: standalone * selector (for custom base styles)
      if (updatedContent.includes('\\* {')) {
        console.log('📄 Processing standalone * selector in:', file);
        updatedContent = updatedContent.replace(
          /(\\\* \{[^}]*\})/g,
          (match) => match.replace('\\* {', '.au-root * {')
        );
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(filePath, updatedContent);
        console.log('✅ Injected CSS selectors updated with .au-root prefix');
      }
    }
  });
}

// Run the processing
processCssFiles();
processInjectedCss(); 