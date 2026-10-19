// =============================================================================
// CẤU HÌNH HỆ THỐNG
// =============================================================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2sb1FR-CbL2LvofQVCHn7K3pTsNumuzgvxRR01vE0iWPXiqbAEIH4COIltEUVILnE/exec";

const BANK_CONFIG = {
  BANK_ID: "MB",               // Mã NH
  ACCOUNT_NO: "0934761258",    // Số tài khoản ngân hàng
  ACCOUNT_NAME: "DINH NGOC BAO" // Tên chủ tài khoản
};

let selectedCart = {};
let checkPaymentInterval = null; // Bộ đếm thời gian kiểm tra SePay

// =============================================================================
// DANH SÁCH MENU
// =============================================================================
const menuData = [
  { name: "Gà nướng đồng bào", price: 280000 },
  { name: "Cơm lam", price: 35000 },
  { name: "Lẩu gà lá é", price: 235000 },
  { name: "Lẫu gà lá giang", price: 235000 },
  { name: "Combo mẹt gà 3 món", price: 350000 },
  { name: "Lẫu cá lăng", price: 240000 },
  { name: "Cá lăng um dưa", price: 240000 },
  { name: "Cá lăng nướng riềng", price: 240000 },
  { name: "Lẫu cá tầm măng chua", price: 250000 },
  { name: "Dúi rừng ( đặt trước ) (theo kg)", price: 850000 },
  { name: "Bê nướng cục", price: 180000 },
  { name: "Bò nướng lá lốt ", price: 150000 },
  { name: "Heo nướng mọi", price: 80000 },
  { name: "Heo giả cầy ", price: 145000 },
  { name: "Cơm chiên dương châu", price: 80000 },
  { name: "Cơm chiên trứng", price: 50000 },
  { name: "Mì xào bò ", price: 65000 },
  { name: "Ngũ quả chấm trứng", price: 60000 },
  { name: "tai mui trộn", price: 70000 },
  { name: "Tóp mỡ chiên mắm", price: 60000 },
  { name: "Ếch xào sả ớt", price: 105000 },
  { name: "Ếch núp lùm", price: 100000 },
  { name: "BIA Heineken cao (Lon)", price: 24000 },
  { name: "BIA Heineken lùn (Lon)", price: 20000 },
  { name: "BIA Tiger bạc cao (Lon)", price: 21000 },
  { name: "BIA Tiger bạc lùn (Lon)", price: 18000 },
  { name: "Bia Tiger (Lon)", price: 22000 },
  { name: "BIA saigon xanh (Lon)", price: 15000 },
  { name: "Nước suối", price: 10000 },
  { name: "Nước ngọt", price: 12000 }
];

document.addEventListener('DOMContentLoaded', () => {
  renderThamKhaoMenu();
  renderSelectMenu();
});

function openPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  if (pageId === 'booking-page') {
    checkLockedTables();
  }
}

function navigateTo(pageId) {
  openPage(pageId);
}

function renderThamKhaoMenu() {
  const container = document.getElementById('menu-container');
  if (!container) return;
  container.innerHTML = '';
  menuData.forEach((item, i) => {
    container.innerHTML += `
      <div class="menu-item">
        <span class="menu-item-name">${i + 1}. ${item.name}</span>
        <span class="menu-item-price">${item.price.toLocaleString('vi-VN')}đ</span>
      </div>`;
  });
}

function renderSelectMenu() {
  const container = document.getElementById('modal-menu-select');
  if (!container) return;
  container.innerHTML = '';

  menuData.forEach((item, i) => {
    const currentQty = selectedCart[item.name] ? selectedCart[item.name].qty : 0;
    container.innerHTML += `
      <div class="item-select-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee;">
        <div class="item-info-text">
          <strong style="display: block;">${item.name}</strong>
          <span style="color: #e74c3c;">${item.price.toLocaleString('vi-VN')}đ</span>
        </div>
        <div class="qty-controls" style="display: flex; align-items: center; gap: 8px;">
          <button type="button" class="qty-btn" onclick="changeQty(${i}, -1)" style="width: 28px; height: 28px;">-</button>
          <span id="qty-${i}" style="min-width: 20px; text-align: center; font-weight: bold;">${currentQty}</span>
          <button type="button" class="qty-btn" onclick="changeQty(${i}, 1)" style="width: 28px; height: 28px;">+</button>
        </div>
      </div>`;
  });
}

function changeQty(index, delta) {
  const item = menuData[index];
  if (!selectedCart[item.name]) {
    selectedCart[item.name] = { price: item.price, qty: 0 };
  }

  selectedCart[item.name].qty += delta;

  if (selectedCart[item.name].qty <= 0) {
    delete selectedCart[item.name];
    document.getElementById(`qty-${index}`).innerText = "0";
  } else {
    document.getElementById(`qty-${index}`).innerText = selectedCart[item.name].qty;
  }

  calculateTotal();
}

// HÀM TÍNH TỔNG TIỀN & XUẤT CHUỖI MÓN ĂN CHUẨN
function calculateTotal() {
  let total = 0;
  let foodSummary = [];

  for (let name in selectedCart) {
    let item = selectedCart[name];
    if (item.qty > 0) {
      total += item.price * item.qty;
      foodSummary.push(`${name} (x${item.qty})`);
    }
  }

  const foodString = foodSummary.length > 0 ? foodSummary.join(', ') : 'Không chọn món';

  const displayEl = document.getElementById('total-price-display');
  if (displayEl) displayEl.innerText = total.toLocaleString('vi-VN') + "đ";

  const foodListInput = document.getElementById('form-food-list');
  if (foodListInput) foodListInput.value = foodString;

  const totalAmountInput = document.getElementById('form-total-amount');
  if (totalAmountInput) totalAmountInput.value = total;

  return { total, foodString };
}

