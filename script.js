let participants = [];
let expenses = [];

function addParticipant() {
    const name = document.getElementById('participantName').value.trim();
    if (name && !participants.includes(name)) {
        participants.push(name);
        updateParticipantList();
        updatePaidBySelect();
        updateParticipantCheckboxes();
        saveToLocalStorage();
    }
    document.getElementById('participantName').value = '';
}

function removeParticipant(name) {
    participants = participants.filter(p => p !== name);
    updateParticipantList();
    updatePaidBySelect();
    updateParticipantCheckboxes();
    saveToLocalStorage();
}

function updateParticipantList() {
    const list = document.getElementById('participantList');
    list.innerHTML = '';
    participants.forEach(name => {
        const tag = document.createElement('div');
        tag.className = 'participant-tag';
        tag.innerHTML = `
            ${name}
            <button class="remove-btn" onclick="removeParticipant('${name}')">×</button>
        `;
        list.appendChild(tag);
    });
}

function updatePaidBySelect() {
    const select = document.getElementById('paidBy');
    select.innerHTML = '<option value="">Người trả tiền</option>';
    participants.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

function updateParticipantCheckboxes() {
    const container = document.getElementById('participantCheckboxes');
    container.innerHTML = '<h3>Người tham gia:</h3>';
    participants.forEach(name => {
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="checkbox" id="check_${name}" value="${name}">
            <label for="check_${name}">${name}</label>
        `;
        container.appendChild(div);
    });
}

function addExpense() {
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const paidBy = document.getElementById('paidBy').value;
    const selectedParticipants = participants.filter(name => 
        document.getElementById(`check_${name}`).checked
    );

    if (description && amount && paidBy && selectedParticipants.length > 0) {
        expenses.push({
            description,
            amount,
            paidBy,
            participants: selectedParticipants
        });
        updateExpenseList();
        calculateSettlements();
        saveToLocalStorage();
        
        // Reset form
        document.getElementById('expenseDescription').value = '';
        document.getElementById('expenseAmount').value = '';
        document.getElementById('paidBy').value = '';
        document.querySelectorAll('#participantCheckboxes input[type="checkbox"]')
            .forEach(cb => cb.checked = false);
    }
}

function updateExpenseList() {
    const list = document.getElementById('expenseList');
    list.innerHTML = '';
    expenses.forEach((expense, index) => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.innerHTML = `
            <h3>${expense.description}</h3>
            <p>Số tiền: ${expense.amount.toLocaleString('vi-VN')} VNĐ</p>
            <p>Người trả: ${expense.paidBy}</p>
            <p>Người tham gia: ${expense.participants.join(', ')}</p>
            <button class="remove-btn" onclick="removeExpense(${index})">Xóa</button>
        `;
        list.appendChild(item);
    });
}

function removeExpense(index) {
    expenses.splice(index, 1);
    updateExpenseList();
    calculateSettlements();
    saveToLocalStorage();
}

function calculateSettlements() {
    // Initialize balances for all participants
    const balances = {};
    participants.forEach(p => balances[p] = 0);
    
    // Track detailed transactions for each expense
    const transactions = [];
    
    expenses.forEach(expense => {
        const payer = expense.paidBy;
        // const isPayerIncluded = expense.participants.includes(payer);
        const validParticipants = expense.participants;

    
    console.log("Valid participants:", validParticipants);
    console.log("Valid participants:", validParticipants);

    const perPerson = expense.amount /validParticipants.length;
    console.log("Displayed perPerson:", perPerson);


        balances[payer] += expense.amount;
        
        
        validParticipants.forEach(participant => {
            
            balances[participant] -= perPerson;
            transactions.push({
                from: participant,
                to: payer,
                amount: perPerson,
                description: expense.description
            });
        });
        
    });
    
    const summary = document.getElementById('settlementSummary');
    summary.innerHTML = '<h3>Chi tiết từng khoản:</h3>';
    
    expenses.forEach(expense => {
        const breakdown = document.createElement('div');
        breakdown.className = 'expense-breakdown';
        // const validParticipants = expense.participants.filter(p => p !== expense.paidBy);
        const validParticipants = expense.participants;

        const perPerson = expense.amount / validParticipants.length;
        console.log("Valid participants:", validParticipants);
        console.log("Valid participants:", validParticipants);

        breakdown.innerHTML = `
            <h4>${expense.description} (${expense.amount.toLocaleString('vi-VN')} VNĐ)</h4>
            <p>Người trả: ${expense.paidBy}</p>
            <p>Chia cho: ${validParticipants.join(', ')}</p>
            <p>Mỗi người trả: ${perPerson.toLocaleString('vi-VN')} VNĐ</p>
        `;
        summary.appendChild(breakdown);
    });

    // Display final balances
    // const balanceDiv = document.createElement('div');
    // balanceDiv.innerHTML = '<h3>Số dư cuối cùng:</h3>';
    // Object.entries(balances).forEach(([person, balance]) => {
    //     const p = document.createElement('p');
    //     p.textContent = `${person}: ${balance.toLocaleString('vi-VN')} VNĐ ` +
    //         (balance > 0 ? '(nhận về)' : '(cần trả)');
    //     p.style.color = balance > 0 ? 'green' : 'red';
    //     balanceDiv.appendChild(p);
    // });
    // summary.appendChild(balanceDiv);

    // Consolidate and display payment instructions
    const instructions = document.getElementById('paymentInstructions');
    instructions.innerHTML = '<h3>Hướng dẫn thanh toán:</h3>';

    // Consolidate transactions by participants
    const consolidatedPayments = new Map();
    transactions.forEach(({from, to, amount}) => {
        if (from !== to) {  // Bỏ qua trường hợp tự trả tiền cho chính mình
            const key = `${from}-${to}`;
            consolidatedPayments.set(key, (consolidatedPayments.get(key) || 0) + amount);
        }
    });
    

    // Display final payment instructions
    consolidatedPayments.forEach((amount, key) => {
        const [from, to] = key.split('-');
        if (amount > 0) {
            const instruction = document.createElement('div');
            instruction.className = 'payment-instruction';
            instruction.textContent = `${from} trả ${amount.toLocaleString('vi-VN')} VNĐ cho ${to}`;
            instructions.appendChild(instruction);
        }
    });
}


function saveToLocalStorage() {
    localStorage.setItem('expenseSplitterData', JSON.stringify({
        participants,
        expenses
    }));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('expenseSplitterData');
    if (data) {
        const parsed = JSON.parse(data);
        participants = parsed.participants;
        expenses = parsed.expenses;
        updateParticipantList();
        updatePaidBySelect();
        updateParticipantCheckboxes();
        updateExpenseList();
        calculateSettlements();
    }
}

// Load saved data when page loads
loadFromLocalStorage();