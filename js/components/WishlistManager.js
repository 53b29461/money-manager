/**
 * 欲しいものリスト管理を担当するコンポーネント
 */
class WishlistManager {
    constructor(storageService, financeCalculator) {
        this.storageService = storageService;
        this.financeCalculator = financeCalculator;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.elements = {
            itemName: document.getElementById('itemName'),
            itemPrice: document.getElementById('itemPrice'),
            plannedDate: document.getElementById('plannedDate'),
            addWishlistItemBtn: document.getElementById('addWishlistItem'),
            wishlistContainer: document.getElementById('wishlistContainer')
        };
    }

    bindEvents() {
        this.elements.addWishlistItemBtn.addEventListener('click', () => {
            this.addWishlistItem();
        });

        this.elements.itemPrice.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWishlistItem();
        });

        // 他のコンポーネントからの更新通知を受信
        document.addEventListener('financeUpdate', () => {
            this.render();
        });

        document.addEventListener('dashboardUpdate', () => {
            this.render();
        });
    }

    addWishlistItem() {
        const name = this.elements.itemName.value.trim();
        const price = parseFloat(this.elements.itemPrice.value);
        const plannedDate = this.elements.plannedDate.value;

        if (!name) {
            alert('商品名を入力してください');
            return;
        }

        if (!price || price <= 0) {
            alert('正しい価格を入力してください');
            return;
        }

        const wishlist = this.storageService.loadWishlist();
        const nextPriority = wishlist.length + 1;

        const item = new WishlistItem({
            name: name,
            price: price,
            priority: nextPriority,
            plannedPurchaseDate: plannedDate || null
        });

        wishlist.push(item);
        this.storageService.saveWishlist(wishlist);

        // 購入予定日がある場合は予定取引を作成
        if (plannedDate) {
            this.createScheduledTransaction(item);
        }

        this.clearForm();
        this.render();
        this.notifyUpdate();
    }

    createScheduledTransaction(item) {
        const transaction = item.createScheduledTransaction();
        if (transaction) {
            const transactions = this.storageService.loadTransactions();
            transactions.push(transaction);
            this.storageService.saveTransactions(transactions);
        }
    }

    deleteWishlistItem(itemId) {
        if (!confirm('このアイテムを削除しますか？')) return;

        // 関連する取引も削除
        this.storageService.deleteRelatedTransactions(itemId);
        
        // アイテムを削除
        const success = this.storageService.deleteWishlistItem(itemId);
        
        if (success) {
            this.render();
            this.notifyUpdate();
        } else {
            alert('削除に失敗しました');
        }
    }

    purchaseItem(itemId) {
        const wishlist = this.storageService.loadWishlist();
        const item = wishlist.find(item => item.id === itemId);
        
        if (!item) return;

        if (!confirm(`「${item.name}」を購入しますか？`)) return;

        // アイテムを購入済みにマーク
        item.markAsPurchased();
        
        // 購入取引を作成
        const purchaseTransaction = item.createPurchaseTransaction();
        const transactions = this.storageService.loadTransactions();
        transactions.push(purchaseTransaction);

        // 予定取引を削除
        const filteredTransactions = transactions.filter(t => 
            !(t.isScheduled && t.relatedWishlistId === itemId)
        );

        // 保存
        this.storageService.saveWishlist(wishlist);
        this.storageService.saveTransactions(filteredTransactions);

        this.render();
        this.notifyUpdate();
    }

    changePriority(itemId, direction) {
        const wishlist = this.storageService.loadWishlist();
        const item = wishlist.find(item => item.id === itemId);
        
        if (!item) return;

        const currentIndex = wishlist.findIndex(item => item.id === itemId);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= wishlist.length) return;

        // アイテムの位置を交換
        [wishlist[currentIndex], wishlist[newIndex]] = [wishlist[newIndex], wishlist[currentIndex]];

        // 優先度を再設定
        wishlist.forEach((item, index) => {
            item.priority = index + 1;
        });

        this.storageService.saveWishlist(wishlist);
        this.render();
    }

    updatePlannedDate(itemId, newDate) {
        const wishlist = this.storageService.loadWishlist();
        const item = wishlist.find(item => item.id === itemId);
        
        if (!item) return;

        // 既存の予定取引を削除
        this.storageService.deleteRelatedTransactions(itemId);

        // 新しい予定日を設定
        item.plannedPurchaseDate = newDate ? new Date(newDate) : null;

        // 新しい予定取引を作成
        if (newDate && !item.isPurchased) {
            this.createScheduledTransaction(item);
        }

        this.storageService.saveWishlist(wishlist);
        this.render();
        this.notifyUpdate();
    }

    render() {
        const wishlist = this.storageService.loadWishlist();
        const currentAssets = this.financeCalculator.calculateCurrentAssets();
        const settings = this.storageService.loadSettings();
        const safetyLine = settings.safetyLine || 0;

        // 優先度でソート（購入済みは最後）
        const sortedWishlist = [...wishlist].sort((a, b) => {
            if (a.isPurchased !== b.isPurchased) {
                return a.isPurchased ? 1 : -1;
            }
            return a.priority - b.priority;
        });

        const html = sortedWishlist.map((item, index) => {
            const purchaseability = item.getPurchaseability(currentAssets, safetyLine);
            const canMoveUp = index > 0 && !item.isPurchased && !sortedWishlist[index-1].isPurchased;
            const canMoveDown = index < sortedWishlist.length - 1 && !item.isPurchased && !sortedWishlist[index+1].isPurchased;

            return `
                <div class="wishlist-item ${item.isPurchased ? 'purchased' : ''} ${purchaseability.status}">
                    <div class="item-rank">
                        <div class="rank-number">${item.priority}</div>
                        <div class="rank-label">位</div>
                    </div>
                    
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-price">${item.getPriceDisplay()}</div>
                        <div class="item-status ${purchaseability.status}">
                            ${purchaseability.message}
                        </div>
                        ${item.plannedPurchaseDate ? 
                            `<div class="planned-date">予定: ${item.getPlannedDateString()}</div>` : 
                            ''
                        }
                    </div>

                    <div class="item-controls">
                        ${!item.isPurchased ? `
                            <div class="priority-controls">
                                <button class="priority-btn" 
                                        onclick="wishlistManager.changePriority('${item.id}', 'up')"
                                        ${!canMoveUp ? 'disabled' : ''}>↑</button>
                                <button class="priority-btn" 
                                        onclick="wishlistManager.changePriority('${item.id}', 'down')"
                                        ${!canMoveDown ? 'disabled' : ''}>↓</button>
                            </div>
                            
                            <div class="date-control">
                                <input type="date" 
                                       value="${item.getPlannedDateString() || ''}"
                                       onchange="wishlistManager.updatePlannedDate('${item.id}', this.value)"
                                       class="planned-date-input">
                            </div>
                            
                            <button class="purchase-btn" 
                                    onclick="wishlistManager.purchaseItem('${item.id}')"
                                    ${purchaseability.status === 'impossible' ? 'disabled' : ''}>
                                購入
                            </button>
                        ` : `
                            <div class="purchased-label">✓ 購入済み</div>
                        `}
                        
                        <button class="delete-btn" 
                                onclick="wishlistManager.deleteWishlistItem('${item.id}')">
                            ×
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.wishlistContainer.innerHTML = html;
    }

    clearForm() {
        this.elements.itemName.value = '';
        this.elements.itemPrice.value = '';
        this.elements.plannedDate.value = '';
    }

    notifyUpdate() {
        const event = new CustomEvent('wishlistUpdate', {
            detail: {
                wishlist: this.storageService.loadWishlist()
            }
        });
        document.dispatchEvent(event);
    }
}