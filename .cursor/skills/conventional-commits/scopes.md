# Scopes

chirimen-certified-devices で使用可能な scope の一覧と用途。`commitlint.config.ts` の `scope-enum` と完全に一致させる。

## 一覧

| scope | 対象パス | 用途 |
| --- | --- | --- |
| `workspace` | リポジトリルート | `package.json`, `pnpm-workspace.yaml`, `.husky/`, `commitlint.config.ts`, `.cursor/`, `README.md`, `CONTRIBUTING.md` 等 |
| `devices` | `devices/**/` | 認定デバイスの `README.md` / `meta.yml` |
| `data` | `data/*.yml` | `aliases.yml`, `platforms.yml` 等の共通データ |
| `generated` | `generated/` | `devices.json` 等の自動生成物 |
| `schema` | `schema/` | `frontmatter.schema.json`, `meta.schema.json` 等 |
| `tools` | `tools/` | `validate-devices.ts`, `generate-devices.ts` 等 |
| `ci` | `.github/workflows/` | GitHub Actions ワークフロー |

## scope 選択の考え方

1. **単一ディレクトリに収まる変更**: そのディレクトリに対応する scope を使う。
   - 例: `devices/ADS1015/README.md` の変更 → `devices`
2. **複数ディレクトリに跨る変更**: 最も影響範囲の広い scope を優先する。判断がつかない場合は `workspace`。
3. **ルート設定・ツール変更**: `workspace`。
4. **GitHub Actions ワークフロー**: `ci`。

## 新規ディレクトリ追加時の手順

新しい主要ディレクトリやツールを追加した場合、以下を **同時に** 更新する。

1. `commitlint.config.ts` の `scope-enum` に新しい scope を追加。
2. このファイル (`scopes.md`) に新しい行を追加。
3. `CONTRIBUTING.md` のスコープ一覧を更新。

これらは同一 PR 内で行い、scope 一覧の単一情報源 (`commitlint.config.ts`) と一致させる。

## 参照

- [`SKILL.md`](SKILL.md)
- [`examples.md`](examples.md)
- リポジトリ側: `commitlint.config.ts`, `CONTRIBUTING.md`
