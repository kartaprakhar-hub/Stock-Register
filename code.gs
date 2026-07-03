/**
 * 📊 StockFlow Google Apps Script (Code.gs)
 * This script allows you to host StockFlow as a standalone Google Apps Script Web App
 * and optionally use a Google Sheet as a persistent database!
 */

// 1. WEB APP SERVICE HANDLER
function doGet(e) {
  // Serves the index.html file with evaluation capabilities
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('StockFlow - ITI Material Allotment & Tracking System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Helper to include other HTML/JS/CSS files in Google Apps Script templates
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 2. GOOGLE SHEETS DATABASE API FOR STOCKFLOW
// If you want to connect your application to Google Sheets for real-time persistence,
// initialize your Google Sheet and call these functions from your React app using google.script.run

/**
 * Retrieves the spreadsheet database or creates one if it doesn't exist
 */
function getOrCreateDatabase() {
  var dbs = DriveApp.getFilesByName("StockFlow_Database");
  if (dbs.hasNext()) {
    return SpreadsheetApp.open(dbs.next());
  } else {
    var ss = SpreadsheetApp.create("StockFlow_Database");
    
    // Create initial sheets
    var inventorySheet = ss.insertSheet("Inventory");
    inventorySheet.appendRow(["ID", "Name", "Category", "Subcategory", "SKU", "Quantity", "Unit", "LowStockThreshold", "AvgUnitPrice", "ShelfLocation", "Brand", "GeMCategory", "PurchaseDate", "ExpiryDate", "CreatedDate"]);
    
    var allotmentsSheet = ss.insertSheet("Allotments");
    allotmentsSheet.appendRow(["ID", "Requester", "ItemsJSON", "Purpose", "Status", "Level1Status", "Level2Status", "Level3Status", "CreatedDate"]);
    
    var logsSheet = ss.insertSheet("Logs");
    logsSheet.appendRow(["Timestamp", "Activity", "Details", "Type"]);
    
    // Delete default "Sheet1"
    var defaultSheet = ss.getSheetByName("Sheet1");
    if (defaultSheet) ss.deleteSheet(defaultSheet);
    
    return ss;
  }
}

/**
 * API: Read entire inventory stock register
 */
function getInventory() {
  try {
    var ss = getOrCreateDatabase();
    var sheet = ss.getSheetByName("Inventory");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j].charAt(0).toLowerCase() + headers[j].slice(1);
        obj[key] = row[j];
      }
      results.push(obj);
    }
    return JSON.stringify(results);
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * API: Write or replenish items in inventory stock register
 */
function updateInventoryItem(itemJson) {
  try {
    var item = JSON.parse(itemJson);
    var ss = getOrCreateDatabase();
    var sheet = ss.getSheetByName("Inventory");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    
    var foundIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === item.id) {
        foundIndex = i + 1; // 1-indexed row number
        break;
      }
    }
    
    var values = [
      item.id,
      item.name || "",
      item.category || "",
      item.subcategory || "",
      item.sku || "",
      Number(item.quantity) || 0,
      item.unit || "pcs",
      Number(item.lowStockThreshold) || 3,
      Number(item.avgUnitPrice) || 0,
      item.shelfLocation || "",
      item.brand || "",
      item.gemCategory || "",
      item.purchaseDate || "",
      item.expiryDate || "",
      item.createdDate || ""
    ];
    
    if (foundIndex > -1) {
      sheet.getRange(foundIndex, 1, 1, values.length).setValues([values]);
    } else {
      sheet.appendRow(values);
    }
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * API: Read Allotment Requests
 */
function getAllotments() {
  try {
    var ss = getOrCreateDatabase();
    var sheet = ss.getSheetByName("Allotments");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {
        id: row[0],
        requesterName: row[1],
        items: JSON.parse(row[2]),
        purpose: row[3],
        status: row[4],
        level1Status: row[5],
        level2Status: row[6],
        level3Status: row[7],
        createdDate: row[8]
      };
      results.push(obj);
    }
    return JSON.stringify(results);
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * API: Write/Update Allotment Request status
 */
function saveAllotmentRequest(reqJson) {
  try {
    var req = JSON.parse(reqJson);
    var ss = getOrCreateDatabase();
    var sheet = ss.getSheetByName("Allotments");
    var data = sheet.getDataRange().getValues();
    
    var foundIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === req.id) {
        foundIndex = i + 1;
        break;
      }
    }
    
    var values = [
      req.id,
      req.requesterName || "",
      JSON.stringify(req.items || []),
      req.purpose || "",
      req.status || "Pending Store Keeper",
      req.level1Status || "PENDING",
      req.level2Status || "PENDING",
      req.level3Status || "PENDING",
      req.createdDate || ""
    ];
    
    if (foundIndex > -1) {
      sheet.getRange(foundIndex, 1, 1, values.length).setValues([values]);
    } else {
      sheet.appendRow(values);
    }
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}
