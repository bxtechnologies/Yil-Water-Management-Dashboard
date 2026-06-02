// --- DATABASE STATE ---
let state = {
    currentUser: "",       
    currentRole: "",       
    workerPersonalName: "", 
    sales: [],
    expenses: [],
    inventory: { production: 2000, damaged: 0 },
    activeLogins: [],
    bagUnitPrice: 350,      
    adminPassword: "3193",  // Baseline default admin password parameter
    workerPassword: "5566"  // Baseline default worker password parameter
};

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    const localSaved = localStorage.getItem('yil_water_simple_state');
    if (localSaved) {
        state = JSON.parse(localSaved);
        // Fallback safety migrations for database continuity upgrades
        if (state.bagUnitPrice === undefined) state.bagUnitPrice = 350;
        if (!state.adminPassword) state.adminPassword = "3193";
        if (!state.workerPassword) state.workerPassword = "5566";
    }
    
    // Default current dates setups
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invDate').value = today;
    document.getElementById('dateFilter').value = today;
    document.getElementById('currentDateDisplay').innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${new Date().toDateString()}`;

    // Load internal system parameters variables configuration directly inside fields templates
    document.getElementById('masterBagPriceInput').value = state.bagUnitPrice;
    document.getElementById('adminPassInput').value = state.adminPassword;
    document.getElementById('workerPassInput').value = state.workerPassword;

    // Event hooks
    document.getElementById('authForm').addEventListener('submit', logInUser);
    document.getElementById('salesForm').addEventListener('submit', saveNewSale);
    document.getElementById('expenseForm').addEventListener('submit', saveNewExpense);
    document.getElementById('dateFilter').addEventListener('change', renderDashboard);
    document.getElementById('username').addEventListener('input', checkUsernameInput);

    // Auto-login session re-check
    const rememberedRole = localStorage.getItem('remembered_role');
    const rememberedName = localStorage.getItem('remembered_name');
    if (rememberedRole) {
        setupUserSession(rememberedRole, rememberedName || "");
    }

    renderDashboard();
});

function saveToLocalStorage() {
    localStorage.setItem('yil_water_simple_state', JSON.stringify(state));
}

// Check username typing to reveal the "What is your Name?" field
function checkUsernameInput(e) {
    const inputVal = e.target.value.toLowerCase().trim();
    const nameField = document.getElementById('workerNameField');
    const workerNameInput = document.getElementById('workerName');

    if (inputVal === 'worker') {
        nameField.classList.remove('hidden');
        workerNameInput.setAttribute('required', 'true');
    } else {
        nameField.classList.add('hidden');
        workerNameInput.removeAttribute('required');
    }
}

// --- LOG IN FUNCTION WITH DYNAMIC CREDENTIALS MATCHING ---
function logInUser(e) {
    e.preventDefault();
    const userTyped = document.getElementById('username').value.toLowerCase().trim();
    const passTyped = document.getElementById('password').value.trim();
    const nameTyped = document.getElementById('workerName').value.trim();

    if (userTyped !== 'admin' && userTyped !== 'worker') {
        alert("Wrong Username. Type 'admin' or 'worker'.");
        return;
    }

    // Dynamic state matching validation check
    if (userTyped === 'admin' && passTyped !== state.adminPassword) {
        alert("Invalid Admin Authentication Pin Key.");
        return;
    }
    
    if (userTyped === 'worker') {
        if (passTyped !== state.workerPassword) {
            alert("Invalid Worker Authorization Access Key Code.");
            return;
        }
        if (!nameTyped) {
            alert("Please provide your name into the identification field.");
            return;
        }
    }

    const currentTimeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sessionLabel = userTyped === 'admin' ? 'Admin Master' : `Worker: ${nameTyped}`;
    
    state.activeLogins.unshift({
        user: sessionLabel,
        time: currentTimeString,
        date: new Date().toLocaleDateString()
    });

    localStorage.setItem('remembered_role', userTyped);
    localStorage.setItem('remembered_name', nameTyped);

    setupUserSession(userTyped, nameTyped);
}

function setupUserSession(role, name) {
    state.currentRole = role;
    state.workerPersonalName = name;

    const controlsArea = document.getElementById('adminControlsArea');

    if (role === 'admin') {
        state.currentUser = "Admin";
        document.getElementById('adminClearBtn').classList.remove('hidden');
        document.getElementById('invDate').removeAttribute('readonly');
        controlsArea.classList.remove('hidden'); // Open Admin controls layout wrapper view blocks
    } else {
        state.currentUser = "Worker: " + name;
        document.getElementById('adminClearBtn').classList.add('hidden');
        controlsArea.classList.add('hidden');    // Protect and secure structural layout control panels block
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invDate').value = today;
        document.getElementById('invDate').setAttribute('readonly', 'true');
    }

    document.getElementById('userBadge').innerText = state.currentUser;
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('appInterface').classList.remove('hidden');

    saveToLocalStorage();
    renderDashboard();
}

// --- MASTER PRICE MANAGEMENT UPDATE ACTION ---
function updateSystemPrice() {
    const newPrice = parseFloat(document.getElementById('masterBagPriceInput').value);
    if (!newPrice || newPrice <= 0) {
        alert("Please enter a valid price amount greater than 0.");
        return;
    }
    
    state.bagUnitPrice = newPrice;
    saveToLocalStorage();
    alert(`Success! Standard bag price configuration has been updated to ₦${newPrice.toLocaleString()}`);
    renderDashboard();
}

// --- MASTER PASSWORDS ACCOUNT SECURITY MANAGEMENT UTILITY ---
function updateSystemPasswords() {
    const newAdminPass = document.getElementById('adminPassInput').value.trim();
    const newWorkerPass = document.getElementById('workerPassInput').value.trim();

    if (!newAdminPass || !newWorkerPass) {
        alert("Security Error: Authentication access keys cannot be saved as empty space templates.");
        return;
    }

    state.adminPassword = newAdminPass;
    state.workerPassword = newWorkerPass;
    saveToLocalStorage();
    
    alert("System Security Access Matrix successfully updated!\nNew passwords are live immediately.");
    renderDashboard();
}

function logOut() {
    state.currentUser = "";
    state.currentRole = "";
    state.workerPersonalName = "";

    localStorage.removeItem('remembered_role');
    localStorage.removeItem('remembered_name');

    saveToLocalStorage();

    document.getElementById('authForm').reset();
    document.getElementById('workerNameField').classList.add('hidden');

    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('appInterface').classList.add('hidden');
}

function clearAllData() {
    if (confirm("Are you sure you want to completely erase all data records from this local computer system?")) {
        state.sales = [];
        state.expenses = [];
        state.inventory = { production: 0, damaged: 0 };
        state.activeLogins = [];
        state.bagUnitPrice = 350; 
        state.adminPassword = "3193";
        state.workerPassword = "5566";
        
        document.getElementById('masterBagPriceInput').value = 350;
        document.getElementById('adminPassInput').value = "3193";
        document.getElementById('workerPassInput').value = "5566";
        
        saveToLocalStorage();
        renderDashboard();
    }
}

function changeStock(field, val) {
    if (field === 'production') {
        state.inventory.production = Math.max(0, state.inventory.production + val);
    } else if (field === 'damaged') {
        state.inventory.damaged = Math.max(0, state.inventory.damaged + val);
    }
    saveToLocalStorage();
    renderDashboard();
}

// --- DATA SAVING ENGINE ACTIONS ---
function saveNewSale(e) {
    e.preventDefault();
    const qty = parseInt(document.getElementById('invQty').value);
    const price = parseFloat(document.getElementById('invPrice').value); 

    const saleRecord = {
        invoiceNumber: document.getElementById('invNo').value,
        date: document.getElementById('invDate').value,
        customerName: document.getElementById('invCustomer').value,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        paymentMethod: document.getElementById('invPaymentMethod').value,
        officer: document.getElementById('invOfficer').value,
        recordedBy: state.currentUser 
    };

    state.sales.unshift(saleRecord);
    saveToLocalStorage();
    closeModal('salesModal');
    renderDashboard();

    document.getElementById('invCustomer').value = "";
    document.getElementById('invQty').value = "1";
}

function saveNewExpense(e) {
    e.preventDefault();
    const expenseRecord = {
        category: document.getElementById('expCategory').value,
        amount: parseFloat(document.getElementById('expAmount').value),
        desc: document.getElementById('expDesc').value,
        date: new Date().toISOString().split('T')[0],
        recordedBy: state.currentUser 
    };

    state.expenses.unshift(expenseRecord);
    saveToLocalStorage();
    closeModal('expenseModal');
    renderDashboard();
    e.target.reset();
}

function deleteSale(invoiceNo) {
    if (confirm("Do you want to delete invoice: " + invoiceNo + "?")) {
        state.sales = state.sales.filter(s => s.invoiceNumber !== invoiceNo);
        saveToLocalStorage();
        renderDashboard();
    }
}

// --- MATHEMATICAL AND GRAPHICAL RENDERING ---
function renderDashboard() {
    const selectedDate = document.getElementById('dateFilter').value;
    const filteredSales = state.sales.filter(s => s.date === selectedDate);

    let d1Sales = 0, d2Sales = 0, d3Sales = 0, shopSales = 0;
    let d1Debt = 0, d2Debt = 0, d3Debt = 0;
    let cashPay = 0, transferPay = 0, posPay = 0;

    filteredSales.forEach(s => {
        const amt = parseFloat(s.totalAmount);
        
        if (s.officer === 'Driver 1') d1Sales += amt;
        else if (s.officer === 'Driver 2') d2Sales += amt;
        else if (s.officer === 'Driver 3') d3Sales += amt;
        else shopSales += amt;

        if (s.paymentMethod === 'Credit') {
            if (s.officer === 'Driver 1') d1Debt += amt;
            if (s.officer === 'Driver 2') d2Debt += amt;
            if (s.officer === 'Driver 3') d3Debt += amt;
        }

        if (s.paymentMethod === 'Cash') cashPay += amt;
        if (s.paymentMethod === 'Bank Transfer') transferPay += amt;
        if (s.paymentMethod === 'POS') posPay += amt;
    });

    let totalExpensesAmt = 0;
    state.expenses.forEach(e => { totalExpensesAmt += parseFloat(e.amount); });

    const totalDriversSales = d1Sales + d2Sales + d3Sales;
    const grossRevenue = totalDriversSales + shopSales;
    const totalDebtUnpaid = d1Debt + d2Debt + d3Debt;

    document.getElementById('statTotalSales').innerText = "₦" + grossRevenue.toLocaleString();
    document.getElementById('statDriversTotal').innerText = "₦" + totalDriversSales.toLocaleString();
    document.getElementById('lblD1').innerText = "₦" + d1Sales.toLocaleString();
    document.getElementById('lblD2').innerText = "₦" + d2Sales.toLocaleString();
    document.getElementById('lblD3').innerText = "₦" + d3Sales.toLocaleString();
    document.getElementById('statShopSales').innerText = "₦" + shopSales.toLocaleString();
    document.getElementById('statNetIncome').innerText = "₦" + (grossRevenue - totalExpensesAmt).toLocaleString();
    
    document.getElementById('lblExpenses').innerText = "₦" + totalExpensesAmt.toLocaleString();
    document.getElementById('lblDebt').innerText = "₦" + totalDebtUnpaid.toLocaleString();

    document.getElementById('debtD1').innerText = "₦" + d1Debt.toLocaleString();
    document.getElementById('debtD2').innerText = "₦" + d2Debt.toLocaleString();
    document.getElementById('debtD3').innerText = "₦" + d3Debt.toLocaleString();

    document.getElementById('payCash').innerText = "₦" + cashPay.toLocaleString();
    document.getElementById('payTransfer').innerText = "₦" + transferPay.toLocaleString();
    document.getElementById('payPOS').innerText = "₦" + posPay.toLocaleString();

    const globalBagsSoldAllTime = state.sales.reduce((total, s) => total + parseInt(s.quantity), 0);
    const physicalStockLeft = state.inventory.production - globalBagsSoldAllTime - state.inventory.damaged;

    document.getElementById('stockAvailable').innerText = physicalStockLeft.toLocaleString();
    document.getElementById('stockProduction').innerText = state.inventory.production.toLocaleString();
    document.getElementById('stockSold').innerText = globalBagsSoldAllTime.toLocaleString();
    document.getElementById('stockDamaged').innerText = state.inventory.damaged.toLocaleString();

    if (state.currentRole === 'admin') {
        const logDisplayTarget = document.getElementById('loginLogsContainer');
        if (state.activeLogins.length === 0) {
            logDisplayTarget.innerHTML = `<span class="text-slate-400 italic flex items-center gap-1"><i class="fa-solid fa-folder-open"></i> No previous logins archived yet.</span>`;
        } else {
            logDisplayTarget.innerHTML = state.activeLogins.map(log => `
                <div class="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-xl inline-flex items-center justify-between font-semibold shadow-xs w-full">
                    <span class="flex items-center gap-1"><i class="fa-solid fa-user-clock text-blue-500 text-[10px]"></i> ${log.user}</span> 
                    <b class="text-slate-400 font-normal text-[10px] ml-1">(${log.date} at ${log.time})</b>
                </div>
            `).join('');
        }
    }

    renderTableRows(filteredSales);
}

function renderTableRows(salesArray) {
    const tbody = document.getElementById('salesTableBody');
    if (salesArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 italic font-medium"><i class="fa-solid fa-inbox block text-xl mb-1 text-slate-300"></i> No business records logged for this selected calendar date view.</td></tr>`;
        return;
    }

    const isAdmin = (state.currentRole === 'admin');

    tbody.innerHTML = salesArray.map(s => `
        <tr class="hover:bg-slate-50/80 transition border-b border-slate-100 font-medium">
            <td class="p-3 font-mono font-bold text-blue-600">${s.invoiceNumber}</td>
            <td class="p-3">
                <div class="font-bold text-slate-900">${s.customerName}</div>
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <i class="fa-solid fa-credit-card text-[9px]"></i> ${s.paymentMethod}
                </div>
            </td>
            <td class="p-3 text-slate-900"><i class="fa-solid fa-box text-slate-300 mr-1"></i>${s.quantity} Bags</td>
            <td class="p-3 font-black text-slate-900">₦${parseFloat(s.totalAmount).toLocaleString()}</td>
            <td class="p-3 text-slate-600"><i class="fa-solid fa-truck-ramp-box text-slate-300 mr-1"></i>${s.officer}</td>
            <td class="p-3">
                <span class="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-bold tracking-wide uppercase inline-flex items-center gap-1">
                    <i class="fa-solid fa-user-pen text-slate-400 text-[9px]"></i> ${s.recordedBy || 'System Master'}
                </span>
            </td>
            <td class="p-3 text-right">
                ${isAdmin ? `<button onclick="deleteSale('${s.invoiceNumber}')" class="text-slate-400 hover:text-red-600 w-8 h-8 rounded-lg hover:bg-red-50 inline-flex items-center justify-center transition" title="Delete Row"><i class="fa-solid fa-trash-can"></i></button>` : '<span class="text-slate-300 text-xs italic bg-slate-50 border px-2 py-0.5 rounded-md"><i class="fa-solid fa-lock text-[9px]"></i> Locked</span>'}
            </td>
        </tr>
    `).join('');
}

