/**
 * 収入・支出管理を担当するコンポーネント
 */
class FinanceManager {
    constructor(storageService, financeCalculator) {
        this.storageService = storageService;
        this.financeCalculator = financeCalculator;
        
        this.initializeElements();
        this.bindEvents();
        this.setDefaultDates();
    }

    initializeElements() {
        this.elements = {
            // 収入関連
            incomeDate: document.getElementById('incomeDate'),
            incomeAmount: document.getElementById('incomeAmount'),
            incomeDescription: document.getElementById('incomeDescription'),
            addIncomeBtn: document.getElementById('addIncome'),
            
            // 定期収入関連
            regularIncomeStart: document.getElementById('regularIncomeStart'),
            regularIncomeAmount: document.getElementById('regularIncomeAmount'),
            regularIncomeMonths: document.getElementById('regularIncomeMonths'),
            generateRegularIncomeBtn: document.getElementById('generateRegularIncome'),
            
            // 支出関連
            expenseDate: document.getElementById('expenseDate'),
            expenseCategory: document.getElementById('expenseCategory'),
            expenseAmount: document.getElementById('expenseAmount'),
            expenseDescription: document.getElementById('expenseDescription'),
            addExpenseBtn: document.getElementById('addExpense'),
            
            // 定期支出関連
            regularExpenseStart: document.getElementById('regularExpenseStart'),
            regularExpenseCategory: document.getElementById('regularExpenseCategory'),
            regularExpenseAmount: document.getElementById('regularExpenseAmount'),
            regularExpenseMonths: document.getElementById('regularExpenseMonths'),
            generateRegularExpenseBtn: document.getElementById('generateRegularExpense')
        };
    }

