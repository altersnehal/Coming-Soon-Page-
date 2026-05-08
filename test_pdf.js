const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Go to the local dev server
  await page.goto('http://localhost:5173/resume.html', { waitUntil: 'networkidle0' });
  
  // Wait for html2pdf to be loaded
  await page.waitForFunction('typeof html2pdf !== "undefined"');
  
  // Override the save function to get the base64 instead of downloading it in browser
  const pdfBase64 = await page.evaluate(async () => {
    const element = document.querySelector('.cv');
    const opt = { 
      margin: 0, 
      filename: 'Snehal_Solanki_Resume.pdf',
      image: { type: 'jpeg', quality: 1.0 }, 
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } 
    };
    
    // Instead of .save(), we use .output('datauristring')
    const pdfString = await html2pdf().set(opt).from(element).outputPdf('datauristring');
    return pdfString;
  });
  
  const fs = require('fs');
  // Strip the prefix
  const base64Data = pdfBase64.replace(/^data:application\/pdf;filename=generated.pdf;base64,/, "");
  fs.writeFileSync('test_output.pdf', base64Data, 'base64');
  
  console.log('PDF saved to test_output.pdf');
  await browser.close();
})();
