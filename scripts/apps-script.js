/**
 * HƯỚNG DẪN CÀI ĐẶT
 * ─────────────────────────────────────────────────────
 * 1. Tạo Google Sheet mới tại https://sheets.google.com
 * 2. Vào menu Extensions → Apps Script
 * 3. Xóa code mặc định, paste toàn bộ file này vào
 * 4. Nhấn Save (Ctrl+S)
 * 5. Nhấn Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Nhấn Deploy → Copy URL vừa tạo
 * 7. Dán URL vào file .env.local của dự án:
 *    VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec
 * ─────────────────────────────────────────────────────
 * CẤU TRÚC GOOGLE SHEET (tự động tạo khi chạy lần đầu)
 *   Sheet "Wedding": 2 cột (key | value)
 *   Sheet "Guests":  4 cột (slug | name | side | inviteTime)
 */

const WEDDING_SHEET = 'Wedding'
const GUESTS_SHEET = 'Guests'

// ─── Xử lý GET ───────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    const action = e.parameter.action
    let result

    if (action === 'wedding') {
      result = getWedding()
    } else if (action === 'guests') {
      result = getGuests()
    } else {
      result = { error: 'Unknown action: ' + action }
    }

    return jsonResponse(result)
  } catch (err) {
    return jsonResponse({ error: String(err) })
  }
}

// ─── Xử lý POST ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const params = e.parameter
    const action = params.action
    let result

    if (action === 'updateWedding') {
      result = updateWedding(params)
    } else if (action === 'upsertGuest') {
      result = upsertGuest(params)
    } else if (action === 'removeGuest') {
      result = removeGuest(params.slug)
    } else {
      result = { error: 'Unknown action: ' + action }
    }

    return jsonResponse(result)
  } catch (err) {
    return jsonResponse({ error: String(err) })
  }
}

// ─── Wedding ──────────────────────────────────────────────────────────────────

function getWedding() {
  const sheet = getOrCreateSheet(WEDDING_SHEET)
  const data = sheet.getDataRange().getValues()
  const map = {}

  for (const [key, value] of data) {
    if (key) map[key] = value
  }

  return {
    groomName: map['groomName'] || '',
    brideName: map['brideName'] || '',
    weddingDate: map['weddingDate'] || '',
    venue: {
      name: map['venueName'] || '',
      note: map['venueNote'] || '',
    },
    families: {
      groom: {
        label: map['groomLabel'] || '',
        dad: map['groomDad'] || '',
        mom: map['groomMom'] || '',
        address: map['groomAddress'] || '',
        phone: map['groomPhone'] || '',
        googleMapUrl: map['groomMapUrl'] || '',
      },
      bride: {
        label: map['brideLabel'] || '',
        dad: map['brideDad'] || '',
        mom: map['brideMom'] || '',
        address: map['brideAddress'] || '',
        phone: map['bridePhone'] || '',
        googleMapUrl: map['brideMapUrl'] || '',
        timelines: {
          groom: map['groomTimeline'] ? JSON.parse(map['groomTimeline']) : [],
          bride: map['brideTimeline'] ? JSON.parse(map['brideTimeline']) : [],
        },
      },
    },
  }
}

function updateWedding(params) {
  const sheet = getOrCreateSheet(WEDDING_SHEET)
  sheet.clearContents()
  sheet.getRange(1, 1, 19, 2).setValues([
    ['groomName', params.groomName || ''],
    ['brideName', params.brideName || ''],
    ['weddingDate', params.weddingDate || ''],
    ['venueName', params.venueName || ''],
    ['venueNote', params.venueNote || ''],
    ['groomLabel', params.groomLabel || ''],
    ['groomDad', params.groomDad || ''],
    ['groomMom', params.groomMom || ''],
    ['groomAddress', params.groomAddress || ''],
    ['groomPhone', params.groomPhone || ''],
    ['groomMapUrl', params.groomMapUrl || ''],
    ['brideLabel', params.brideLabel || ''],
    ['brideDad', params.brideDad || ''],
    ['brideMom', params.brideMom || ''],
    ['brideAddress', params.brideAddress || ''],
    ['groomTimeline', params.groomTimeline || '[]'],
    ['brideTimeline', params.brideTimeline || '[]'],
    ['bridePhone', params.bridePhone || ''],
    ['brideMapUrl', params.brideMapUrl || ''],
  ])
  return { success: true }
}

// ─── Guests ───────────────────────────────────────────────────────────────────

function getGuests() {
  const sheet = getOrCreateSheet(GUESTS_SHEET)
  ensureGuestHeaders(sheet)

  const data = sheet.getDataRange().getValues()
  if (data.length <= 1) return []

  const [headers, ...rows] = data
  return rows.map((row) => {
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = row[i]
    })
    return obj
  })
}

function upsertGuest(params) {
  const sheet = getOrCreateSheet(GUESTS_SHEET)
  ensureGuestHeaders(sheet)

  const allData = sheet.getDataRange().getValues()

  // Tìm row có slug khớp để cập nhật
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === params.slug) {
      sheet
        .getRange(i + 1, 1, 1, 4)
        .setValues([[params.slug, params.name, params.side, params.inviteTime]])
      return { success: true, action: 'updated' }
    }
  }

  // Không tìm thấy → thêm mới
  sheet.appendRow([params.slug, params.name, params.side, params.inviteTime])
  return { success: true, action: 'added' }
}

function removeGuest(slug) {
  if (!slug) return { success: false, error: 'slug is required' }

  const sheet = getOrCreateSheet(GUESTS_SHEET)
  const data = sheet.getDataRange().getValues()

  // Duyệt từ cuối lên để xóa đúng row
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === slug) {
      sheet.deleteRow(i + 1)
      return { success: true }
    }
  }

  return { success: false, error: 'Guest not found' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  return ss.getSheetByName(name) || ss.insertSheet(name)
}

function ensureGuestHeaders(sheet) {
  const firstCell = sheet.getRange(1, 1).getValue()
  if (firstCell !== 'slug') {
    sheet.clearContents()
    sheet.getRange(1, 1, 1, 4).setValues([['slug', 'name', 'side', 'inviteTime']])
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
