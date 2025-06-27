/**
 * グラフ表示を担当するコンポーネント
 */
class ChartManager {
    constructor(storageService, financeCalculator) {
        this.storageService = storageService;
        this.financeCalculator = financeCalculator;
        this.assetChart = null;
        
        this.initializeChart();
        this.bindEvents();
    }

    bindEvents() {
        // 他のコンポーネントからの更新通知を受信
        document.addEventListener('financeUpdate', () => {
            this.updateChart();
        });

        document.addEventListener('dashboardUpdate', () => {
            this.updateChart();
        });

        document.addEventListener('wishlistUpdate', () => {
            this.updateChart();
        });
    }

    initializeChart() {
        const ctx = document.getElementById('assetChart').getContext('2d');
        
        this.assetChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            plugins: [this.createCurrentDateLinePlugin()],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '日付'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '資産額 (¥)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '資産推移予測'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ¥' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        this.updateChart();
    }

    createCurrentDateLinePlugin() {
        return {
            id: 'currentDateLine',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                const today = new Date().toDateString();
                
                // 今日の日付のインデックスを探す
                const todayIndex = chart.data.labels.findIndex(label => {
                    // ラベルを日付に変換して比較
                    const labelDate = this.parseLabelToDate(label);
                    return labelDate && labelDate.toDateString() === today;
                });
                
                if (todayIndex >= 0) {
                    const x = chart.scales.x.getPixelForValue(todayIndex);
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, chartArea.top);
                    ctx.lineTo(x, chartArea.bottom);
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = '#27ae60';
                    ctx.setLineDash([8, 4]);
                    ctx.stroke();
                    ctx.restore();
                    
                    // 「今日」ラベルを表示
                    ctx.save();
                    ctx.fillStyle = '#27ae60';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('今日', x, chartArea.top - 5);
                    ctx.restore();
                }
            }
        };
    }

    parseLabelToDate(label) {
        // "MM/DD" または "M/D" 形式のラベルを今年の日付に変換
        const match = label.match(/(\d{1,2})\/(\d{1,2})/);
        if (match) {
            const month = parseInt(match[1]);
            const day = parseInt(match[2]);
            const currentYear = new Date().getFullYear();
            return new Date(currentYear, month - 1, day);
        }
        return null;
    }

    updateChart() {
        const futureData = this.financeCalculator.predictFutureAssets(90); // 90日間
        const settings = this.storageService.loadSettings();
        const safetyLine = settings.safetyLine || 0;

        // ラベル（日付）を作成
        const labels = futureData.map(data => data.label);

        // 資産推移データ
        const assetData = futureData.map(data => data.assets);

        // セーフティーラインデータ（固定値）
        const safetyLineData = futureData.map(() => safetyLine);

        // データセットを更新
        this.assetChart.data = {
            labels: labels,
            datasets: [
                {
                    label: '予想資産',
                    data: assetData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }
            ]
        };

        // セーフティーラインが設定されている場合は追加
        if (safetyLine > 0) {
            this.assetChart.data.datasets.push({
                label: 'セーフティーライン',
                data: safetyLineData,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderDash: [10, 5],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0
            });
        }

        // 購入予定のマーカーを追加
        this.addPurchaseMarkers();

        this.assetChart.update();
    }

    addPurchaseMarkers() {
        const wishlist = this.storageService.loadWishlist();
        const purchaseData = this.assetChart.data.labels.map(() => null);

        wishlist.forEach(item => {
            if (item.plannedPurchaseDate && !item.isPurchased) {
                const plannedDateStr = item.plannedPurchaseDate.toLocaleDateString('ja-JP', {
                    month: 'numeric',
                    day: 'numeric'
                });

                const index = this.assetChart.data.labels.findIndex(label => 
                    label === plannedDateStr
                );

                if (index >= 0) {
                    // その日の資産額から購入価格を引いた値を表示
                    const assetAtDate = this.assetChart.data.datasets[0].data[index];
                    purchaseData[index] = assetAtDate - item.price;
                }
            }
        });

        // 購入後資産予測ラインを追加
        const hasPurchaseData = purchaseData.some(data => data !== null);
        if (hasPurchaseData) {
            this.assetChart.data.datasets.push({
                label: '購入後予想資産',
                data: purchaseData,
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                showLine: false // 点のみ表示
            });
        }
    }

    // 外部から呼び出される更新メソッド
    refresh() {
        this.updateChart();
    }

    // チャートを破棄
    destroy() {
        if (this.assetChart) {
            this.assetChart.destroy();
            this.assetChart = null;
        }
    }
}