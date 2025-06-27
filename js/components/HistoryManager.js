/**
 * 取引履歴表示を担当するコンポーネント
 */
class HistoryManager {
    constructor(storageService, financeCalculator, financeManager) {
        this.storageService = storageService;
        this.financeCalculator = financeCalculator;
        this.financeManager = financeManager;
        
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isCollapsed = true;
        
        this.initializeElements();
        this.bindEvents();
        this.updateSummary();
    }

    initializeElements() {
        this.elements = {
            toggleHistoryBtn: document.getElementById('toggleHistory'),
            historySummary: document.getElementById('historySummary'),
            historyContainer: document.getElementById('historyContainer')
        };
    }

    bindEvents() {
        this.elements.toggleHistoryBtn.addEventListener('click', () => {
            this.toggleHistory();
        });

        // 他のコンポーネントからの更新通知を受信
        document.addEventListener('financeUpdate', () => {
            this.updateSummary();
            if (!this.isCollapsed) {
                this.renderHistory();
            }
        });

        document.addEventListener('wishlistUpdate', () => {
            this.updateSummary();
            if (!this.isCollapsed) {
                this.renderHistory();
            }
        });
    }

    toggleHistory() {
        this.isCollapsed = !this.isCollapsed;
        
        if (this.isCollapsed) {
            this.elements.historyContainer.classList.add('collapsed');
            this.elements.toggleHistoryBtn.innerHTML = '▼';
        } else {
            this.elements.historyContainer.classList.remove('collapsed');
            this.elements.toggleHistoryBtn.innerHTML = '▲';
            this.renderHistory();
        }
    }

    updateSummary() {
        const balance = this.financeCalculator.calculateBalanceForPeriod(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30日前
            new Date()
        );

        const currentAssets = this.financeCalculator.calculateCurrentAssets();

        this.elements.historySummary.innerHTML = `
            <div class="summary-item income">
                <span class="summary-label">月収入:</span>
                <span class="summary-amount">¥${balance.income.toLocaleString()}</span>
            </div>
            <div class="summary-item expense">
                <span class="summary-label">月支出:</span>
                <span class="summary-amount">¥${balance.expense.toLocaleString()}</span>
            </div>
            <div class="summary-item balance ${balance.balance >= 0 ? 'positive' : 'negative'}">
                <span class="summary-label">月収支:</span>
                <span class="summary-amount">${balance.balance >= 0 ? '+' : ''}¥${balance.balance.toLocaleString()}</span>
            </div>
            <div class="summary-item assets">
                <span class="summary-label">現在資産:</span>
                <span class="summary-amount">¥${currentAssets.toLocaleString()}</span>
            </div>
        `;
    }

    renderHistory() {
        const transactions = this.storageService.loadTransactions();
        
        // 日付で降順ソート（最新が上）
        const sortedTransactions = [...transactions]
            .filter(t => !t.isScheduled) // 予定取引は除外
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // ページネーション
        const totalItems = sortedTransactions.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

        // 月別グループ化
        const groupedTransactions = this.groupTransactionsByMonth(currentTransactions);

        let html = `
            <div class="history-pagination">
                <button ${this.currentPage <= 1 ? 'disabled' : ''} 
                        onclick="historyManager.changePage(${this.currentPage - 1})">
                    前へ
                </button>
                <span class="page-info">${this.currentPage} / ${totalPages}</span>
                <button ${this.currentPage >= totalPages ? 'disabled' : ''} 
                        onclick="historyManager.changePage(${this.currentPage + 1})">
                    次へ
                </button>
                <span class="total-info">総取引数: ${totalItems}件</span>
            </div>
        `;

        Object.entries(groupedTransactions).forEach(([monthKey, monthTransactions]) => {
            const monthBalance = this.calculateMonthBalance(monthTransactions);
            
            html += `
                <div class="month-group">
                    <div class="month-header">
                        <h4>${monthKey}</h4>
                        <div class="month-summary">
                            <span class="month-income">収入: ¥${monthBalance.income.toLocaleString()}</span>
                            <span class="month-expense">支出: ¥${monthBalance.expense.toLocaleString()}</span>
                            <span class="month-balance ${monthBalance.balance >= 0 ? 'positive' : 'negative'}">
                                収支: ${monthBalance.balance >= 0 ? '+' : ''}¥${monthBalance.balance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div class="month-transactions">
            `;

            monthTransactions.forEach(transaction => {
                html += this.renderTransactionItem(transaction);
            });

            html += `
                    </div>
                </div>
            `;
        });

        this.elements.historyContainer.innerHTML = html;
    }

    groupTransactionsByMonth(transactions) {
        const grouped = {};
        
        transactions.forEach(transaction => {
            const monthKey = transaction.date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long'
            });
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            
            grouped[monthKey].push(transaction);
        });
        
        return grouped;
    }

    calculateMonthBalance(transactions) {
        let income = 0;
        let expense = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                income += transaction.amount;
            } else if (transaction.type === 'expense') {
                expense += transaction.amount;
            }
        });
        
        return {
            income,
            expense,
            balance: income - expense
        };
    }

    renderTransactionItem(transaction) {
        const isIncome = transaction.type === 'income';
        const scheduledClass = transaction.isScheduled ? 'scheduled-purchase' : '';
        
        return `
            <div class="transaction-item ${transaction.type} ${scheduledClass}">
                <div class="transaction-date">${transaction.getDisplayDate()}</div>
                <div class="transaction-info">
                    <div class="transaction-description">
                        ${transaction.description}
                        ${transaction.category ? `<span class="transaction-category">(${transaction.getCategoryName()})</span>` : ''}
                        ${transaction.isRegular ? '<span class="regular-badge">定期</span>' : ''}
                        ${transaction.isScheduled ? '<span class="scheduled-badge">予定</span>' : ''}
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.getAmountDisplay()}
                    </div>
                </div>
                <div class="transaction-actions">
                    <button class="delete-btn" 
                            onclick="historyManager.deleteTransaction('${transaction.id}')">
                        ×
                    </button>
                </div>
            </div>
        `;
    }

    changePage(newPage) {
        const transactions = this.storageService.loadTransactions();
        const totalPages = Math.ceil(transactions.length / this.itemsPerPage);
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderHistory();
        }
    }

    deleteTransaction(transactionId) {
        const success = this.financeManager.deleteTransaction(transactionId);
        if (success) {
            this.renderHistory();
            this.updateSummary();
        }
    }

    // 外部から呼び出される更新メソッド
    refresh() {
        this.updateSummary();
        if (!this.isCollapsed) {
            this.renderHistory();
        }
    }
}