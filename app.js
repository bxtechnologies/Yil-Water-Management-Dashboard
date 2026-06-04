// --- DATABASE INITIALIZATION ENGINE ---
const SUPABASE_URL = 'https://fdeelqxwzwfkdffoavqd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZWVscXh3endma2RmZm9hdnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Njk4MDQsImV4cCI6MjA5NjE0NTgwNH0.4vehNDtTDrdWz8WrsgF22t17GP5f26rjBkataGiEAnU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- APP LOCAL INSTANCE RUNNING STATE ---
let state = {
    currentUser: "",       
    currentRole: "",       
    workerPersonalName: "", 
    sales: [],
    expenses: [],
    inventory: { production: 2000, damaged: 0 },
    activeLogins: [],
    bagUnitPrice: 350,      
    adminPassword: "3193",  
    workerPassword: "5566"  
};

// --- RUN SYSTEM CORE ON STARTUP ---
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial configuration dates values mapping setup
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invDate').value = today;
    document.getElementById('dateFilter').value = today;
    document.getElementById('currentDateDisplay').innerHTML = `<i class="fa-solid fa-calendar-day"></i> ${new Date().toDateString()}`;

    // 2. Attach frontend form interface action events triggers hooks
    document.getElementById('authForm').addEventListener('submit', logInUser);
    document.getElementById('salesForm').addEventListener('submit', saveNewSale);
    document.getElementById('expenseForm').addEventListener('submit', saveNewExpense);
    document.getElementById('dateFilter').addEventListener('change', renderDashboard);
    document.getElementById('username').addEventListener('input', checkUsernameInput);

    // 3. Download the baseline values live from the cloud tables data buckets
    await downloadCloudState();

    // 4. Auto-login active session memory state re-sync check
    const rememberedRole = localStorage.getItem('remembered_role');
    const rememberedName = localStorage.getItem('remembered_name');
    if (rememberedRole) {
        setupUserSession(rememberedRole, rememberedName || "");
    }

    // 5. Connect live subscription listeners pipeline channels
    initializeRealtimeSync();
    
    renderDashboard();
});

// --- CLOUD SYNCHRONIZATION DATA FETCH PIPELINES ---
async function downloadCloudState() {
    try {
        // Fetch Settings Configuration parameters Row
        const { data: settingsData } = await supabase.from('portal_settings').select('*').eq('id', 1).single();
        if (settingsData) {
            state.bagUnitPrice = settingsData.bag_price;
            state.adminPassword = settingsData.admin_password;
            state.workerPassword = settingsData.worker_password;
            
            document.getElementById('masterBagPriceInput').value = state.bagUnitPrice;
            document.getElementById('adminPassInput').value = state.adminPassword;
            document.getElementById('workerPassInput').value = state.workerPassword;
        }

        // Fetch Inventory metrics values row
        const { data: invData } = await supabase.from('inventory').select('*').eq('id', 1).single();
        if (invData) {
            state.inventory.production = invData.production;
            state.inventory.damaged = invData.damaged;
        }

        // Fetch All Sales records from the table matrix
        const { data: salesList } = await supabase.from('sales').select('*').order('id', { ascending: false });
        if (salesList) {
            state.sales = salesList.map(s => ({
                invoiceNumber: s.invoice_number,
                date: s.date,
                customerName: s.customer_name,
                quantity: s.quantity,
                unitPrice: s.unit_price,
                totalAmount: s.total_amount,
                paymentMethod: s.payment_method,
                officer: s.officer,
                recordedBy: s.recorded_by
            }));
        }

        // Fetch All Operating Expense Logs from table matrix
        const { data: expensesList } = await supabase.from('expenses').select('*').order('id', { ascending: false });
        if (expensesList) {
            state.expenses = expensesList.map(e => ({
                category: e.category,
                amount: e.amount,
                desc: e.desc,
                date: e.date,
                recordedBy: e.recorded_by
            }));
        }

        // Fetch Activity Logging Audits from table matrix
        const { data: logsList } = await supabase.from('access_logs').select('*').order('id', { ascending: false }).limit(25);
        if (logsList) {
            state.activeLogins = logsList;
        }

    } catch (err) {
        console.error("Cloud framework sync error on initial boot up downloads: ", err);
    }
}

