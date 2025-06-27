/**
 * 欲しいものアイテムデータモデル
 */
class WishlistItem {
    constructor({
        id = null,
        name,
        price,
        priority = 1,
        plannedPurchaseDate = null,
        isPurchased = false,
        purchaseDate = null,
        notes = ''
    }) {
        this.id = id || this.generateId();
        this.name = name;
        this.price = parseFloat(price);
        this.priority = parseInt(priority);
        this.plannedPurchaseDate = plannedPurchaseDate ? new Date(plannedPurchaseDate) : null;
        this.isPurchased = isPurchased;
        this.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
        this.notes = notes;
        this.createdAt = new Date();
    }

    generateId() {
        return 'wi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 購入予定日の文字列を取得
     */
    getPlannedDateString() {
        return this.plannedPurchaseDate ? this.plannedPurchaseDate.toISOString().split('T')[0] : null;
    }

    /**
     * 価格の表示用文字列を取得
     */
    getPriceDisplay() {
        return `¥${this.price.toLocaleString()}`;
    }

    /**
     * 購入可能性を判定
     */
    getPurchaseability(currentAssets, safetyLine = 0) {
        const availableAssets = currentAssets - safetyLine;
        const ratio = availableAssets / this.price;
        
        if (ratio >= 1) {
            return { status: 'safe', message: '購入可能' };
        } else if (ratio >= 0.8) {
            return { status: 'risky', message: '注意して購入' };
        } else {
            return { status: 'impossible', message: '購入困難' };
        }
    }

    /**
     * 優先度のスタイルクラスを取得
     */
    getPriorityClass() {
        if (this.priority <= 3) return 'priority-high';
        if (this.priority <= 7) return 'priority-medium';
        return 'priority-low';
    }

    /**
     * アイテムを購入済みにマーク
     */
    markAsPurchased() {
        this.isPurchased = true;
        this.purchaseDate = new Date();
    }

    /**
     * 購入をキャンセル
     */
    cancelPurchase() {
        this.isPurchased = false;
        this.purchaseDate = null;
    }

    /**
     * 購入予定の取引を生成
     */
    createScheduledTransaction() {
        if (!this.plannedPurchaseDate || this.isPurchased) {
            return null;
        }

        return new Transaction({
            type: 'expense',
            amount: this.price,
            date: this.plannedPurchaseDate,
            description: `【購入予定】${this.name}`,
            category: 'entertainment',
            isScheduled: true,
            relatedWishlistId: this.id
        });
    }

    /**
     * 実際の購入取引を生成
     */
    createPurchaseTransaction() {
        return new Transaction({
            type: 'expense',
            amount: this.price,
            date: this.purchaseDate || new Date(),
            description: `${this.name}`,
            category: 'entertainment',
            relatedWishlistId: this.id
        });
    }

    /**
     * JSONシリアライズ用
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            price: this.price,
            priority: this.priority,
            plannedPurchaseDate: this.getPlannedDateString(),
            isPurchased: this.isPurchased,
            purchaseDate: this.purchaseDate ? this.purchaseDate.toISOString().split('T')[0] : null,
            notes: this.notes,
            createdAt: this.createdAt.toISOString()
        };
    }

    /**
     * JSONから復元
     */
    static fromJSON(data) {
        const item = new WishlistItem({
            id: data.id,
            name: data.name,
            price: data.price,
            priority: data.priority,
            plannedPurchaseDate: data.plannedPurchaseDate,
            isPurchased: data.isPurchased,
            purchaseDate: data.purchaseDate,
            notes: data.notes
        });
        if (data.createdAt) {
            item.createdAt = new Date(data.createdAt);
        }
        return item;
    }
}