    bindEvents() {
        // 収入追加
        this.elements.addIncomeBtn.addEventListener('click', () => {
            this.addIncome();
        });

        // 定期収入生成
        this.elements.generateRegularIncomeBtn.addEventListener('click', () => {
            this.generateRegularIncome();
        });

        // 支出追加
        this.elements.addExpenseBtn.addEventListener('click', () => {
            this.addExpense();
        });

        // 定期支出生成
        this.elements.generateRegularExpenseBtn.addEventListener('click', () => {
            this.generateRegularExpense();
        });

        // Enterキーでの追加
        this.elements.incomeAmount.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addIncome();
        });

        this.elements.expenseAmount.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        this.elements.incomeDate.value = today;
        this.elements.expenseDate.value = today;
        this.elements.regularIncomeStart.value = today;
        this.elements.regularExpenseStart.value = today;
    }

    addIncome() {
        const date = this.elements.incomeDate.value;
        const amount = parseFloat(this.elements.incomeAmount.value);
        const description = this.elements.incomeDescription.value.trim();

        if (!date || !amount || amount <= 0) {
            alert('日付と正しい金額を入力してください');
            return;
        }

        if (!description) {
            alert('収入源を入力してください');
            return;
        }

        const transaction = new Transaction({
            type: 'income',
            amount: amount,
            date: date,
            description: description
        });

        this.saveTransaction(transaction);
        this.clearIncomeForm();
        this.notifyUpdate();
    }

    generateRegularIncome() {
        const startDate = this.elements.regularIncomeStart.value;
        const amount = parseFloat(this.elements.regularIncomeAmount.value);
        const months = parseInt(this.elements.regularIncomeMonths.value);

        if (!startDate || !amount || amount <= 0 || !months || months <= 0) {
            alert('すべての項目を正しく入力してください');
            return;
        }

        if (months > 24) {
            alert('継続月数は24ヶ月以下で入力してください');
            return;
        }

        const transactions = [];
        const start = new Date(startDate);

        for (let i = 0; i < months; i++) {
            const incomeDate = new Date(start);
            incomeDate.setMonth(start.getMonth() + i);

            // 過去の日付は除外
            if (incomeDate >= new Date()) {
                const transaction = new Transaction({
                    type: 'income',
                    amount: amount,
                    date: incomeDate,
                    description: `定期収入`,
                    isRegular: true
                });
                transactions.push(transaction);
            }
        }

        if (transactions.length === 0) {
            alert('生成される定期収入がありません（すべて過去の日付）');
            return;
        }

        const confirmMessage = `${transactions.length}件の定期収入を生成しますか？\n（¥${amount.toLocaleString()} × ${transactions.length}ヶ月）`;
        if (!confirm(confirmMessage)) return;

        this.saveTransactions(transactions);
        this.clearRegularIncomeForm();
        this.notifyUpdate();

        alert(`${transactions.length}件の定期収入を生成しました`);
    }

    generateRegularExpense() {
        const startDate = this.elements.regularExpenseStart.value;
        const category = this.elements.regularExpenseCategory.value;
        const amount = parseFloat(this.elements.regularExpenseAmount.value);
        const months = parseInt(this.elements.regularExpenseMonths.value);

        if (!startDate || !amount || amount <= 0 || !months || months <= 0) {
            alert('すべての項目を正しく入力してください');
            return;
        }

        if (months > 24) {
            alert('継続月数は24ヶ月以下で入力してください');
            return;
        }

        const transactions = [];
        const start = new Date(startDate);

        for (let i = 0; i < months; i++) {
            const expenseDate = new Date(start);
            expenseDate.setMonth(start.getMonth() + i);

            // 過去の日付は除外
            if (expenseDate >= new Date()) {
                const transaction = new Transaction({
                    type: 'expense',
                    amount: amount,
                    date: expenseDate,
                    description: `定期支出`,
                    category: category,
                    isRegular: true
                });
                transactions.push(transaction);
            }
        }

        if (transactions.length === 0) {
            alert('生成される定期支出がありません（すべて過去の日付）');
            return;
        }

        const confirmMessage = `${transactions.length}件の定期支出を生成しますか？\n（¥${amount.toLocaleString()} × ${transactions.length}ヶ月）`;
        if (!confirm(confirmMessage)) return;

        this.saveTransactions(transactions);
        this.clearRegularExpenseForm();
        this.notifyUpdate();

        alert(`${transactions.length}件の定期支出を生成しました`);
    }

    addExpense() {
        const date = this.elements.expenseDate.value;
        const category = this.elements.expenseCategory.value;
        const amount = parseFloat(this.elements.expenseAmount.value);
        const description = this.elements.expenseDescription.value.trim();

        if (!date || !amount || amount <= 0) {
            alert('日付と正しい金額を入力してください');
            return;
        }

        if (!description) {
            alert('支出内容を入力してください');
            return;
        }

        const transaction = new Transaction({
            type: 'expense',
            amount: amount,
            date: date,
            description: description,
            category: category
        });

        this.saveTransaction(transaction);
        this.clearExpenseForm();
        this.notifyUpdate();
    }

    saveTransaction(transaction) {
        const transactions = this.storageService.loadTransactions();
        transactions.push(transaction);
        this.storageService.saveTransactions(transactions);
    }

    saveTransactions(newTransactions) {
        const transactions = this.storageService.loadTransactions();
        transactions.push(...newTransactions);
        this.storageService.saveTransactions(transactions);
    }

    clearIncomeForm() {
        this.elements.incomeAmount.value = '';
        this.elements.incomeDescription.value = '';
        // 日付は今日のままにしておく
    }

    clearRegularIncomeForm() {
        this.elements.regularIncomeAmount.value = '';
        this.elements.regularIncomeMonths.value = '';
        // 開始日は今日のままにしておく
    }

    clearRegularExpenseForm() {
        this.elements.regularExpenseAmount.value = '';
        this.elements.regularExpenseMonths.value = '';
        // 開始日とカテゴリはそのままにしておく
    }

    clearExpenseForm() {
        this.elements.expenseAmount.value = '';
        this.elements.expenseDescription.value = '';
        // 日付とカテゴリはそのままにしておく
    }

    notifyUpdate() {
        // カスタムイベントを発行して他のコンポーネントに更新を通知
        const event = new CustomEvent('financeUpdate', {
            detail: {
                currentAssets: this.financeCalculator.calculateCurrentAssets()
            }
        });
        document.dispatchEvent(event);
    }

    deleteTransaction(transactionId) {
        if (!confirm('この取引を削除しますか？')) return;

        const success = this.storageService.deleteTransaction(transactionId);
        if (success) {
            this.notifyUpdate();
            return true;
        } else {
            alert('削除に失敗しました');
            return false;
        }
    }
}