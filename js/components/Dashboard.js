/**
 * ダッシュボード表示を担当するコンポーネント
 */
class Dashboard {
    constructor(storageService, financeCalculator) {
        this.storageService = storageService;
        this.financeCalculator = financeCalculator;
        this.settings = this.storageService.loadSettings();
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        this.elements = {
            currentAssets: document.getElementById('currentAssets'),
            safetyAmount: document.getElementById('safetyAmount'),
            nextPurchase: document.getElementById('nextPurchase'),
            initialAssetsInput: document.getElementById('initialAssets'),
            setInitialAssetsBtn: document.getElementById('setInitialAssets'),
            safetyLineInput: document.getElementById('safetyLine'),
            setSafetyLineBtn: document.getElementById('setSafetyLine')
        };
    }

    bindEvents() {
        this.elements.setInitialAssetsBtn.addEventListener('click', () => {
            this.setInitialAssets();
        });

        this.elements.setSafetyLineBtn.addEventListener('click', () => {
            this.setSafetyLine();
        });

        this.elements.initialAssetsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setInitialAssets();
        });

        this.elements.safetyLineInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setSafetyLine();
        });
    }

    setInitialAssets() {
        const amount = parseFloat(this.elements.initialAssetsInput.value);
        if (isNaN(amount) || amount < 0) {
            alert('正しい金額を入力してください');
            return;
        }

        this.settings.initialAssets = amount;
        this.storageService.saveSettings(this.settings);
        this.updateDisplay();
        
        // 他のコンポーネントに更新を通知
        this.dispatchUpdateEvent();
    }

    setSafetyLine() {
        const amount = parseFloat(this.elements.safetyLineInput.value);
        if (isNaN(amount) || amount < 0) {
            alert('正しい金額を入力してください');
            return;
        }

        this.settings.safetyLine = amount;
        this.storageService.saveSettings(this.settings);
        this.updateDisplay();
        
        // 他のコンポーネントに更新を通知
        this.dispatchUpdateEvent();
    }

    updateDisplay() {
        this.updateCurrentAssets();
        this.updateSafetyLine();
        this.updateNextPurchase();
        this.updateInputValues();
    }

    updateCurrentAssets() {
        const currentAssets = this.financeCalculator.calculateCurrentAssets();
        this.elements.currentAssets.textContent = `¥${currentAssets.toLocaleString()}`;
        
        // 色を変更（資産状況に応じて）
        const safetyLine = this.settings.safetyLine || 0;
        this.elements.currentAssets.className = 'asset-amount';
        
        if (currentAssets > safetyLine * 2) {
            this.elements.currentAssets.classList.add('abundant');
        } else if (currentAssets > safetyLine) {
            this.elements.currentAssets.classList.add('safe');
        } else {
            this.elements.currentAssets.classList.add('warning');
        }
    }

    updateSafetyLine() {
        const safetyLine = this.settings.safetyLine || 0;
        if (safetyLine > 0) {
            this.elements.safetyAmount.textContent = `¥${safetyLine.toLocaleString()}`;
            this.elements.safetyAmount.className = 'safety-amount set';
        } else {
            this.elements.safetyAmount.textContent = '未設定';
            this.elements.safetyAmount.className = 'safety-amount unset';
        }
    }

    updateNextPurchase() {
        const wishlist = this.storageService.loadWishlist();
        const unpurchasedItems = wishlist.filter(item => !item.isPurchased);
        
        if (unpurchasedItems.length === 0) {
            this.elements.nextPurchase.textContent = 'なし';
            this.elements.nextPurchase.className = 'next-purchase-empty';
            return;
        }

        // 優先度でソート
        unpurchasedItems.sort((a, b) => a.priority - b.priority);
        const nextItem = unpurchasedItems[0];
        
        const currentAssets = this.financeCalculator.calculateCurrentAssets();
        const purchaseability = nextItem.getPurchaseability(currentAssets, this.settings.safetyLine);
        
        this.elements.nextPurchase.innerHTML = `
            <div class="next-item-name">${nextItem.name}</div>
            <div class="next-item-price">${nextItem.getPriceDisplay()}</div>
            <div class="next-item-status ${purchaseability.status}">${purchaseability.message}</div>
        `;
        
        this.elements.nextPurchase.className = `next-purchase-content ${purchaseability.status}`;
    }

    updateInputValues() {
        // 現在の値をインプットフィールドに表示
        this.elements.initialAssetsInput.value = this.settings.initialAssets || '';
        this.elements.safetyLineInput.value = this.settings.safetyLine || '';
    }

    dispatchUpdateEvent() {
        // カスタムイベントを発行して他のコンポーネントに更新を通知
        const event = new CustomEvent('dashboardUpdate', {
            detail: {
                currentAssets: this.financeCalculator.calculateCurrentAssets(),
                settings: this.settings
            }
        });
        document.dispatchEvent(event);
    }

    // 外部から呼び出される更新メソッド
    refresh() {
        this.settings = this.storageService.loadSettings();
        this.updateDisplay();
    }
}