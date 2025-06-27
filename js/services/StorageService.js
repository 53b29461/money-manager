/**
 * データの永続化を担当するサービス
 */
class StorageService {
    constructor() {
        this.STORAGE_KEYS = {
            TRANSACTIONS: 'moneyManager_transactions',
            WISHLIST: 'moneyManager_wishlist',
            SETTINGS: 'moneyManager_settings'
        };
    }

    /**
     * 取引データを保存
     */
    saveTransactions(transactions) {
        try {
            const data = transactions.map(t => t.toJSON());
            localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('取引データの保存に失敗:', error);
            return false;
        }
    }

    /**
     * 取引データを読み込み
     */
    loadTransactions() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            return parsed.map(t => Transaction.fromJSON(t));
        } catch (error) {
            console.error('取引データの読み込みに失敗:', error);
            return [];
        }
    }

    /**
     * 欲しいものリストを保存
     */
    saveWishlist(wishlistItems) {
        try {
            const data = wishlistItems.map(item => item.toJSON());
            localStorage.setItem(this.STORAGE_KEYS.WISHLIST, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('欲しいものリストの保存に失敗:', error);
            return false;
        }
    }

    /**
     * 欲しいものリストを読み込み
     */
    loadWishlist() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.WISHLIST);
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            return parsed.map(item => WishlistItem.fromJSON(item));
        } catch (error) {
            console.error('欲しいものリストの読み込みに失敗:', error);
            return [];
        }
    }

    /**
     * 設定を保存
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('設定の保存に失敗:', error);
            return false;
        }
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (!data) {
                return {
                    initialAssets: 0,
                    safetyLine: 0
                };
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('設定の読み込みに失敗:', error);
            return {
                initialAssets: 0,
                safetyLine: 0
            };
        }
    }

    /**
     * 特定の取引を削除
     */
    deleteTransaction(transactionId) {
        const transactions = this.loadTransactions();
        const filtered = transactions.filter(t => t.id !== transactionId);
        return this.saveTransactions(filtered);
    }

    /**
     * 特定の欲しいものアイテムを削除
     */
    deleteWishlistItem(itemId) {
        const wishlist = this.loadWishlist();
        const filtered = wishlist.filter(item => item.id !== itemId);
        return this.saveWishlist(filtered);
    }

    /**
     * 関連する取引を削除（欲しいものアイテム削除時に使用）
     */
    deleteRelatedTransactions(wishlistItemId) {
        const transactions = this.loadTransactions();
        const filtered = transactions.filter(t => t.relatedWishlistId !== wishlistItemId);
        return this.saveTransactions(filtered);
    }

    /**
     * データをエクスポート
     */
    exportData() {
        return {
            transactions: this.loadTransactions().map(t => t.toJSON()),
            wishlist: this.loadWishlist().map(item => item.toJSON()),
            settings: this.loadSettings(),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * データをインポート
     */
    importData(data) {
        try {
            if (data.transactions) {
                const transactions = data.transactions.map(t => Transaction.fromJSON(t));
                this.saveTransactions(transactions);
            }
            
            if (data.wishlist) {
                const wishlist = data.wishlist.map(item => WishlistItem.fromJSON(item));
                this.saveWishlist(wishlist);
            }
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('データインポートに失敗:', error);
            return false;
        }
    }

    /**
     * 全データを削除
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.TRANSACTIONS);
            localStorage.removeItem(this.STORAGE_KEYS.WISHLIST);
            localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
            return true;
        } catch (error) {
            console.error('データクリアに失敗:', error);
            return false;
        }
    }
}