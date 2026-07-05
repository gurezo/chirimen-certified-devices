# コントリビューションガイド

## コミットメッセージガイドライン

本プロジェクトでは [Conventional Commits](https://www.conventionalcommits.org/) に準拠したコミットメッセージを採用しています。

AI エージェント (Cursor 等) 向けの Conventional Commits ルール / Skill を以下に整備しています。手動でメッセージを書く場合の参考にもなります。

- Rules: [.cursor/rules/](.cursor/rules/)
  - [conventional-commits.mdc](.cursor/rules/conventional-commits.mdc) — 基本ルール
  - [pull-request-title.mdc](.cursor/rules/pull-request-title.mdc) — PR タイトル規約
- Skill: [.cursor/skills/conventional-commits/](.cursor/skills/conventional-commits/)
  - [SKILL.md](.cursor/skills/conventional-commits/SKILL.md) / [examples.md](.cursor/skills/conventional-commits/examples.md) / [scopes.md](.cursor/skills/conventional-commits/scopes.md)

### 形式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

- **type**: 変更の種類（`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`）
- **scope**: 変更対象のスコープ（下記一覧）
- **description**: 簡潔な説明（imperative mood、先頭は小文字、末尾はピリオドなし）

### スコープ一覧

| スコープ | 説明 |
| --- | --- |
| `workspace` | ルート設定・ツール・`.cursor/`・README / CONTRIBUTING 等 |
| `devices` | 認定デバイスの README / meta.yml (`devices/**/`) |
| `data` | 共通データ定義 (`data/*.yml`) |
| `generated` | 自動生成物 (`generated/`) |
| `schema` | JSON Schema (`schema/`) |
| `tools` | 生成・検証スクリプト (`tools/`) |
| `ci` | CI 設定変更 (GitHub Actions 等) |

### 例

```
feat(devices): add ADS1015 device metadata
fix(tools): correct validate-devices schema check
docs(workspace): update readme quick start
build(workspace): add commitlint and husky
ci(ci): add commitlint workflow
build(generated): regenerate devices.json
```

### 破壊的変更の書き方

Breaking change は `!` を使わず、footer に `BREAKING CHANGE: ` として記載します。

```
feat(tools): change devices.json output schema

BREAKING CHANGE: devices.json field names have been renamed
```

### Release 運用との関係

現時点では semantic-release / Nx Release 等の自動リリースは未導入です。Conventional Commits 規約は、将来の changelog 自動生成やバージョン管理に備えた形式として採用しています。

## Git フックのセットアップ（commitlint）

コミット時にメッセージ形式を自動検証するため、[Husky](https://typicode.github.io/husky/) と [commitlint](https://commitlint.js.org/) を利用しています。

### セットアップ手順

1. リポジトリをクローンしたあと、`pnpm install` を実行してください。
2. `package.json` の `prepare` スクリプトにより、Husky の Git フックが自動で有効になります。
3. 以降、`git commit` 時に commitlint が実行され、Conventional Commits に合致しないメッセージは拒否されます。

### ローカルでの検証

- **コミット時**: `commit-msg` フックでメッセージが検証されます。形式が不正な場合はコミットが中止されます。
- **PR 時**: GitHub Actions の `commitlint` ワークフローで、PR に含まれる全コミットが検証されます。

問題がある場合は、エラーメッセージに従ってメッセージを修正してください。
