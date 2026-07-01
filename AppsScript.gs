function doGet() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const users = ss.getSheetByName("Users").getDataRange().getValues();
  const updates = ss.getSheetByName("Updates").getDataRange().getValues();
  const reads = ss.getSheetByName("Reads").getDataRange().getValues();

  return ContentService.createTextOutput(JSON.stringify({
    users,
    updates,
    reads
  })).setMimeType(ContentService.MimeType.JSON);

}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'markRead') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const readsSheet = ss.getSheetByName("Reads");
      
      // Append new read record
      readsSheet.appendRow([
        data.updateTitle,
        data.user,
        data.readTime
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Read status updated'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
