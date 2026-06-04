// --- LOCAL ENGINE RUNNING STATE CONTROL ---
let state = {
    currentUser: "",       
    currentRole: "",       
    workerPersonalName: "", 
    sales: JSON.parse(localStorage.getItem('yil_sales')) || [],
    expenses: JSON.parse(localStorage.getItem('yil_expenses')) || [],
    inventory: JSON.parse(localStorage.getItem('yil_inventory')) || { production: 2000, damaged: 0 },
    activeLogins: JSON.parse(localStorage.getItem('yil_logins')) || [],
    bagUnitPrice: parseFloat(localStorage.getItem('yil_bag_price')) || 350,      
    adminPassword: localStorage.getItem('yil_admin_pass') || "3193",  
    workerPassword: localStorage.getItem('yil_worker_pass') || "5566"  
};

// --- CORE SYSTEM LOAD BOOT STRAPPER ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Base date inputs initialization mapping properties
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invDate').value = today;
    document.getElementById('dateFilter').value = today;
    document.getElementById('currentDateDisplay').innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${new Date().toDateString()}`;

    // 2. Map system event listeners parameters hook triggers
    document.getElementById('authForm').addEventListener('submit', logInUser);
    document.getElementById('salesForm').addEventListener('submit', saveNewSale);
    document.getElementById('expenseForm').addEventListener('submit', saveNewExpense);
    document.getElementById('dateFilter').addEventListener('change', renderDashboard);
    document.getElementById('username').addEventListener('input', checkUsernameInput);

    // 3. Assign input values from active state configuration vectors
    document.getElementById('masterBagPriceInput').value = state.bagUnitPrice;
    document.getElementById('adminPassInput').value = state.adminPassword;
    document.getElementById('workerPassInput').value = state.workerPassword;

    // 4. Auto-login active continuous session retention routine
    const rememberedRole = localStorage.getItem('remembered_role');
    const rememberedName = localStorage.getItem('remembered_name');
    if (rememberedRole) {
        setupUserSession(rememberedRole, rememberedName || "");
    }
    
    renderDashboard();
});

// Reveal secondary identification element if user selects worker credentials type
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

// --- SECURE AUTHORIZATION VERIFICATION SYSTEM RENDER ---
function logInUser(e) {
    e.preventDefault();
    const userTyped = document.getElementById('username').value.toLowerCase().trim();
    const passTyped = document.getElementById('password').value.trim();
    const nameTyped = document.getElementById('workerName').value.trim();

    if (userTyped !== 'admin' && userTyped !== 'worker') {
        alert("Wrong Username. Type 'admin' or 'worker'.");
        return;
    }

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
    localStorage.setItem('yil_logins', JSON.stringify(state.activeLogins));

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
        controlsArea.classList.remove('hidden'); 
    } else {
        state.currentUser = "Worker: " + name;
        document.getElementById('adminClearBtn').classList.add('hidden');
        controlsArea.classList.add('hidden');    
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('invDate').value = today;
        document.getElementById('invDate').setAttribute('readonly', 'true');
    }

    document.getElementById('userBadge').innerText = state.currentUser;
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('appInterface').classList.remove('hidden');

    renderDashboard();
}

// --- ADMIN LIVE MASTER PRICE EDITING ACTION ---
function updateSystemPrice() {
    if (state.currentRole !== 'admin') return;
    const newPrice = parseFloat(document.getElementById('masterBagPriceInput').value);
    if (!newPrice || newPrice <= 0) {
        alert("Please enter a valid price amount greater than 0.");
        return;
    }
    
    state.bagUnitPrice = newPrice;
    localStorage.setItem('yil_bag_price', newPrice);
    alert(`Success! Standard bag price configuration updated to ₦${newPrice.toLocaleString()}`);
    renderDashboard();
}

// --- DYNAMIC PASSWORD MODIFIER ACTIONS ---
function updateSystemPasswords() {
    if (state.currentRole !== 'admin') return;
    const newAdminPass = document.getElementById('adminPassInput').value.trim();
    const newWorkerPass = document.getElementById('workerPassInput').value.trim();

    if (!newAdminPass || !newWorkerPass) {
        alert("Security Error: Authentication access keys cannot be empty.");
        return;
    }

    state.adminPassword = newAdminPass;
    state.workerPassword = newWorkerPass;
    
    localStorage.setItem('yil_admin_pass', newAdminPass);
    localStorage.setItem('yil_worker_pass', newWorkerPass);
    
    alert("System Security Access Matrix successfully updated across local storage instances!");
}

function logOut() {
    state.currentUser = "";
    state.currentRole = "";
    state.workerPersonalName = "";

    localStorage.removeItem('remembered_role');
    localStorage.removeItem('remembered_name');

    document.getElementById('authForm').reset();
    document.getElementById('workerNameField').classList.add('hidden');

    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('appInterface').classList.add('hidden');
}

function clearAllData() {
    if (state.currentRole !== 'admin') return;
    if (confirm("CRITICAL WARNING: Erase all logged local statements permanently from this machine profile browser sandbox memory?")) {
        localStorage.clear();
        state.sales = [];
        state.expenses = [];
        state.activeLogins = [];
        state.inventory = { production: 2000, damaged: 0 };
        state.bagUnitPrice = 350;
        state.adminPassword = "3193";
        state.workerPassword = "5566";
        
        document.getElementById('masterBagPriceInput').value = 350;
        document.getElementById('adminPassInput').value = "3193";
        document.getElementById('workerPassInput').value = "5566";
        
        alert("Local sandbox memory partitions cleared successfully!");
        renderDashboard();
    }
}

function changeStock(field, val) {
    if (field === 'production') state.inventory.production = Math.max(0, state.inventory.production + val);
    if (field === 'damaged') state.inventory.damaged = Math.max(0, state.inventory.damaged + val);

    localStorage.setItem('yil_inventory', JSON.stringify(state.inventory));
    renderDashboard();
}

// --- COMMIT LOG STATEMENTS OUT ---
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
    localStorage.setItem('yil_sales', JSON.stringify(state.sales));

    closeModal('salesModal');
    document.getElementById('invCustomer').value = "";
    document.getElementById('invQty').value = "1";

    renderDashboard();
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
    localStorage.setItem('yil_expenses', JSON.stringify(state.expenses));

    closeModal('expenseModal');
    e.target.reset();
    renderDashboard();
}

function deleteSale(invoiceNo) {
    if (state.currentRole !== 'admin') return;
    if (confirm("Permanently erase local tracking node index details for row record token statement: " + invoiceNo + "?")) {
        state.sales = state.sales.filter(s => s.invoiceNumber !== invoiceNo);
        localStorage.setItem('yil_sales', JSON.stringify(state.sales));
        renderDashboard();
    }
}

// --- RECOMPUTE MATH LEDGER ARRAYS CORE ENGINE ---
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
            logDisplayTarget.innerHTML = `<span class="text-slate-400 italic flex items-center gap-1"><i class="fa-solid fa-folder-open"></i> No access logs recorded in local memory sandbox.</span>`;
        } else {
            logDisplayTarget.innerHTML = state.activeLogins.slice(0, 25).map(log => `
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
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 italic font-medium"><i class="fa-solid fa-inbox block text-xl mb-1 text-slate-300"></i> No transactions logged on memory ledger profiles for this selected calendar date view.</td></tr>`;
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

// --- EXPORT MATRIX TO CSV SHEET ROUTINES ---
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

// --- UTILITY MODAL DISPLAY LAYERS ---
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
