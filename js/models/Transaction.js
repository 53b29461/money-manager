/**
 * 取引（収入・支出）データモデル
 */
class Transaction {
    constructor({
        id = null,
        type, // 'income' | 'expense'
        amount,
        date,
        description,
        category = null,
        isRegular = false,
        isScheduled = false,
        relatedWishlistId = null
    }) {
        this.id = id || this.generateId();
        this.type = type;
        this.amount = parseFloat(amount);
        this.date = new Date(date);
        this.description = description;
        this.category = category;
        this.isRegular = isRegular;
        this.isScheduled = isScheduled;
        this.relatedWishlistId = relatedWishlistId;
        this.createdAt = new Date();
    }

    generateId() {
        return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 日付文字列を取得
     */
    getDateString() {
        return this.date.toISOString().split('T')[0];
    }

    /**
     * 表示用の日付文字列を取得
     */
    getDisplayDate() {
        return this.date.toLocaleDateString('ja-JP', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
    }

    /**
     * 金額の表示用文字列を取得
     */
    getAmountDisplay() {
        const prefix = this.type === 'income' ? '+' : '-';
        return `${prefix}¥${this.amount.toLocaleString()}`;
    }

    /**
     * カテゴリ名を取得
     */
    getCategoryName() {
        const categories = {
            'food': '食費',
            'utilities': '光熱費',
            'entertainment': '交際費',
            'general': '総支出',
            'other': 'その他'
        };
        return this.category ? categories[this.category] || this.category : '';
    }

    /**
     * JSONシリアライズ用
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            amount: this.amount,
            date: this.getDateString(),
            description: this.description,
            category: this.category,
            isRegular: this.isRegular,
            isScheduled: this.isScheduled,
            relatedWishlistId: this.relatedWishlistId,
            createdAt: this.createdAt.toISOString()
        };
    }

    /**
     * JSONから復元
     */
    static fromJSON(data) {
        const transaction = new Transaction({
            id: data.id,
            type: data.type,
            amount: data.amount,
            date: data.date,
            description: data.description,
            category: data.category,
            isRegular: data.isRegular,
            isScheduled: data.isScheduled,
            relatedWishlistId: data.relatedWishlistId
        });
        if (data.createdAt) {
            transaction.createdAt = new Date(data.createdAt);
        }
        return transaction;
    }
}