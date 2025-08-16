# デプロイメントガイド

## GitHub Pages（フロントエンドのみ）

このプロジェクトはGitHub Pagesでフロントエンドを自動デプロイするよう設定されています。

### 手順

1. **GitHubリポジトリを作成**
   ```bash
   # GitHubでリポジトリを作成後
   git remote add origin https://github.com/your-username/pdf-page-cutter.git
   git branch -M main
   git push -u origin main
   ```

2. **GitHub Pagesを有効化**
   - GitHubリポジトリの Settings > Pages に移動
   - Source を "GitHub Actions" に設定
   - 自動的にワークフローが実行され、デプロイされます

3. **アクセス**
   - デプロイ後、`https://your-username.github.io/pdf-page-cutter/` でアクセス可能

### 注意点

- フロントエンドのみがデプロイされます
- PDF処理機能は**ローカルでのみ動作**します
- 本番環境でPDF処理を使用するには別途APIサーバーのデプロイが必要です

## APIサーバーのデプロイ（オプション）

フル機能を利用するには、APIサーバーを別途デプロイする必要があります。

### Herokuでのデプロイ例

1. **Herokuアプリを作成**
   ```bash
   heroku create your-pdf-cutter-api
   ```

2. **server/ ディレクトリを単独でデプロイ**
   ```bash
   # serverディレクトリを別リポジトリとして準備
   cp -r server/ ../pdf-cutter-api/
   cd ../pdf-cutter-api/
   git init
   git add .
   git commit -m "Initial API server deployment"
   heroku git:remote -a your-pdf-cutter-api
   git push heroku main
   ```

3. **フロントエンドの設定を更新**
   - `client/src/utils/api.ts` の API_BASE を実際のHeroku URLに変更
   - 再デプロイ

### Railway, Render, Vercelでのデプロイ

同様の手順で他のプラットフォームにもデプロイ可能です。`server/` ディレクトリを単独でデプロイしてください。

## 環境変数

### APIサーバー用
- `PORT`: サーバーポート（デフォルト: 3001）
- `NODE_ENV`: 環境（production推奨）

### フロントエンド用
- ビルド時に `client/src/utils/api.ts` の API_BASE が自動設定されます

## ローカル開発とプロダクションの違い

| 機能 | ローカル開発 | GitHub Pages | フル本番環境 |
|------|-------------|-------------|------------|
| フロントエンド | ✅ | ✅ | ✅ |
| PDF処理 | ✅ | ❌ | ✅ |
| ファイルアップロード | ✅ | ❌ | ✅ |
| プレビュー | ✅ | ❌ | ✅ |

## トラブルシューティング

### GitHub Actionsが失敗する場合
- Node.jsのバージョンを確認
- package-lock.jsonが存在することを確認
- 依存関係のインストールエラーをチェック

### デプロイ後にアクセスできない場合
- GitHub Pagesの設定を確認
- ブラウザのキャッシュをクリア
- DevToolsでConsoleエラーをチェック

### APIサーバーのデプロイエラー
- Herokuのログを確認: `heroku logs --tail`
- 環境変数の設定を確認
- package.jsonの"start"スクリプトを確認