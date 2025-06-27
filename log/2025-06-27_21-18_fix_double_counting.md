# 作業ログ: 初期資産額の二重計上修正
日時: 2025-06-27 21:18

## ユーザーの指示
初期資産額入力時にグラフが2倍になる問題を修正

## 発見した問題
1. setInitialAssetsで初期資産額をincomeDataに収入として記録
2. calculateCurrentBalanceでthis.initialAssets + totalIncomeで二重計上
3. グラフでも同様に二重計上が発生

## 修正方針
初期資産額を収入として記録しないようにsetInitialAssetsメソッドを修正

## 変更したファイル
- script.js: setInitialAssetsメソッドの修正

## 完了した作業
- [x] setInitialAssetsメソッドから収入記録部分を削除
- [x] 既存の初期資産額収入記録をクリーンアップする処理を追加
- [x] 修正をコミット・プッシュ

## 修正内容
- 初期資産額を収入として記録する処理を削除
- 過去の重複記録をクリーンアップする処理を追加
- 初期資産額はinitialAssetsプロパティのみで管理