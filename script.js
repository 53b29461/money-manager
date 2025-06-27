class MoneyManager {
    constructor() {
        this.wishlistItems = [];
        this.incomeData = [];
        this.regularIncomeSettings = []; // 複数の定期収入設定を保持
        this.expenseData = []; // 支出データ
        this.regularExpenseSettings = []; // 複数の定期支出設定を保持
        this.currentBalance = 0;
        this.assetChart = null; // Chart.jsのインスタンス
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.allTransactions = [];
        this.initialAssets = 0; // 初期資産額
        this.safetyLine = null; // セーフティーライン
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.setDefaultStartMonth();
        this.render();
    }

    setDefaultStartMonth() {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1ベースに変換
        const defaultMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        document.getElementById('regularIncomeStartMonth').value = defaultMonth;
        document.getElementById('regularExpenseStartMonth').value = defaultMonth;
    }

    bindEvents() {
        // 欲しいもの追加
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.addWishlistItem();
        });

        // 収入追加
        document.getElementById('addIncomeBtn').addEventListener('click', () => {
            this.addIncome();
        });

        // 定期収入生成
        document.getElementById('generateRegularIncomeBtn').addEventListener('click', () => {
            this.generateRegularIncome();
        });

        document.getElementById('updateRegularIncomeBtn').addEventListener('click', () => {
            this.updateRegularIncome();
        });

        document.getElementById('cancelEditIncomeBtn').addEventListener('click', () => {
            this.cancelEditIncome();
        });

        // 支出追加
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.addExpense();
        });

        // 定期支出生成
        document.getElementById('generateRegularExpenseBtn').addEventListener('click', () => {
            this.generateRegularExpense();
        });

        document.getElementById('updateRegularExpenseBtn').addEventListener('click', () => {
            this.updateRegularExpense();
        });

        document.getElementById('cancelEditExpenseBtn').addEventListener('click', () => {
            this.cancelEditExpense();
        });

        // グラフ更新
        document.getElementById('updateChartBtn').addEventListener('click', () => {
            this.updateChart();
        });

        // セーフティーライン設定
        document.getElementById('setSafetyLineBtn').addEventListener('click', () => {
            this.setSafetyLine();
        });

        document.getElementById('clearSafetyLineBtn').addEventListener('click', () => {
            this.clearSafetyLine();
        });

        document.getElementById('safetyLineAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setSafetyLine();
        });

        // 期間選択変更時
        document.getElementById('chartPeriod').addEventListener('change', () => {
            this.updateChart();
        });

        // 履歴表示切り替え
        document.getElementById('toggleHistoryBtn').addEventListener('click', () => {
            this.toggleTransactionHistory();
        });

        // ページネーション関連のイベント
        document.getElementById('itemsPerPage').addEventListener('change', (e) => {
            this.itemsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTransactionHistory();
        });

        document.getElementById('prevPageBtn').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTransactionHistory();
            }
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            const totalPages = this.getTotalPages();
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderTransactionHistory();
            }
        });

        // 資産額設定
        document.getElementById('setAssetsBtn').addEventListener('click', () => {
            this.setInitialAssets();
        });

        document.getElementById('currentAssets').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setInitialAssets();
        });

        // エンターキーでの追加
        document.getElementById('itemName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWishlistItem();
        });

        document.getElementById('itemPrice').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWishlistItem();
        });

        document.getElementById('incomeAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addIncome();
        });

        document.getElementById('regularIncomeAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateRegularIncome();
        });

        document.getElementById('expenseAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });

        document.getElementById('regularExpenseAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateRegularExpense();
        });
    }

    addWishlistItem() {
        const name = document.getElementById('itemName').value.trim();
        const price = parseInt(document.getElementById('itemPrice').value);

        if (!name || !price || price <= 0) {
            alert('商品名と正しい価格を入力してください');
            return;
        }

        // 新しいアイテムは最下位に追加
        const maxPriority = this.wishlistItems.length > 0 
            ? Math.max(...this.wishlistItems.map(item => item.priority)) 
            : 0;

        const item = {
            id: Date.now(),
            name: name,
            price: price,
            priority: maxPriority + 1,
            purchased: false
        };

        this.wishlistItems.push(item);
        this.sortItemsByPriority();
        this.saveData();
        this.render();

        // フォームをクリア
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
    }

    addIncome() {
        const date = document.getElementById('incomeDate').value;
        const amount = parseInt(document.getElementById('incomeAmount').value);

        if (!date || !amount || amount <= 0) {
            alert('日付と正しい金額を入力してください');
            return;
        }

        const income = {
            id: Date.now(),
            date: date,
            amount: amount
        };

        this.incomeData.push(income);
        this.incomeData.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        this.render();

        // フォームをクリア
        document.getElementById('incomeDate').value = '';
        document.getElementById('incomeAmount').value = '';
    }

    generateRegularIncome() {
        const startMonth = document.getElementById('regularIncomeStartMonth').value;
        const day = parseInt(document.getElementById('regularIncomeDay').value);
        const amount = parseInt(document.getElementById('regularIncomeAmount').value);
        const months = parseInt(document.getElementById('regularIncomeMonths').value);

        if (!startMonth || !day || !amount || !months || day < 1 || day > 31 || amount <= 0 || months < 1) {
            alert('正しい値を入力してください（開始月、給料日: 1-31, 金額: 正の数, 月数: 1以上）');
            return;
        }

        // 開始月を解析
        const [startYear, startMonthNum] = startMonth.split('-').map(num => parseInt(num));
        const startMonthIndex = startMonthNum - 1; // JavaScriptの月は0ベース

        // 同じ期間の設定が既に存在するかチェック
        const endDate = new Date(startYear, startMonthIndex + months - 1);
        const conflictingSetting = this.regularIncomeSettings.find(setting => {
            const existingStart = new Date(setting.startMonth + '-01');
            const existingEnd = new Date(setting.startYear, existingStart.getMonth() + setting.months - 1);
            const newStart = new Date(startYear, startMonthIndex);
            
            // 期間が重複しているかチェック
            return (newStart <= existingEnd && endDate >= existingStart);
        });

        if (conflictingSetting) {
            const overwrite = confirm(`${conflictingSetting.startMonth}からの設定と期間が重複しています。\n重複する期間の設定を上書きしますか？`);
            if (!overwrite) return;
            
            // 重複する設定のデータを削除
            this.incomeData = this.incomeData.filter(income => 
                !income.isRegular || income.settingId !== conflictingSetting.id
            );
            
            // 重複する設定を削除
            this.regularIncomeSettings = this.regularIncomeSettings.filter(
                setting => setting.id !== conflictingSetting.id
            );
        }

        // 新しい定期収入設定を作成
        const newSetting = {
            id: Date.now(),
            startMonth: startMonth,
            startYear: startYear,
            day: day,
            amount: amount,
            months: months
        };

        this.regularIncomeSettings.push(newSetting);

        // 指定された月数分の収入データを生成
        const today = new Date();
        
        for (let i = 0; i < months; i++) {
            const incomeDate = new Date(startYear, startMonthIndex + i, day);
            
            // 過去の日付は生成しない
            if (incomeDate >= today) {
                const income = {
                    id: Date.now() + i, // 重複を避けるためにiを追加
                    date: incomeDate.toISOString().split('T')[0], // YYYY-MM-DD形式
                    amount: amount,
                    isRegular: true,
                    settingId: newSetting.id // どの設定から生成されたかを記録
                };
                this.incomeData.push(income);
            }
        }

        this.incomeData.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        this.render();
        this.updateRegularIncomeInfo();

        // フォームをクリア（開始月以外）
        document.getElementById('regularIncomeAmount').value = '';
    }

    updateRegularIncomeInfo() {
        const infoElement = document.getElementById('regularIncomeInfo');
        if (this.regularIncomeSettings.length > 0) {
            let html = '<div class="regular-income-list">';
            
            this.regularIncomeSettings.forEach(setting => {
                const startDate = new Date(setting.startMonth + '-01');
                const startMonthText = startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                const endMonth = new Date(setting.startYear, startDate.getMonth() + setting.months - 1);
                const endMonthText = endMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                const incomeCount = this.incomeData.filter(income => income.settingId === setting.id).length;
                
                html += `
                    <div class="regular-income-item">
                        <p><strong>${startMonthText}〜${endMonthText}:</strong> 毎月${setting.day}日に¥${setting.amount.toLocaleString()}</p>
                        <p><small>生成済み: ${incomeCount}/${setting.months}件</small></p>
                        <div class="item-actions">
                            <button class="edit-btn" onclick="moneyManager.editRegularIncomeSetting('${setting.id}')">編集</button>
                            <button class="delete-btn" onclick="moneyManager.clearRegularIncomeSetting('${setting.id}')">削除</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            html += '<button onclick="moneyManager.clearAllRegularIncome()" style="background-color: #6c757d; font-size: 12px; padding: 5px 10px; margin-top: 10px;">全ての定期収入をクリア</button>';
            
            infoElement.innerHTML = html;
        } else {
            infoElement.innerHTML = '<p>定期収入が設定されていません</p>';
        }
    }

    clearRegularIncomeSetting(settingId) {
        const setting = this.regularIncomeSettings.find(s => s.id === parseInt(settingId));
        if (!setting) return;
        
        const startDate = new Date(setting.startMonth + '-01');
        const startMonthText = startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
        
        if (confirm(`${startMonthText}からの定期収入設定を削除しますか？`)) {
            // 該当する収入データを削除
            this.incomeData = this.incomeData.filter(income => 
                !income.isRegular || income.settingId !== parseInt(settingId)
            );
            
            // 設定を削除
            this.regularIncomeSettings = this.regularIncomeSettings.filter(
                setting => setting.id !== parseInt(settingId)
            );
            
            this.saveData();
            this.render();
        }
    }

    clearAllRegularIncome() {
        if (confirm('全ての定期収入設定とデータを削除しますか？')) {
            this.regularIncomeSettings = [];
            this.incomeData = this.incomeData.filter(income => !income.isRegular);
            this.saveData();
            this.render();
        }
    }

    // 支出管理メソッド
    addExpense() {
        const date = document.getElementById('expenseDate').value;
        const category = document.getElementById('expenseCategory').value;
        const description = document.getElementById('expenseDescription').value.trim();
        const amount = parseInt(document.getElementById('expenseAmount').value);

        if (!date || !amount || amount <= 0) {
            alert('日付と正しい金額を入力してください');
            return;
        }

        const expense = {
            id: Date.now(),
            date: date,
            category: category,
            description: description || this.getCategoryName(category),
            amount: amount
        };

        this.expenseData.push(expense);
        this.expenseData.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        this.render();

        // フォームをクリア
        document.getElementById('expenseDate').value = '';
        document.getElementById('expenseDescription').value = '';
        document.getElementById('expenseAmount').value = '';
    }

    generateRegularExpense() {
        const startMonth = document.getElementById('regularExpenseStartMonth').value;
        const day = parseInt(document.getElementById('regularExpenseDay').value);
        const category = document.getElementById('regularExpenseCategory').value;
        const amount = parseInt(document.getElementById('regularExpenseAmount').value);
        const months = parseInt(document.getElementById('regularExpenseMonths').value);

        if (!startMonth || !day || !amount || !months || day < 1 || day > 31 || amount <= 0 || months < 1) {
            alert('正しい値を入力してください（開始月、支出日: 1-31, 金額: 正の数, 月数: 1以上）');
            return;
        }

        // 開始月を解析
        const [startYear, startMonthNum] = startMonth.split('-').map(num => parseInt(num));
        const startMonthIndex = startMonthNum - 1; // JavaScriptの月は0ベース

        // 同じカテゴリ・期間の設定が既に存在するかチェック
        const endDate = new Date(startYear, startMonthIndex + months - 1);
        const conflictingSetting = this.regularExpenseSettings.find(setting => {
            const existingStart = new Date(setting.startMonth + '-01');
            const existingEnd = new Date(setting.startYear, existingStart.getMonth() + setting.months - 1);
            const newStart = new Date(startYear, startMonthIndex);
            
            // 同じカテゴリで期間が重複しているかチェック
            return setting.category === category && (newStart <= existingEnd && endDate >= existingStart);
        });

        if (conflictingSetting) {
            const overwrite = confirm(`${this.getCategoryName(category)}の${conflictingSetting.startMonth}からの設定と期間が重複しています。\n重複する期間の設定を上書きしますか？`);
            if (!overwrite) return;
            
            // 重複する設定のデータを削除
            this.expenseData = this.expenseData.filter(expense => 
                !expense.isRegular || expense.settingId !== conflictingSetting.id
            );
            
            // 重複する設定を削除
            this.regularExpenseSettings = this.regularExpenseSettings.filter(
                setting => setting.id !== conflictingSetting.id
            );
        }

        // 新しい定期支出設定を作成
        const newSetting = {
            id: Date.now(),
            startMonth: startMonth,
            startYear: startYear,
            day: day,
            category: category,
            amount: amount,
            months: months
        };

        this.regularExpenseSettings.push(newSetting);

        // 指定された月数分の支出データを生成
        const today = new Date();
        
        for (let i = 0; i < months; i++) {
            const expenseDate = new Date(startYear, startMonthIndex + i, day);
            
            // 過去の日付は生成しない
            if (expenseDate >= today) {
                const expense = {
                    id: Date.now() + i, // 重複を避けるためにiを追加
                    date: expenseDate.toISOString().split('T')[0], // YYYY-MM-DD形式
                    category: category,
                    description: this.getCategoryName(category),
                    amount: amount,
                    isRegular: true,
                    settingId: newSetting.id // どの設定から生成されたかを記録
                };
                this.expenseData.push(expense);
            }
        }

        this.expenseData.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        this.render();
        this.updateRegularExpenseInfo();

        // フォームをクリア（開始月以外）
        document.getElementById('regularExpenseAmount').value = '';
    }

    updateRegularExpenseInfo() {
        const infoElement = document.getElementById('regularExpenseInfo');
        if (this.regularExpenseSettings.length > 0) {
            let html = '<div class="regular-expense-list">';
            
            this.regularExpenseSettings.forEach(setting => {
                const startDate = new Date(setting.startMonth + '-01');
                const startMonthText = startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                const endMonth = new Date(setting.startYear, startDate.getMonth() + setting.months - 1);
                const endMonthText = endMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
                const expenseCount = this.expenseData.filter(expense => expense.settingId === setting.id).length;
                
                html += `
                    <div class="regular-expense-item">
                        <p><strong>${this.getCategoryName(setting.category)} (${startMonthText}〜${endMonthText}):</strong> 毎月${setting.day}日に¥${setting.amount.toLocaleString()}</p>
                        <p><small>生成済み: ${expenseCount}/${setting.months}件</small></p>
                        <div class="item-actions">
                            <button class="edit-btn" onclick="moneyManager.editRegularExpenseSetting('${setting.id}')">編集</button>
                            <button class="delete-btn" onclick="moneyManager.clearRegularExpenseSetting('${setting.id}')">削除</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            html += '<button onclick="moneyManager.clearAllRegularExpense()" style="background-color: #6c757d; font-size: 12px; padding: 5px 10px; margin-top: 10px;">全ての定期支出をクリア</button>';
            
            infoElement.innerHTML = html;
        } else {
            infoElement.innerHTML = '<p>定期支出が設定されていません</p>';
        }
    }

    clearRegularExpenseSetting(settingId) {
        const setting = this.regularExpenseSettings.find(s => s.id === parseInt(settingId));
        if (!setting) return;
        
        const startDate = new Date(setting.startMonth + '-01');
        const startMonthText = startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
        
        if (confirm(`${this.getCategoryName(setting.category)}の${startMonthText}からの定期支出設定を削除しますか？`)) {
            // 該当する支出データを削除
            this.expenseData = this.expenseData.filter(expense => 
                !expense.isRegular || expense.settingId !== parseInt(settingId)
            );
            
            // 設定を削除
            this.regularExpenseSettings = this.regularExpenseSettings.filter(
                setting => setting.id !== parseInt(settingId)
            );
            
            this.saveData();
            this.render();
        }
    }

    clearAllRegularExpense() {
        if (confirm('全ての定期支出設定とデータを削除しますか？')) {
            this.regularExpenseSettings = [];
            this.expenseData = this.expenseData.filter(expense => !expense.isRegular);
            this.saveData();
            this.render();
        }
    }

    deleteExpense(expenseId) {
        this.expenseData = this.expenseData.filter(expense => expense.id !== expenseId);
        this.saveData();
        this.render();
    }

    getCategoryName(category) {
        const categories = {
            'food': '食費',
            'communication': '通信費',
            'clothing': '服飾費',
            'utilities': '光熱費',
            'subscription': 'サブスク費',
            'entertainment': '交際費',
            'other': 'その他'
        };
        return categories[category] || category;
    }

    // 月の平均収支を計算
    calculateMonthlyAverage() {
        // 過去12ヶ月分のデータを取得
        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(today.getMonth() - 12);
        
        // 月ごとの収支を集計
        const monthlyData = {};
        
        // 収入データを月ごとに集計
        this.incomeData.forEach(income => {
            const date = new Date(income.date + 'T00:00:00');
            if (date >= twelveMonthsAgo && date <= today) {
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expense: 0 };
                }
                monthlyData[monthKey].income += income.amount;
            }
        });
        
        // 支出データを月ごとに集計
        this.expenseData.forEach(expense => {
            const date = new Date(expense.date + 'T00:00:00');
            if (date >= twelveMonthsAgo && date <= today) {
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { income: 0, expense: 0 };
                }
                monthlyData[monthKey].expense += expense.amount;
            }
        });
        
        // 月別収支を計算
        const monthlyBalances = Object.keys(monthlyData).map(monthKey => {
            const data = monthlyData[monthKey];
            return data.income - data.expense;
        });
        
        // 平均収支を計算
        if (monthlyBalances.length === 0) {
            return {
                averageBalance: 0,
                totalMonths: 0,
                positiveMonths: 0,
                negativeMonths: 0,
                monthlyData: {}
            };
        }
        
        const averageBalance = monthlyBalances.reduce((sum, balance) => sum + balance, 0) / monthlyBalances.length;
        const positiveMonths = monthlyBalances.filter(balance => balance > 0).length;
        const negativeMonths = monthlyBalances.filter(balance => balance < 0).length;
        
        return {
            averageBalance: Math.round(averageBalance),
            totalMonths: monthlyBalances.length,
            positiveMonths: positiveMonths,
            negativeMonths: negativeMonths,
            monthlyData: monthlyData
        };
    }

    // 初期資産額設定メソッド
    setInitialAssets() {
        const assetInput = document.getElementById('currentAssets');
        const amount = parseInt(assetInput.value);

        if (!amount || amount < 0) {
            alert('正しい資産額を入力してください');
            return;
        }

        this.initialAssets = amount;
        
        // 初期資産額を収支履歴に初期設定として記録
        const initialAssetRecord = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            amount: amount,
            description: '初期資産額設定'
        };
        
        // 既存の初期資産額設定を削除してから新しいものを追加
        this.incomeData = this.incomeData.filter(income => income.description !== '初期資産額設定');
        this.incomeData.push(initialAssetRecord);
        
        this.saveData();
        this.render();

        // フォームをクリア
        assetInput.value = '';
    }

    updateAssetsDisplay() {
        // 資産額表示要素が削除されたため、処理はスキップ
        // 初期資産額は収支履歴に反映される
    }

    // 資産推移計算メソッド
    calculateAssetProgression(months = 6) {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1); // 1ヶ月前から開始
        
        const endDate = new Date(today);
        endDate.setMonth(today.getMonth() + months);

        // 全取引を日付順に統合
        const allTransactions = [];
        
        // 収入を追加
        this.incomeData.forEach(income => {
            const date = new Date(income.date + 'T00:00:00');
            if (date >= startDate && date <= endDate) {
                allTransactions.push({
                    date: date,
                    amount: income.amount,
                    type: 'income',
                    description: '収入'
                });
            }
        });
        
        // 支出を追加
        this.expenseData.forEach(expense => {
            const date = new Date(expense.date + 'T00:00:00');
            if (date >= startDate && date <= endDate) {
                allTransactions.push({
                    date: date,
                    amount: -expense.amount,
                    type: 'expense',
                    description: this.getCategoryName(expense.category)
                });
            }
        });

        // 日付順にソート
        allTransactions.sort((a, b) => a.date - b.date);

        // 日別の資産推移を計算
        const assetData = [];
        let currentBalance = this.initialAssets; // 初期資産額から開始
        let currentDate = new Date(startDate);
        let transactionIndex = 0;

        // 開始時点のデータを追加
        assetData.push({
            date: new Date(currentDate),
            balance: currentBalance,
            transactions: []
        });

        // 週ごとにデータを集計
        while (currentDate <= endDate) {
            const weekTransactions = [];
            let weekAmount = 0;
            const weekStart = new Date(currentDate);
            
            // 1週間分の取引を処理
            for (let day = 0; day < 7 && currentDate <= endDate; day++) {
                const dayTransactions = [];
                
                // その日の取引を処理
                while (transactionIndex < allTransactions.length && 
                       this.isSameDay(allTransactions[transactionIndex].date, currentDate)) {
                    const transaction = allTransactions[transactionIndex];
                    dayTransactions.push(transaction);
                    weekTransactions.push(transaction);
                    weekAmount += transaction.amount;
                    transactionIndex++;
                }
                
                // 次の日へ
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // 取引があった場合は残高を更新
            if (weekTransactions.length > 0) {
                currentBalance += weekAmount;
            }

            // 週のデータを追加（1週間1目盛り対応）
            assetData.push({
                date: new Date(weekStart),
                balance: currentBalance,
                transactions: weekTransactions,
                hasPurchase: weekTransactions.some(t => t.type === 'expense' && t.description && t.description.includes('欲しいもの購入'))
            });
        }

        return assetData;
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    updateChart() {
        const months = parseInt(document.getElementById('chartPeriod').value);
        const assetData = this.calculateAssetProgression(months);
        
        if (assetData.length === 0) {
            return;
        }

        const ctx = document.getElementById('assetChart').getContext('2d');
        
        // 既存のチャートを破棄
        if (this.assetChart) {
            this.assetChart.destroy();
        }

        // 週ラベル（1週間1目盛り）
        const labels = assetData.map(data => {
            const weekStart = data.date;
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${weekStart.getMonth() + 1}/${weekStart.getDate()}~${weekEnd.getDate()}`;
        });
        const balances = assetData.map(data => data.balance);

        // 購入タイミングのマーカーデータを準備
        const purchaseMarkers = assetData.map(data => {
            return data.hasPurchase ? data.balance : null;
        });

        // データセットを準備
        const datasets = [
            {
                label: '資産残高',
                data: balances,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.2,
                pointRadius: 2,
                pointHoverRadius: 4,
                yAxisID: 'y'
            },
            {
                label: '購入タイミング',
                data: purchaseMarkers,
                borderColor: '#e74c3c',
                backgroundColor: '#e74c3c',
                borderWidth: 0,
                fill: false,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointStyle: 'triangle',
                showLine: false,
                yAxisID: 'y'
            }
        ];

        // セーフティーラインが設定されている場合は追加
        if (this.safetyLine !== null) {
            datasets.push({
                label: 'セーフティーライン',
                data: new Array(labels.length).fill(this.safetyLine),
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
                yAxisID: 'y'
            });
        }

        this.assetChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '週'
                        },
                        ticks: {
                            maxTicksLimit: 12, // 最大12週分のラベル
                            callback: function(value, index, values) {
                                // 2週間ごとに表示
                                if (index % 2 === 0) {
                                    return labels[index];
                                }
                                return '';
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '資産残高 (¥)',
                            color: '#007bff'
                        },
                        ticks: {
                            color: '#007bff',
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '資産推移グラフ'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                if (value !== null) {
                                    return context.dataset.label + ': ¥' + value.toLocaleString();
                                }
                                return null;
                            },
                            afterBody: function(tooltipItems) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                const dayData = assetData[dataIndex];
                                if (dayData && dayData.transactions.length > 0) {
                                    let details = '\n詳細:\n';
                                    dayData.transactions.forEach(t => {
                                        const amount = t.type === 'income' ? '+¥' : '-¥';
                                        details += `${t.description}: ${amount}${Math.abs(t.amount).toLocaleString()}\n`;
                                    });
                                    return details;
                                }
                                return null;
                            }
                        }
                    }
                }
            }
        });
    }

    sortItemsByPriority() {
        // 優先度の重複を解決し、連続した順序に正規化
        this.wishlistItems.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority; // 優先度が小さい順（1位が最優先）
            }
            return a.id - b.id; // 同じ優先度なら追加順
        });
        
        // 優先度を1から連続した数値に再設定
        this.wishlistItems.forEach((item, index) => {
            item.priority = index + 1;
        });
    }

    changePriority(itemId, direction) {
        const item = this.wishlistItems.find(i => i.id === itemId);
        if (!item) return;

        const currentIndex = this.wishlistItems.findIndex(i => i.id === itemId);
        
        if (direction === 'up' && currentIndex > 0) {
            // 上のアイテムと位置を交換
            const upperItem = this.wishlistItems[currentIndex - 1];
            [item.priority, upperItem.priority] = [upperItem.priority, item.priority];
        } else if (direction === 'down' && currentIndex < this.wishlistItems.length - 1) {
            // 下のアイテムと位置を交換
            const lowerItem = this.wishlistItems[currentIndex + 1];
            [item.priority, lowerItem.priority] = [lowerItem.priority, item.priority];
        }

        this.sortItemsByPriority();
        this.saveData();
        
        // 優先度変更後に購入計画を再計算
        this.recalculatePurchasePlan();
        
        this.render();
    }

    deleteItem(itemId) {
        this.wishlistItems = this.wishlistItems.filter(item => item.id !== itemId);
        this.saveData();
        this.render();
    }

    // 欲しいもの購入機能
    purchaseItem(itemId, purchaseDate) {
        const item = this.wishlistItems.find(item => item.id === itemId);
        if (!item) {
            alert('アイテムが見つかりません');
            return;
        }

        if (item.purchased) {
            alert('このアイテムは既に購入済みです');
            return;
        }

        // 購入確認
        const confirmMessage = `${item.name}（¥${item.price.toLocaleString()}）を${purchaseDate}に購入しますか？\n\n支出データに自動で追加され、グラフにも反映されます。`;
        if (!confirm(confirmMessage)) {
            return;
        }

        // アイテムを購入済みにマーク
        item.purchased = true;
        item.purchaseDate = purchaseDate;

        // 支出データに追加
        const expense = {
            id: Date.now(),
            date: purchaseDate,
            category: 'other',
            description: `${item.name}（欲しいもの購入）`,
            amount: item.price,
            fromWishlist: true,
            wishlistItemId: itemId
        };

        this.expenseData.push(expense);
        this.expenseData.sort((a, b) => new Date(a.date) - new Date(b.date));

        this.saveData();
        this.render();
        
        alert(`${item.name}を購入しました！\n支出データに追加され、グラフに反映されます。`);
    }

    deleteIncome(incomeId) {
        this.incomeData = this.incomeData.filter(income => income.id !== incomeId);
        this.saveData();
        this.render();
    }

    calculatePurchaseTimeline() {
        return this.calculateGanttTimeline();
    }

    calculateGanttTimeline() {
        const safetyLine = this.safetyLine || 0;
        const ganttData = [];
        
        // 収入データから給料日を特定（定期収入から）
        const salaryDates = this.getSalaryDates();
        
        // 期間設定（今日から6ヶ月後まで）
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 6);
        
        // 優先度順に厳密にソートしてから未購入アイテムをフィルタ
        const sortedItems = [...this.wishlistItems]
            .filter(item => !item.purchased)
            .sort((a, b) => a.priority - b.priority);
        
        // 現在の資産額を計算（購入予定も考慮した仮想残高）
        let virtualBalance = this.calculateCurrentBalance();
        
        // 優先度順に1つずつ購入予定日を決定
        for (let itemIndex = 0; itemIndex < sortedItems.length; itemIndex++) {
            const item = sortedItems[itemIndex];
            const purchaseResult = this.findPurchaseDate(item, virtualBalance, safetyLine, salaryDates, today);
            
            if (purchaseResult.date) {
                ganttData.push({
                    item: item,
                    rank: itemIndex + 1,
                    startDate: purchaseResult.date,
                    endDate: endDate, // 購入期間は購入日のみ（単日）
                    price: item.price,
                    safetyStatus: 'safe',
                    balanceAfter: purchaseResult.balanceAfter,
                    salaryWait: purchaseResult.waitedForSalary
                });
                
                // このアイテムを購入したものとして仮想残高を更新
                virtualBalance = purchaseResult.balanceAfter;
            } else {
                // 購入不可能
                ganttData.push({
                    item: item,
                    rank: itemIndex + 1,
                    startDate: null,
                    endDate: null,
                    price: item.price,
                    safetyStatus: 'impossible',
                    balanceAfter: null
                });
            }
        }
        
        return ganttData;
    }

    // 給料日一覧を取得
    getSalaryDates() {
        const salaryDates = [];
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 6);
        
        // 定期収入の設定から給料日を計算
        this.regularIncomeSettings.forEach(setting => {
            const [startYear, startMonth] = setting.startMonth.split('-').map(Number);
            
            for (let monthOffset = 0; monthOffset <= 6; monthOffset++) {
                const salaryDate = new Date(startYear, startMonth - 1 + monthOffset, setting.day);
                if (salaryDate >= today && salaryDate <= endDate) {
                    salaryDates.push({
                        date: salaryDate,
                        amount: setting.amount
                    });
                }
            }
        });
        
        return salaryDates.sort((a, b) => a.date - b.date);
    }
    
    // 現在の資産額を計算
    calculateCurrentBalance() {
        const totalIncome = this.incomeData.reduce((sum, income) => sum + income.amount, 0);
        const totalExpense = this.expenseData.reduce((sum, expense) => sum + expense.amount, 0);
        return this.initialAssets + totalIncome - totalExpense;
    }
    
    // 新しい購入ルールに従った購入予定日計算
    findPurchaseDate(item, currentBalance, safetyLine, salaryDates, startDate) {
        // 余剰お金の計算（現在の資産額 - セーフティーライン）
        const surplusMoney = currentBalance - safetyLine;
        
        // 余剰お金でアイテムが買えるかチェック
        if (surplusMoney >= item.price) {
            return {
                date: new Date(startDate),
                balanceAfter: currentBalance - item.price,
                waitedForSalary: false
            };
        }
        
        // 買えない場合、次の給料日を待つ
        for (let salaryInfo of salaryDates) {
            if (salaryInfo.date <= startDate) continue;
            
            // 給料日時点での資産額を計算
            const balanceOnSalaryDate = currentBalance + salaryInfo.amount;
            const surplusOnSalaryDate = balanceOnSalaryDate - safetyLine;
            
            if (surplusOnSalaryDate >= item.price) {
                return {
                    date: new Date(salaryInfo.date),
                    balanceAfter: balanceOnSalaryDate - item.price,
                    waitedForSalary: true
                };
            }
            
            // この給料でも買えない場合、次の給料を待つために残高を更新
            currentBalance = balanceOnSalaryDate;
        }
        
        return { date: null }; // 購入不可能
    }

    getPriorityText(priority) {
        return `${priority}位`;
    }

    getPriorityClass(priority) {
        if (priority <= 5) return 'priority-high';
        if (priority <= 15) return 'priority-medium';
        return 'priority-low';
    }

    render() {
        this.renderTimeline();
        this.updateRegularIncomeInfo();
        this.updateRegularExpenseInfo();
        this.updateChart();
        this.updateTransactionHistorySummary();
        this.updateAssetsDisplay();
        this.renderMonthlyAverage();
    }

    updateTransactionHistorySummary() {
        const summaryContainer = document.getElementById('historySummary');
        
        // 更新ボタンのイベントリスナーを設定
        const updateBtn = document.getElementById('updateTransactionHistoryBtn');
        if (updateBtn) {
            updateBtn.onclick = () => {
                this.updateTransactionHistorySummary();
                this.renderTransactionHistory();
                this.updateAssetsDisplay();
            };
        }
        
        // サマリー情報を計算
        const totalIncome = this.incomeData.reduce((sum, income) => sum + income.amount, 0);
        const totalExpense = this.expenseData.reduce((sum, expense) => sum + expense.amount, 0);
        const balance = totalIncome - totalExpense;

        // サマリー表示
        summaryContainer.innerHTML = `
            <div class="summary-item income">
                <span class="summary-label">総収入:</span>
                <span class="summary-amount">+¥${totalIncome.toLocaleString()}</span>
            </div>
            <div class="summary-item expense">
                <span class="summary-label">総支出:</span>
                <span class="summary-amount">-¥${totalExpense.toLocaleString()}</span>
            </div>
            <div class="summary-item balance ${balance >= 0 ? 'positive' : 'negative'}">
                <span class="summary-label">残高:</span>
                <span class="summary-amount">${balance >= 0 ? '+' : ''}¥${balance.toLocaleString()}</span>
            </div>
        `;
    }


    renderIncome() {
        const container = document.getElementById('incomeList');
        container.innerHTML = '';

        this.incomeData.forEach(income => {
            const incomeElement = document.createElement('div');
            incomeElement.className = 'income-item';
            
            const date = new Date(income.date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('ja-JP');
            
            incomeElement.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${formattedDate}</div>
                    <div class="item-details">¥${income.amount.toLocaleString()}</div>
                </div>
                <div class="item-actions">
                    <button class="delete-btn" onclick="moneyManager.deleteIncome(${income.id})">削除</button>
                </div>
            `;
            
            container.appendChild(incomeElement);
        });
    }

    renderExpense() {
        const container = document.getElementById('expenseList');
        container.innerHTML = '';

        this.expenseData.forEach(expense => {
            const expenseElement = document.createElement('div');
            expenseElement.className = 'expense-item';
            
            const date = new Date(expense.date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('ja-JP');
            
            expenseElement.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${formattedDate} - ${expense.description}</div>
                    <div class="item-details">¥${expense.amount.toLocaleString()} (${this.getCategoryName(expense.category)})</div>
                </div>
                <div class="item-actions">
                    <button class="delete-btn" onclick="moneyManager.deleteExpense(${expense.id})">削除</button>
                </div>
            `;
            
            container.appendChild(expenseElement);
        });
    }

    // 収支統合履歴表示メソッド
    renderTransactionHistory() {
        const container = document.getElementById('transactionContent');
        
        // 全取引を統合して時系列でソート
        this.allTransactions = [];
        
        // 収入を追加
        this.incomeData.forEach(income => {
            this.allTransactions.push({
                id: `income_${income.id}`,
                date: new Date(income.date + 'T00:00:00'),
                type: 'income',
                amount: income.amount,
                description: income.description || '収入',
                category: '',
                isRegular: income.isRegular || false
            });
        });
        
        // 支出を追加
        this.expenseData.forEach(expense => {
            this.allTransactions.push({
                id: `expense_${expense.id}`,
                date: new Date(expense.date + 'T00:00:00'),
                type: 'expense',
                amount: expense.amount,
                description: expense.description,
                category: expense.category,
                isRegular: expense.isRegular || false
            });
        });

        // 日付順でソート（古い順）
        this.allTransactions.sort((a, b) => a.date - b.date);

        // 履歴が空の場合
        if (this.allTransactions.length === 0) {
            container.innerHTML = '<div class="empty-history">取引履歴がありません</div>';
            this.updatePaginationInfo();
            return;
        }

        // ページネーションに基づいて表示する取引を決定
        let displayTransactions = this.allTransactions;
        if (this.itemsPerPage !== 'all') {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            displayTransactions = this.allTransactions.slice(startIndex, endIndex);
        }

        // 月ごとにグループ化
        const monthlyGroups = {};
        displayTransactions.forEach(transaction => {
            const monthKey = transaction.date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
            if (!monthlyGroups[monthKey]) {
                monthlyGroups[monthKey] = [];
            }
            monthlyGroups[monthKey].push(transaction);
        });

        // 履歴表示
        let html = '';
        Object.keys(monthlyGroups).forEach(month => {
            const monthTransactions = monthlyGroups[month];
            const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const monthBalance = monthIncome - monthExpense;

            html += `
                <div class="month-group">
                    <div class="month-header">
                        <h4>${month}</h4>
                        <div class="month-summary">
                            <span class="month-income">+¥${monthIncome.toLocaleString()}</span>
                            <span class="month-expense">-¥${monthExpense.toLocaleString()}</span>
                            <span class="month-balance ${monthBalance >= 0 ? 'positive' : 'negative'}">${monthBalance >= 0 ? '+' : ''}¥${monthBalance.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="month-transactions">
            `;

            monthTransactions.forEach(transaction => {
                const isIncome = transaction.type === 'income';
                const formattedDate = transaction.date.toLocaleDateString('ja-JP', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                });

                html += `
                    <div class="transaction-item ${transaction.type}">
                        <div class="transaction-date">${formattedDate}</div>
                        <div class="transaction-info">
                            <div class="transaction-description">
                                ${transaction.description}
                                ${transaction.category ? `<span class="transaction-category">(${this.getCategoryName(transaction.category)})</span>` : ''}
                                ${transaction.isRegular ? '<span class="regular-badge">定期</span>' : ''}
                            </div>
                            <div class="transaction-amount ${transaction.type}">
                                ${isIncome ? '+' : '-'}¥${transaction.amount.toLocaleString()}
                            </div>
                        </div>
                        <div class="transaction-actions">
                            <button class="delete-btn" onclick="moneyManager.deleteTransaction('${transaction.id}')">削除</button>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        this.updatePaginationInfo();
    }

    getTotalPages() {
        if (this.itemsPerPage === 'all') return 1;
        return Math.ceil(this.allTransactions.length / this.itemsPerPage);
    }

    updatePaginationInfo() {
        const totalPages = this.getTotalPages();
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const paginationControls = document.getElementById('paginationControls');

        // ページ情報更新
        if (this.itemsPerPage === 'all') {
            pageInfo.textContent = `全 ${this.allTransactions.length} 件`;
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endItem = Math.min(this.currentPage * this.itemsPerPage, this.allTransactions.length);
            pageInfo.textContent = `${this.currentPage} / ${totalPages} ページ (${startItem}-${endItem} / ${this.allTransactions.length}件)`;
            
            prevBtn.style.display = 'inline-block';
            nextBtn.style.display = 'inline-block';
            prevBtn.disabled = this.currentPage === 1;
            nextBtn.disabled = this.currentPage === totalPages;
        }

        // 取引がない場合はページネーションを非表示
        paginationControls.style.display = this.allTransactions.length === 0 ? 'none' : 'flex';
    }

    toggleTransactionHistory() {
        const container = document.getElementById('transactionHistory');
        const toggleBtn = document.getElementById('toggleHistoryBtn');
        const toggleIcon = document.getElementById('toggleHistoryIcon');
        
        const isCollapsed = container.classList.contains('collapsed');
        
        if (isCollapsed) {
            container.classList.remove('collapsed');
            toggleIcon.textContent = '▲';
            toggleBtn.innerHTML = '<span id="toggleHistoryIcon">▲</span> 履歴を隠す';
            this.renderTransactionHistory();
        } else {
            container.classList.add('collapsed');
            toggleIcon.textContent = '▼';
            toggleBtn.innerHTML = '<span id="toggleHistoryIcon">▼</span> 履歴を表示';
        }
    }

    deleteTransaction(transactionId) {
        const [type, id] = transactionId.split('_');
        const numericId = parseInt(id);
        
        if (type === 'income') {
            this.deleteIncome(numericId);
        } else if (type === 'expense') {
            this.deleteExpense(numericId);
        }
    }

    renderTimeline() {
        const container = document.getElementById('timeline');
        container.innerHTML = '';

        const ganttData = this.calculatePurchaseTimeline();
        const safetyLine = this.safetyLine;
        
        if (ganttData.length === 0) {
            container.innerHTML = '<p>欲しいものリストまたは収入情報を追加してください。</p>';
            return;
        }

        // セーフティーライン情報を表示
        if (safetyLine) {
            const safetyInfo = document.createElement('div');
            safetyInfo.className = 'timeline-safety-info';
            safetyInfo.innerHTML = `
                <div class="safety-line-info">
                    <span class="safety-icon">🛡️</span>
                    <span class="safety-text">セーフティーライン: ¥${safetyLine.toLocaleString()}</span>
                    <span class="safety-description">- 購入可能期間をガントチャート形式で表示</span>
                </div>
            `;
            container.appendChild(safetyInfo);
        }

        // ガントチャートを描画
        this.renderGanttChart(container, ganttData);
    }

    renderGanttChart(container, ganttData) {
        // 日付範囲を決定（週単位）
        const today = new Date();
        const endDate = new Date();
        endDate.setMonth(today.getMonth() + 6);
        
        // 開始日を週の最初（月曜日）に調整
        const startDate = new Date(today);
        const dayOfWeek = startDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(startDate.getDate() + daysToMonday);
        
        const totalWeeks = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
        
        // ガントチャートコンテナ
        const ganttContainer = document.createElement('div');
        ganttContainer.className = 'gantt-chart';
        
        // ヘッダー（週軸）を作成
        const header = this.createGanttHeader(startDate, endDate, totalWeeks);
        ganttContainer.appendChild(header);
        
        // 各アイテムの行を作成
        ganttData.forEach((itemData, index) => {
            const row = this.createGanttRow(itemData, startDate, totalWeeks, index);
            ganttContainer.appendChild(row);
        });
        
        container.appendChild(ganttContainer);
    }

    createGanttHeader(startDate, endDate, totalWeeks) {
        const header = document.createElement('div');
        header.className = 'gantt-header';
        
        // 左側の順位欄ヘッダー
        const rankHeader = document.createElement('div');
        rankHeader.className = 'gantt-rank-header';
        rankHeader.textContent = '順位';
        header.appendChild(rankHeader);
        
        // 週軸
        const dateAxis = document.createElement('div');
        dateAxis.className = 'gantt-date-axis';
        
        // 月表示
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'gantt-months';
        
        // 週表示
        const weeksContainer = document.createElement('div');
        weeksContainer.className = 'gantt-weeks';
        
        let currentDate = new Date(startDate);
        let currentMonth = currentDate.getMonth();
        let monthStart = 0;
        
        for (let week = 0; week < totalWeeks; week++) {
            // 月が変わったら月ヘッダーを追加
            if (currentDate.getMonth() !== currentMonth) {
                if (monthStart < week) {
                    const monthSpan = document.createElement('div');
                    monthSpan.className = 'gantt-month';
                    monthSpan.textContent = new Date(currentDate.getFullYear(), currentMonth).toLocaleDateString('ja-JP', { month: 'short' });
                    monthSpan.style.gridColumn = `${monthStart + 1} / ${week + 1}`;
                    monthsContainer.appendChild(monthSpan);
                }
                
                currentMonth = currentDate.getMonth();
                monthStart = week;
            }
            
            // 週ヘッダーを追加（1週間1目盛り）
            const weekSpan = document.createElement('div');
            weekSpan.className = 'gantt-week';
            
            // 週の開始日を表示
            const weekStart = new Date(currentDate);
            weekSpan.textContent = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
            weekSpan.style.gridColumn = `${week + 1} / ${week + 2}`;
            
            // 今週かどうかを判定
            const today = new Date();
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            if (today >= weekStart && today <= weekEnd) {
                weekSpan.classList.add('current-week');
            }
            
            weeksContainer.appendChild(weekSpan);
            
            // 次の週へ
            currentDate.setDate(currentDate.getDate() + 7);
        }
        
        // 最後の月を追加
        if (monthStart < totalWeeks) {
            const monthSpan = document.createElement('div');
            monthSpan.className = 'gantt-month';
            monthSpan.textContent = new Date(currentDate.getFullYear(), currentMonth).toLocaleDateString('ja-JP', { month: 'short' });
            monthSpan.style.gridColumn = `${monthStart + 1} / ${totalWeeks + 1}`;
            monthsContainer.appendChild(monthSpan);
        }
        
        dateAxis.appendChild(monthsContainer);
        dateAxis.appendChild(weeksContainer);
        header.appendChild(dateAxis);
        
        return header;
    }

    createGanttRow(itemData, startDate, totalWeeks, index) {
        const row = document.createElement('div');
        row.className = 'gantt-row';
        row.draggable = true;
        row.dataset.itemId = itemData.item.id;
        row.dataset.priority = itemData.item.priority;
        
        // ドラッグイベントリスナーを追加
        row.addEventListener('dragstart', (e) => this.handleGanttDragStart(e));
        row.addEventListener('dragover', (e) => this.handleGanttDragOver(e));
        row.addEventListener('drop', (e) => this.handleGanttDrop(e));
        row.addEventListener('dragend', (e) => this.handleGanttDragEnd(e));
        
        // 順位表示
        const rankCell = document.createElement('div');
        rankCell.className = 'gantt-rank-cell';
        
        // 購入ボタンを含むHTML
        const purchaseButtonHtml = itemData.startDate && !itemData.item.purchased ? 
            `<button class="purchase-btn" onclick="moneyManager.purchaseItem(${itemData.item.id}, '${itemData.startDate.toISOString().split('T')[0]}')">購入する</button>` 
            : itemData.item.purchased ? 
            `<span class="purchased-label">購入済み</span>` 
            : '';
        
        rankCell.innerHTML = `
            <div class="gantt-drag-handle">⋮⋮</div>
            <div class="rank-badge ${itemData.safetyStatus}">
                <span class="rank-number">${itemData.rank}</span>
                <span class="rank-label">位</span>
            </div>
            <div class="item-name">${itemData.item.name}</div>
            ${purchaseButtonHtml}
        `;
        row.appendChild(rankCell);
        
        // タイムライン部分（週単位）
        const timelineArea = document.createElement('div');
        timelineArea.className = 'gantt-timeline-area';
        timelineArea.style.gridTemplateColumns = `repeat(${totalWeeks}, 1fr)`;
        
        if (itemData.startDate) {
            // 購入日がどの週に該当するかを計算
            const purchaseWeek = Math.floor((itemData.startDate - startDate) / (1000 * 60 * 60 * 24 * 7));
            
            if (purchaseWeek >= 0 && purchaseWeek < totalWeeks) {
                const bar = document.createElement('div');
                bar.className = `gantt-bar ${itemData.safetyStatus}`;
                // 購入週に表示（1目盛り = 1週間）
                bar.style.gridColumn = `${purchaseWeek + 1} / ${purchaseWeek + 2}`;
                
                const barContent = document.createElement('div');
                barContent.className = 'gantt-bar-content';
                const waitText = itemData.salaryWait ? '（給料日）' : '（余剰金）';
                barContent.innerHTML = `
                    <div class="bar-date">${itemData.startDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}${waitText}</div>
                    <div class="bar-price">¥${itemData.price.toLocaleString()}</div>
                `;
                bar.appendChild(barContent);
                
                timelineArea.appendChild(bar);
            }
        } else {
            // 購入不可能な場合
            const noBar = document.createElement('div');
            noBar.className = 'gantt-no-bar';
            noBar.textContent = '購入不可';
            noBar.style.gridColumn = `1 / ${totalWeeks + 1}`;
            timelineArea.appendChild(noBar);
        }
        
        row.appendChild(timelineArea);
        
        return row;
    }


    saveData() {
        const data = {
            wishlistItems: this.wishlistItems,
            incomeData: this.incomeData,
            regularIncomeSettings: this.regularIncomeSettings,
            expenseData: this.expenseData,
            regularExpenseSettings: this.regularExpenseSettings,
            initialAssets: this.initialAssets,
            safetyLine: this.safetyLine
        };
        localStorage.setItem('moneyManagerData', JSON.stringify(data));
    }

    loadData() {
        const data = localStorage.getItem('moneyManagerData');
        if (data) {
            const parsed = JSON.parse(data);
            this.wishlistItems = parsed.wishlistItems || [];
            this.incomeData = parsed.incomeData || [];
            this.regularIncomeSettings = parsed.regularIncomeSettings || [];
            this.expenseData = parsed.expenseData || [];
            this.regularExpenseSettings = parsed.regularExpenseSettings || [];
            this.initialAssets = parsed.initialAssets || 0;
            this.safetyLine = parsed.safetyLine || null;
            
            // 旧形式のデータとの互換性
            if (parsed.regularIncome) {
                this.regularIncomeSettings.push({
                    id: Date.now(),
                    ...parsed.regularIncome
                });
            }
        }
    }

    // 初期資産額設定
    setInitialAssets() {
        const assetsInput = document.getElementById('currentAssets');
        const amount = parseInt(assetsInput.value);

        if (!amount || amount < 0) {
            alert('正しい資産額を入力してください');
            return;
        }

        this.initialAssets = amount;
        
        // 初期資産額を収支履歴に初期設定として記録
        const initialAssetRecord = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            amount: amount,
            description: '初期資産額設定'
        };
        
        // 既存の初期資産額設定を削除してから新しいものを追加
        this.incomeData = this.incomeData.filter(income => income.description !== '初期資産額設定');
        this.incomeData.push(initialAssetRecord);
        
        this.saveData();
        this.updateChart(); // グラフも更新

        // 入力欄をクリア
        assetsInput.value = '';
    }

    // 資産額表示の更新（表示要素が削除されたため空の処理）
    updateAssetsDisplay() {
        // 資産額表示要素が削除されたため、処理はスキップ
    }

    // セーフティーライン設定
    setSafetyLine() {
        const safetyLineInput = document.getElementById('safetyLineAmount');
        const amount = parseInt(safetyLineInput.value);

        if (!amount || amount < 0) {
            alert('正しい金額を入力してください');
            return;
        }

        this.safetyLine = amount;
        this.saveData();
        this.updateChart();

        // 入力欄をクリア
        safetyLineInput.value = '';
        
        alert(`セーフティーラインを¥${amount.toLocaleString()}に設定しました`);
    }

    // セーフティーラインクリア
    clearSafetyLine() {
        if (confirm('セーフティーラインを削除しますか？')) {
            this.safetyLine = null;
            this.saveData();
            this.updateChart();
            
            alert('セーフティーラインを削除しました');
        }
    }

    // 定期収入編集機能
    editRegularIncomeSetting(settingId) {
        const setting = this.regularIncomeSettings.find(s => s.id === parseInt(settingId));
        if (!setting) return;

        // フォームに既存データを設定
        document.getElementById('editingIncomeId').value = setting.id;
        document.getElementById('regularIncomeStartMonth').value = setting.startMonth;
        document.getElementById('regularIncomeDay').value = setting.day;
        document.getElementById('regularIncomeAmount').value = setting.amount;
        document.getElementById('regularIncomeMonths').value = setting.months;

        // UI切り替え
        document.getElementById('regularIncomeTitle').textContent = '定期収入設定を編集中';
        document.getElementById('generateRegularIncomeBtn').style.display = 'none';
        document.getElementById('updateRegularIncomeBtn').style.display = 'inline-block';
        document.getElementById('cancelEditIncomeBtn').style.display = 'inline-block';
    }

    updateRegularIncome() {
        const editingId = parseInt(document.getElementById('editingIncomeId').value);
        const startMonth = document.getElementById('regularIncomeStartMonth').value;
        const day = parseInt(document.getElementById('regularIncomeDay').value);
        const amount = parseInt(document.getElementById('regularIncomeAmount').value);
        const months = parseInt(document.getElementById('regularIncomeMonths').value);

        if (!startMonth || !day || !amount || !months || day < 1 || day > 31 || amount <= 0 || months < 1) {
            alert('正しい値を入力してください');
            return;
        }

        // 既存設定を更新
        const settingIndex = this.regularIncomeSettings.findIndex(s => s.id === editingId);
        if (settingIndex === -1) return;

        const oldSetting = this.regularIncomeSettings[settingIndex];
        
        // 既存の収入データを削除
        this.incomeData = this.incomeData.filter(income => income.settingId !== editingId);

        // 設定を更新
        const [startYear, startMonthNum] = startMonth.split('-').map(num => parseInt(num));
        this.regularIncomeSettings[settingIndex] = {
            ...oldSetting,
            startMonth: startMonth,
            startYear: startYear,
            day: day,
            amount: amount,
            months: months
        };

        // 新しいデータを生成
        const startMonthIndex = startMonthNum - 1;
        for (let i = 0; i < months; i++) {
            const currentDate = new Date(startYear, startMonthIndex + i, day);
            if (currentDate.getMonth() !== (startMonthIndex + i) % 12) {
                currentDate.setDate(0);
            }

            const income = {
                id: Date.now() + i,
                date: currentDate.toISOString().split('T')[0],
                amount: amount,
                settingId: editingId,
                isRegular: true
            };
            this.incomeData.push(income);
        }

        this.incomeData.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        this.render();
        this.cancelEditIncome();

        alert('定期収入設定を更新しました');
    }

    cancelEditIncome() {
        // フォームをクリア
        document.getElementById('editingIncomeId').value = '';
        document.getElementById('regularIncomeStartMonth').value = '';
        document.getElementById('regularIncomeDay').value = '25';
        document.getElementById('regularIncomeAmount').value = '';
        document.getElementById('regularIncomeMonths').value = '12';

        // UI切り替え
        document.getElementById('regularIncomeTitle').textContent = '定期収入設定（公務員向け）';
        document.getElementById('generateRegularIncomeBtn').style.display = 'inline-block';
        document.getElementById('updateRegularIncomeBtn').style.display = 'none';
        document.getElementById('cancelEditIncomeBtn').style.display = 'none';
        
        // デフォルト開始月を設定
        this.setDefaultStartMonth();
    }

    // 定期支出編集機能
    editRegularExpenseSetting(settingId) {
        const setting = this.regularExpenseSettings.find(s => s.id === parseInt(settingId));
        if (!setting) return;

        // フォームに既存データを設定
        document.getElementById('editingExpenseId').value = setting.id;
        document.getElementById('regularExpenseStartMonth').value = setting.startMonth;
        document.getElementById('regularExpenseDay').value = setting.day;
        document.getElementById('regularExpenseCategory').value = setting.category;
        document.getElementById('regularExpenseAmount').value = setting.amount;
        document.getElementById('regularExpenseMonths').value = setting.months;

        // UI切り替え
        document.getElementById('regularExpenseTitle').textContent = '定期支出設定を編集中';
        document.getElementById('generateRegularExpenseBtn').style.display = 'none';
        document.getElementById('updateRegularExpenseBtn').style.display = 'inline-block';
        document.getElementById('cancelEditExpenseBtn').style.display = 'inline-block';
    }

    updateRegularExpense() {
        const editingId = parseInt(document.getElementById('editingExpenseId').value);
        const startMonth = document.getElementById('regularExpenseStartMonth').value;
        const day = parseInt(document.getElementById('regularExpenseDay').value);
        const category = document.getElementById('regularExpenseCategory').value;
        const amount = parseInt(document.getElementById('regularExpenseAmount').value);
        const months = parseInt(document.getElementById('regularExpenseMonths').value);

        if (!startMonth || !day || !category || !amount || !months || day < 1 || day > 31 || amount <= 0 || months < 1) {
            alert('正しい値を入力してください');
            return;
        }

        // 既存設定を更新
        const settingIndex = this.regularExpenseSettings.findIndex(s => s.id === editingId);
        if (settingIndex === -1) return;

        const oldSetting = this.regularExpenseSettings[settingIndex];
        
        // 既存の支出データを削除
        this.expenseData = this.expenseData.filter(expense => expense.settingId !== editingId);

        // 設定を更新
        const [startYear, startMonthNum] = startMonth.split('-').map(num => parseInt(num));
        this.regularExpenseSettings[settingIndex] = {
            ...oldSetting,
            startMonth: startMonth,
            startYear: startYear,
            day: day,
            category: category,
            amount: amount,
            months: months
        };

        // 新しいデータを生成
        const startMonthIndex = startMonthNum - 1;
        for (let i = 0; i < months; i++) {
            const currentDate = new Date(startYear, startMonthIndex + i, day);
            if (currentDate.getMonth() !== (startMonthIndex + i) % 12) {
                currentDate.setDate(0);
            }

            const expense = {
                id: Date.now() + i,
                date: currentDate.toISOString().split('T')[0],
                category: category,
                amount: amount,
                description: `定期支出 - ${this.getCategoryName(category)}`,
                settingId: editingId,
                isRegular: true
            };
            this.expenseData.push(expense);
        }

        this.expenseData.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        this.render();
        this.cancelEditExpense();

        alert('定期支出設定を更新しました');
    }

    cancelEditExpense() {
        // フォームをクリア
        document.getElementById('editingExpenseId').value = '';
        document.getElementById('regularExpenseStartMonth').value = '';
        document.getElementById('regularExpenseDay').value = '25';
        document.getElementById('regularExpenseCategory').value = 'food';
        document.getElementById('regularExpenseAmount').value = '';
        document.getElementById('regularExpenseMonths').value = '12';

        // UI切り替え
        document.getElementById('regularExpenseTitle').textContent = '定期支出設定（毎月）';
        document.getElementById('generateRegularExpenseBtn').style.display = 'inline-block';
        document.getElementById('updateRegularExpenseBtn').style.display = 'none';
        document.getElementById('cancelEditExpenseBtn').style.display = 'none';
        
        // デフォルト開始月を設定
        this.setDefaultStartMonth();
    }


    reorderWishlistItems(newOrder) {
        // 新しい順序に基づいて優先度を再設定
        const reorderedItems = [];
        
        newOrder.forEach((itemId, index) => {
            const item = this.wishlistItems.find(item => item.id === itemId);
            if (item) {
                item.priority = index + 1;
                reorderedItems.push(item);
            }
        });
        
        // 優先度順で厳密にソート
        reorderedItems.sort((a, b) => a.priority - b.priority);
        
        this.wishlistItems = reorderedItems;
        this.saveData();
        
        // 順位変更後に購入計画を再計算
        this.recalculatePurchasePlan();
        
        this.render();
    }

    // 購入計画の再計算（順位変更時に呼び出される）
    recalculatePurchasePlan() {
        // 優先度が変更されたので、購入計画を完全に再計算
        // まず優先度順にソート
        this.sortItemsByPriority();
        
        // ガントチャート計算を実行して新しい購入可能日付を取得
        const ganttData = this.calculateGanttTimeline();
        
        // 購入計画が正しく優先度順になったことをログ出力（デバッグ用）
        console.log('購入計画再計算結果:');
        ganttData.forEach(data => {
            if (!data.item.purchased && data.startDate) {
                const dateStr = data.startDate.toLocaleDateString('ja-JP');
                console.log(`${data.rank}位: ${data.item.name} - ${dateStr}`);
                data.item.plannedPurchaseDate = data.startDate.toISOString().split('T')[0];
            }
        });
        
        // データを保存
        this.saveData();
    }

    // ガントチャート用ドラッグ&ドロップ関連メソッド
    handleGanttDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.itemId);
        e.target.classList.add('gantt-dragging');
        this.draggedItemId = parseInt(e.target.dataset.itemId);
    }

    handleGanttDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const draggedElement = document.querySelector('.gantt-dragging');
        const afterElement = this.getGanttDropTarget(e.target.closest('.gantt-chart'), e.clientY);
        const container = e.target.closest('.gantt-chart');
        
        if (!container || !draggedElement) return;
        
        const rows = [...container.querySelectorAll('.gantt-row')];
        const draggedIndex = rows.indexOf(draggedElement);
        const afterIndex = afterElement ? rows.indexOf(afterElement) : rows.length;
        
        if (draggedIndex !== afterIndex && draggedIndex !== afterIndex - 1) {
            if (afterElement) {
                container.insertBefore(draggedElement, afterElement);
            } else {
                container.appendChild(draggedElement);
            }
        }
    }

    handleGanttDrop(e) {
        e.preventDefault();
        
        // 新しい順序を計算
        const container = e.target.closest('.gantt-chart');
        if (!container) return;
        
        const rows = [...container.querySelectorAll('.gantt-row')];
        const newOrder = rows.map(row => parseInt(row.dataset.itemId));
        
        // 優先度を更新
        this.reorderWishlistItems(newOrder);
        
        // ガントチャートを再描画
        this.renderTimeline();
    }

    handleGanttDragEnd(e) {
        e.target.classList.remove('gantt-dragging');
        this.draggedItemId = null;
    }

    getGanttDropTarget(container, y) {
        const draggableElements = [...container.querySelectorAll('.gantt-row:not(.gantt-dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

// アプリケーション初期化
const moneyManager = new MoneyManager();