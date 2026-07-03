/**
 * 📊 StockFlow Google Apps Script (Code.gs)
 * Serves StockFlow as a standalone Google Apps Script Web App.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('StockFlow - ITI Material Allotment & Tracking System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Optional Sheet-based API helper
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
