/**
 * メインアプリケーション
 * すべてのコンポーネントを初期化・統合
 */
class MoneyManagerApp {
    constructor() {
        this.initializeServices();
        this.initializeComponents();
        this.bindGlobalEvents();
        
        console.log('💰 資産管理アプリが開始されました');
    }

    initializeServices() {
        // サービス層の初期化
        this.storageService = new StorageService();
        this.financeCalculator = new FinanceCalculator();
    }

    initializeComponents() {
        // コンポーネント層の初期化
        this.dashboard = new Dashboard(this.storageService, this.financeCalculator);
        this.financeManager = new FinanceManager(this.storageService, this.financeCalculator);
        this.wishlistManager = new WishlistManager(this.storageService, this.financeCalculator);
        this.chartManager = new ChartManager(this.storageService, this.financeCalculator);
        this.historyManager = new HistoryManager(
            this.storageService, 
            this.financeCalculator, 
            this.financeManager
        );

        // グローバルアクセス用（HTMLからの呼び出し用）
        window.dashboard = this.dashboard;
        window.financeManager = this.financeManager;
        window.wishlistManager = this.wishlistManager;
        window.chartManager = this.chartManager;
        window.historyManager = this.historyManager;
    }

    bindGlobalEvents() {
        // ページリロード前の確認
        window.addEventListener('beforeunload', (e) => {
            // データが保存されていることを確認
            const hasUnsavedChanges = this.checkUnsavedChanges();
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // エラーハンドリング
        window.addEventListener('error', (e) => {
            console.error('アプリケーションエラー:', e.error);
            this.handleGlobalError(e.error);
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // レスポンシブ対応
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    checkUnsavedChanges() {
        // 実装簡略化：常にfalseを返す
        // 実際の実装では、フォームの変更状態をチェック
        return false;
    }

    handleGlobalError(error) {
        // エラーの種類に応じて適切な処理
        if (error.name === 'QuotaExceededError') {
            alert('ストレージ容量が不足しています。古いデータを削除してください。');
        } else {
            alert('予期しないエラーが発生しました。ページをリロードしてください。');
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + キーの組み合わせ
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    document.getElementById('itemName').focus();
                    break;
                case 'i':
                    e.preventDefault();
                    document.getElementById('incomeAmount').focus();
                    break;
                case 'e':
                    e.preventDefault();
                    document.getElementById('expenseAmount').focus();
                    break;
                case 's':
                    e.preventDefault();
                    this.exportData();
                    break;
            }
        }
    }

    handleResize() {
        // チャートのリサイズ
        if (this.chartManager && this.chartManager.assetChart) {
            this.chartManager.assetChart.resize();
        }
    }

    // データエクスポート機能
    exportData() {
        try {
            const data = this.storageService.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `money-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('データをエクスポートしました');
        } catch (error) {
            console.error('エクスポートエラー:', error);
            alert('データのエクスポートに失敗しました');
        }
    }

    // データインポート機能
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = this.storageService.importData(data);
                    
                    if (success) {
                        this.refreshAllComponents();
                        resolve(true);
                        console.log('データをインポートしました');
                    } else {
                        reject(new Error('インポートに失敗しました'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('ファイル読み込みに失敗しました'));
            };
            
            reader.readAsText(file);
        });
    }

    // 全コンポーネントの更新
    refreshAllComponents() {
        this.dashboard.refresh();
        this.wishlistManager.render();
        this.chartManager.refresh();
        this.historyManager.refresh();
    }

    // データクリア機能（開発・テスト用）
    clearAllData() {
        if (confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
            const success = this.storageService.clearAllData();
            if (success) {
                location.reload(); // ページをリロードして初期状態に戻す
            } else {
                alert('データクリアに失敗しました');
            }
        }
    }

    // アプリケーション統計情報
    getAppStats() {
        const transactions = this.storageService.loadTransactions();
        const wishlist = this.storageService.loadWishlist();
        const settings = this.storageService.loadSettings();
        
        return {
            totalTransactions: transactions.length,
            totalWishlistItems: wishlist.length,
            currentAssets: this.financeCalculator.calculateCurrentAssets(),
            hasInitialAssets: (settings.initialAssets || 0) > 0,
            hasSafetyLine: (settings.safetyLine || 0) > 0
        };
    }
}

// DOM読み込み完了後にアプリケーションを開始
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MoneyManagerApp();
    
    // 開発用：コンソールからアクセス可能にする
    if (process?.env?.NODE_ENV === 'development') {
        window.clearData = () => window.app.clearAllData();
        window.exportData = () => window.app.exportData();
        window.getStats = () => window.app.getAppStats();
    }
});