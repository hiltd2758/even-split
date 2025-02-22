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
    
    // Tạo hoặc tìm h3 bên ngoài
    let header = container.previousElementSibling;
    if (!header || header.tagName !== 'H3') {
        header = document.createElement('h3');
        header.textContent = 'Người tham gia:';
        container.parentNode.insertBefore(header, container);
    }

    container.innerHTML = ''; // Xóa nội dung cũ
    
    participants.forEach((name, index) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="checkbox" id="check_${name}" value="${name}">
            <label for="check_${name}">${name}</label>
        `;
        div.style.animation = `slideIn 0.3s ease forwards`;
        div.style.animationDelay = `${index * 0.1}s`;
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
    const balances = {};
    participants.forEach(p => balances[p] = 0);

    const transactions = [];
    
    expenses.forEach(expense => {
        const payer = expense.paidBy;
        const validParticipants = expense.participants;
        const perPerson = expense.amount / validParticipants.length;

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
        const perPerson = expense.amount / expense.participants.length;

        breakdown.innerHTML = `
            <h4>${expense.description} (${expense.amount.toLocaleString('vi-VN')} VNĐ)</h4>
            <p>Người trả: ${expense.paidBy}</p>
            <p>Chia cho: ${expense.participants.join(', ')}</p>
            <p>Mỗi người trả: ${perPerson.toLocaleString('vi-VN')} VNĐ</p>
        `;
        summary.appendChild(breakdown);
    });

    const instructions = document.getElementById('paymentInstructions');
    instructions.innerHTML = '<h3>Hướng dẫn thanh toán:</h3>';

    const consolidatedPayments = new Map();
    transactions.forEach(({from, to, amount}) => {
        if (from !== to) {
            const key = `${from}-${to}`;
            consolidatedPayments.set(key, (consolidatedPayments.get(key) || 0) + amount);
        }
    });

    // Lấy trạng thái đã trả từ localStorage
    const paidStatus = JSON.parse(localStorage.getItem('paidStatus')) || {};

    consolidatedPayments.forEach((amount, key) => {
        const [from, to] = key.split('-');
        if (amount > 0) {
            const instruction = document.createElement('div');
            instruction.className = 'payment-instruction';

            // Trạng thái đã trả
            const isPaid = paidStatus[key] || false;

            instruction.innerHTML = `
                <label>
                    <input type="checkbox" class="payment-checkbox" data-key="${key}" ${isPaid ? 'checked' : ''}>
                    <span class="from">${from}</span>
                    <span class="amount">${amount.toLocaleString('vi-VN')} VNĐ</span>
                    <span class="to">${to}</span>
                </label>
            `;

            instructions.appendChild(instruction);
        }
    });

    // Bắt sự kiện thay đổi checkbox
    document.querySelectorAll('.payment-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const key = this.dataset.key;
            paidStatus[key] = this.checked;
            localStorage.setItem('paidStatus', JSON.stringify(paidStatus));

            // Cập nhật hiển thị trạng thái
            const statusSpan = this.parentElement.querySelector('.status');
            statusSpan.textContent = this.checked ? '✔️ Đã trả' : '';
        });
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
loadFromLocalStorage();