function openBookingModal(tableName) {
  const tableTitle = document.getElementById('selected-table-name');
  if (tableTitle) tableTitle.innerText = tableName;

  const tableInput = document.getElementById('form-table');
  if (tableInput) tableInput.value = tableName;

  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('active');
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.remove('active');

  selectedCart = {};
  menuData.forEach((_, i) => {
    const qtyEl = document.getElementById(`qty-${i}`);
    if (qtyEl) qtyEl.innerText = "0";
  });
  calculateTotal();
}

// =============================================================================
// XỬ LÝ VIETQR & TỰ ĐỘNG KIỂM TRA THANH TOÁN
// =============================================================================
function generateQRCode() {
  const name = document.getElementById('form-name')?.value.trim();
  const phone = document.getElementById('form-phone')?.value.trim();
  const date = document.getElementById('form-date')?.value;
  const time = document.getElementById('form-time')?.value;
  const table = document.getElementById('form-table')?.value;

  if (!name || !phone || !date || !time || !table) {
    alert("Vui lòng chọn Bàn và điền đầy đủ thông tin!");
    return;
  }

  const { total, foodString } = calculateTotal();
  const finalTotal = total || 1000;
  const cleanTableName = table.replace(/\s+/g, '').toUpperCase();
  const memo = encodeURIComponent(`DATBAN ${cleanTableName} ${phone}`);

  // 1. GỬI LƯU MÓN ĂN & HỌ TÊN SANG GOOGLE SHEET (Trạng thái: Chờ thanh toán)
  sendPendingOrderToSheet({
    table: table,
    name: name,
    phone: phone,
    date: date,
    time: time,
    foodList: foodString,
    totalAmount: finalTotal
  });

  // 2. HIỂN THỊ VIETQR
  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.BANK_ID}-${BANK_CONFIG.ACCOUNT_NO}-compact2.png?amount=${finalTotal}&addInfo=${memo}&accountName=${encodeURIComponent(BANK_CONFIG.ACCOUNT_NAME)}`;
  const qrImg = document.getElementById('qr-code-img');
  if (qrImg) qrImg.src = qrUrl;

  const confirmBtn = document.querySelector('.btn-confirm-manual');
  if (confirmBtn) confirmBtn.style.display = 'none';

  const qrModal = document.getElementById('qr-modal');
  if (qrModal) qrModal.classList.add('active');

  // 3. BẬT BỘ ĐẾM 3s HỎI NGÂN HÀNG 1 LẦN
  if (checkPaymentInterval) clearInterval(checkPaymentInterval);
  checkPaymentInterval = setInterval(() => {
    autoCheckPaymentStatus(table);
  }, 3000);
}

function sendPendingOrderToSheet(order) {
  if (!GOOGLE_SCRIPT_URL) return;

  const payload = new URLSearchParams();
  payload.append('Bàn', order.table);
  payload.append('Món đã chọn', order.foodList);
  payload.append('Tổng tiền', order.totalAmount);
  payload.append('Họ tên', order.name);
  payload.append('Số điện thoại', order.phone);
  payload.append('Ngày đặt', order.date);
  payload.append('Giờ đặt', order.time);

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString()
  }).catch(err => console.error("Lỗi lưu đơn hàng:", err));
}

function autoCheckPaymentStatus(tableName) {
  if (!GOOGLE_SCRIPT_URL) return;

  const currentTableNum = tableName.replace(/[^0-9]/g, '');

  fetch(`${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`)
    .then(res => res.json())
    .then(lockedTables => {
      const isPaid = lockedTables.some(lockedName => {
        let sheetTableNum = String(lockedName).replace(/[^0-9]/g, '');
        return currentTableNum !== '' && currentTableNum === sheetTableNum;
      });

      if (isPaid) {
        clearInterval(checkPaymentInterval);
        checkPaymentInterval = null;

        alert(`🎉 Ngân hàng đã xác nhận thanh toán thành công cho ${tableName}! Bàn của bạn đã được khóa.`);
        closeModal();
        closeBookingModal();

        checkLockedTables();
      }
    })
    .catch(err => console.error("Đang chờ thanh toán...", err));
}

function closeModal() {
  const qrModal = document.getElementById('qr-modal');
  if (qrModal) qrModal.classList.remove('active');

  if (checkPaymentInterval) {
    clearInterval(checkPaymentInterval);
    checkPaymentInterval = null;
  }
}

// =============================================================================
// KHÓA BÀN TỰ ĐỘNG (GIAO DIỆN MÀU ĐỎ)
// =============================================================================
async function checkLockedTables() {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("DAN_LINK")) return;

  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`);
    const lockedTables = await res.json();

    document.querySelectorAll('.table-card, .table-item').forEach(card => {
      let rawName = card.querySelector('h3') ? card.querySelector('h3').innerText : card.innerText;
      let cardNum = rawName.replace(/[^0-9]/g, '');

      const isLocked = lockedTables.some(lockedName => {
        let sheetNum = String(lockedName).replace(/[^0-9]/g, '');
        return cardNum !== '' && cardNum === sheetNum;
      });

      if (isLocked) {
        card.classList.add('locked');
      } else {
        card.classList.remove('locked');
      }
    });
  } catch (err) {
    console.error("Lỗi kiểm tra bàn:", err);
  }
}
