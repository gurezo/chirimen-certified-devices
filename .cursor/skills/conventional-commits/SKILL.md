---
name: conventional-commits
description: Generates Conventional Commits messages and pull request titles for chirimen-certified-devices. Trigger when authoring commit messages, PR titles, or release notes, or when reviewing existing commit history for compliance.
---

# Conventional Commits for chirimen-certified-devices

このリポジトリ (CHIRIMEN 認定デバイスメタデータ) 向けに、Conventional Commits 準拠の commit message / PR title を生成・検証するための Skill。

## 目的

- commit message と PR title を [Conventional Commits](https://www.conventionalcommits.org/) に統一する。
- リポジトリ構成 (`devices/`, `data/`, `schema/`, `tools/`, `generated/`) に整合する scope を選ぶ。
- 将来的な changelog 自動生成 / semantic-release への接続を容易にする。
- AI が生成するメッセージの品質を安定化させる。

## 形式

```
<type>(<scope>): <summary>

[optional body]

[optional footer(s)]
```

## 適用ルール

1. **type は小文字** で、許可された値のみを使う (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`)。
2. **scope は小文字、ハイフン区切り**。`commitlint.config.ts` の `scope-enum` または `scopes.md` から選ぶ。
3. **summary は英語、命令形 (imperative mood)**。先頭は小文字、末尾にピリオドを付けない。
4. **type と変更内容を一致させる**。フォーマット変更のみは `style`、依存更新は `build`、CI 設定は `ci`。
5. **関連性のない変更を 1 つのコミットに混在させない**。
6. **breaking change** は footer に `BREAKING CHANGE: ` を記載する (`type!` 表記は使わない)。

## リポジトリ構成を踏まえた scope 選択

- 認定デバイスの README / meta.yml 変更 → `devices`。
- `data/aliases.yml`, `data/platforms.yml` 変更 → `data`。
- JSON Schema 変更 → `schema`。
- 生成・検証スクリプト変更 → `tools`。
- 自動生成物 (`generated/devices.json` 等) → `generated`。
- ルート設定・ツール (`package.json`, `pnpm-workspace.yaml`, `.husky/`, `commitlint.config.ts`, `.cursor/`) → `workspace`。
- GitHub Actions ワークフロー → `ci`。

詳細は [`scopes.md`](scopes.md) を参照。

## docs / ci / build / chore の使い分け

| 種別 | type | 例 |
| --- | --- | --- |
| README / CONTRIBUTING 等のドキュメント | `docs` | `docs(workspace): update readme quick start` |
| GitHub Actions ワークフロー追加・変更 | `ci` | `ci(ci): add commitlint workflow` |
| 依存追加・更新、ビルド設定 | `build` | `build(workspace): add commitlint and husky` |
| 上記に当てはまらない雑務 | `chore` | `chore(workspace): remove unused script` |

## 参照ファイル

- [`examples.md`](examples.md): 良い例と悪い例
- [`scopes.md`](scopes.md): scope 一覧と用途
- リポジトリ側: `commitlint.config.ts`, `CONTRIBUTING.md`, `.cursor/rules/`