// --- CORE INTERFACE REALTIME SUBSCRIPTIONS PIPELINE (THE SYNC MAGIC) ---
function initializeRealtimeSync() {
    supabase.channel('cloud-crud-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_settings' }, async () => { await downloadCloudState(); renderDashboard(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, async () => { await downloadCloudState(); renderDashboard(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => { await downloadCloudState(); renderDashboard(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, async () => { await downloadCloudState(); renderDashboard(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'access_logs' }, async () => { await downloadCloudState(); renderDashboard(); })
        .subscribe();
}

// Reveal secondary input name label properties on username character evaluation keys
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

// --- LOG IN ROUTINES INTEGRATED WITH CLOUD VAL SYSTEM STATE ---
async function logInUser(e) {
    e.preventDefault();
    const userTyped = document.getElementById('username').value.toLowerCase().trim();
    const passTyped = document.getElementById('password').value.trim();
    const nameTyped = document.getElementById('workerName').value.trim();

    if (userTyped !== 'admin' && userTyped !== 'worker') {
        alert("Wrong Username. Type 'admin' or 'worker'.");
        return;
    }

    // Double check cloud state matches values on user intent challenge verification
    await downloadCloudState();

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
    
    // Save login event directly up to cloud activity framework matrix
    await supabase.from('access_logs').insert([{
        user: sessionLabel,
        time: currentTimeString,
        date: new Date().toLocaleDateString()
    }]);

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

// --- LIVE ADMIN MASTER PRICE EDITING ACTION ---
async function updateSystemPrice() {
    if (state.currentRole !== 'admin') return;
    const newPrice = parseFloat(document.getElementById('masterBagPriceInput').value);
    if (!newPrice || newPrice <= 0) {
        alert("Please enter a valid price amount greater than 0.");
        return;
    }
    
    await supabase.from('portal_settings').update({ bag_price: newPrice }).eq('id', 1);
    alert(`Success! Standard bag price configuration updated to ₦${newPrice.toLocaleString()}`);
}

// --- DYNAMIC PASSWORD MODIFIER ACTIONS ---
async function updateSystemPasswords() {
    if (state.currentRole !== 'admin') return;
    const newAdminPass = document.getElementById('adminPassInput').value.trim();
    const newWorkerPass = document.getElementById('workerPassInput').value.trim();

    if (!newAdminPass || !newWorkerPass) {
        alert("Security Error: Authentication access keys cannot be empty.");
        return;
    }

    await supabase.from('portal_settings').update({ 
        admin_password: newAdminPass, 
        worker_password: newWorkerPass 
    }).eq('id', 1);
    
    alert("System Security Access Matrix successfully updated across all cloud instances!");
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

async function clearAllData() {
    if (state.currentRole !== 'admin') return;
    if (confirm("CRITICAL WARNING: Are you sure you want to completely erase all data row records across all cloud server tables? This action cannot be reversed!")) {
        await supabase.from('sales').delete().neq('id', 0);
        await supabase.from('expenses').delete().neq('id', 0);
        await supabase.from('access_logs').delete().neq('id', 0);
        await supabase.from('inventory').update({ production: 2000, damaged: 0 }).eq('id', 1);
        await supabase.from('portal_settings').update({ bag_price: 350, admin_password: "3193", worker_password: "5566" }).eq('id', 1);
        
        alert("Cloud storage servers successfully reset to factory parameters!");
        await downloadCloudState();
        renderDashboard();
    }
}

async function changeStock(field, val) {
    let currentProd = state.inventory.production;
    let currentDam = state.inventory.damaged;

    if (field === 'production') currentProd = Math.max(0, currentProd + val);
    if (field === 'damaged') currentDam = Math.max(0, currentDam + val);

    await supabase.from('inventory').update({ production: currentProd, damaged: currentDam }).eq('id', 1);
}

// --- TRANSMIT TRANSACTION ENTRIES FORWARD TO CLOUD SERVERS ---
async function saveNewSale(e) {
    e.preventDefault();
    const qty = parseInt(document.getElementById('invQty').value);
    const price = parseFloat(document.getElementById('invPrice').value); 

    const saleRecord = {
        invoice_number: document.getElementById('invNo').value,
        date: document.getElementById('invDate').value,
        customer_name: document.getElementById('invCustomer').value,
        quantity: qty,
        unit_price: price,
        total_amount: qty * price,
        payment_method: document.getElementById('invPaymentMethod').value,
        officer: document.getElementById('invOfficer').value,
        recorded_by: state.currentUser 
    };

    await supabase.from('sales').insert([saleRecord]);
    closeModal('salesModal');

    document.getElementById('invCustomer').value = "";
    document.getElementById('invQty').value = "1";
}

async function saveNewExpense(e) {
    e.preventDefault();
    const expenseRecord = {
        category: document.getElementById('expCategory').value,
        amount: parseFloat(document.getElementById('expAmount').value),
        desc: document.getElementById('expDesc').value,
        date: new Date().toISOString().split('T')[0],
        recorded_by: state.currentUser 
    };

    await supabase.from('expenses').insert([expenseRecord]);
    closeModal('expenseModal');
    e.target.reset();
}

async function deleteSale(invoiceNo) {
    if (state.currentRole !== 'admin') return;
    if (confirm("Do you want to permanently delete cloud ledger invoice row statement: " + invoiceNo + "?")) {
        await supabase.from('sales').delete().eq('invoice_number', invoiceNo);
    }
}

// --- MATHEMATICAL LEDGER RENDERING ENGINE ---
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
            logDisplayTarget.innerHTML = `<span class="text-slate-400 italic flex items-center gap-1"><i class="fa-solid fa-folder-open"></i> No access logs recorded in cloud.</span>`;
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
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 italic font-medium"><i class="fa-solid fa-inbox block text-xl mb-1 text-slate-300"></i> No transactions logged on cloud for this selected calendar date view.</td></tr>`;
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

// --- EXPORT SHEET ARRAYS OUT ---
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

// --- OPEN WINDOW SCREEN FRAME WORK MODALS ---
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