// --- EXPORT SHEET COMPONENT ENGINE ---
function exportCSV() {
    const activeDate = document.getElementById('dateFilter').value || "Report";
    let rows = [];

    rows.push(["YIL TABLE WATER MANAGEMENT SPREADSHEET REPORT"]);
    rows.push(["Report Run Date Timeline: " + activeDate]);
    rows.push(["Generated Action Sign-Off Agent Flag: " + state.currentUser]);
    rows.push([]);

    rows.push(["Invoice Number", "Date Logged", "Customer Entity Name", "Bags Quantity Count", "Unit Price Cost", "Total Amount Value", "Payment Classification Mode", "Assigned Driver Route Handler", "Recorded By Employee Profile Stamp"]);
    
    state.sales.forEach(s => {
        rows.push([
            s.invoiceNumber,
            s.date,
            `"${s.customerName}"`,
            s.quantity,
            s.unitPrice,
            s.totalAmount,
            s.paymentMethod,
            s.officer,
            `"${s.recordedBy || 'System Account'}"`
        ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `YIL_WATER_REPORT_${activeDate}.csv`);
    document.body.appendChild(downloadAnchor);
    
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}

// --- WINDOW MODALS INTERACTION ACTIONS ---
function openModal(id) {
    if (id === 'salesModal') {
        document.getElementById('invNo').value = 'YIL-' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('invPrice').value = state.bagUnitPrice;
        
        if (state.currentRole !== 'admin') {
            document.getElementById('invDate').value = new Date().toISOString().split('T')[0];
        }
    }
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}