/**
 * 財務計算を担当するサービス
 */
class FinanceCalculator {
    constructor() {
        this.storageService = new StorageService();
    }

    /**
     * 現在の資産額を計算
     */
    calculateCurrentAssets() {
        const settings = this.storageService.loadSettings();
        const transactions = this.storageService.loadTransactions();
        
        let total = settings.initialAssets || 0;
        
        transactions.forEach(transaction => {
            if (transaction.isScheduled) return; // 予定取引は除外
            
            if (transaction.type === 'income') {
                total += transaction.amount;
            } else if (transaction.type === 'expense') {
                total -= transaction.amount;
            }
        });
        
        return total;
    }

    /**
     * 指定期間の収支を計算
     */
    calculateBalanceForPeriod(startDate, endDate) {
        const transactions = this.storageService.loadTransactions();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let income = 0;
        let expense = 0;
        
        transactions.forEach(transaction => {
            if (transaction.isScheduled) return;
            
            const transactionDate = transaction.date;
            if (transactionDate >= start && transactionDate <= end) {
                if (transaction.type === 'income') {
                    income += transaction.amount;
                } else if (transaction.type === 'expense') {
                    expense += transaction.amount;
                }
            }
        });
        
        return {
            income,
            expense,
            balance: income - expense
        };
    }

    /**
     * 月別の収支データを生成
     */
    generateMonthlyData(months = 12) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - months + 1);
        startDate.setDate(1);
        
        const monthlyData = [];
        
        for (let i = 0; i < months; i++) {
            const monthStart = new Date(startDate);
            monthStart.setMonth(startDate.getMonth() + i);
            
            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0); // 月末
            
            const balance = this.calculateBalanceForPeriod(monthStart, monthEnd);
            
            monthlyData.push({
                month: monthStart.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }),
                date: monthStart,
                ...balance
            });
        }
        
        return monthlyData;
    }

    /**
     * 将来の資産推移を予測（欲しいものの購入を含む）
     */
    predictFutureAssets(days = 365) {
        const currentAssets = this.calculateCurrentAssets();
        const transactions = this.storageService.loadTransactions();
        const wishlist = this.storageService.loadWishlist();
        
        const futureData = [];
        const today = new Date();
        
        // 将来の予定取引を収集
        const futureTransactions = [];
        
        // 購入予定を追加
        wishlist.forEach(item => {
            if (item.plannedPurchaseDate && !item.isPurchased) {
                const transaction = item.createScheduledTransaction();
                if (transaction) {
                    futureTransactions.push(transaction);
                }
            }
        });
        
        // 定期取引を追加（簡略化版）
        transactions.filter(t => t.isRegular).forEach(regularTransaction => {
            // 定期取引の次回実行日を計算して追加
            // 実装を簡略化
        });
        
        // 日ごとの資産計算
        let currentBalance = currentAssets;
        
        for (let i = 0; i <= days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // その日の取引を適用
            futureTransactions.forEach(transaction => {
                const transactionDate = transaction.date.toDateString();
                const currentDate = date.toDateString();
                
                if (transactionDate === currentDate) {
                    if (transaction.type === 'income') {
                        currentBalance += transaction.amount;
                    } else {
                        currentBalance -= transaction.amount;
                    }
                }
            });
            
            // 週単位でデータを保存（データ量を減らすため）
            if (i % 7 === 0) {
                futureData.push({
                    date: new Date(date),
                    assets: currentBalance,
                    label: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
                });
            }
        }
        
        return futureData;
    }

    /**
     * 購入可能性を分析
     */
    analyzePurchaseability(wishlistItems) {
        const currentAssets = this.calculateCurrentAssets();
        const settings = this.storageService.loadSettings();
        const safetyLine = settings.safetyLine || 0;
        
        return wishlistItems.map(item => {
            const analysis = item.getPurchaseability(currentAssets, safetyLine);
            
            return {
                item,
                ...analysis,
                affordableAfterSafety: currentAssets - safetyLine >= item.price,
                daysToAfford: this.calculateDaysToAfford(item.price, currentAssets, safetyLine)
            };
        });
    }

    /**
     * 購入可能になるまでの日数を計算（簡略版）
     */
    calculateDaysToAfford(price, currentAssets, safetyLine) {
        const shortfall = price - (currentAssets - safetyLine);
        if (shortfall <= 0) return 0;
        
        // 直近3ヶ月の平均収支から計算
        const recentBalance = this.calculateBalanceForPeriod(
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            new Date()
        );
        
        const monthlyBalance = recentBalance.balance;
        if (monthlyBalance <= 0) return -1; // 計算不可
        
        const dailyBalance = monthlyBalance / 30;
        return Math.ceil(shortfall / dailyBalance);
    }

    /**
     * カテゴリ別支出分析
     */
    analyzeCategoryExpenses(months = 12) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - months);
        
        const transactions = this.storageService.loadTransactions();
        const categoryData = {};
        
        transactions.forEach(transaction => {
            if (transaction.type !== 'expense' || transaction.isScheduled) return;
            if (transaction.date < startDate || transaction.date > endDate) return;
            
            const category = transaction.category || 'other';
            if (!categoryData[category]) {
                categoryData[category] = {
                    amount: 0,
                    count: 0,
                    name: transaction.getCategoryName() || 'その他'
                };
            }
            
            categoryData[category].amount += transaction.amount;
            categoryData[category].count += 1;
        });
        
        return Object.entries(categoryData).map(([key, data]) => ({
            category: key,
            ...data
        })).sort((a, b) => b.amount - a.amount);
    }
}