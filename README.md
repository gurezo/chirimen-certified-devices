# CHIRIMEN コミュニティ 認定デバイスリポジトリ

CHIRIMEN 関連の認定デバイス情報、Example、ドライバー、画像、回路図、関連資料の所在を、デバイス単位で整理するためのリポジトリです。

## 現在のステータス

このリポジトリは現在、`chirimen.org/_data/partslist.csv` に登録された情報を基に、認定デバイス情報をデバイス単位へ再構成している移行・整備中のリポジトリです。

`devices/` 配下には、元データから機械的に生成された未整理・未確認の情報が含まれる場合があります。デバイス一覧は [`devices/`](devices/) および生成済みの [`generated/devices.json`](generated/devices.json) を参照してください。

## 認定デバイスの定義

このリポジトリでは、以下を **CHIRIMEN 認定デバイス** とします。

> `chirimen.org/_data/partslist.csv` に登録されているデバイス、または `data/supplemental-devices.yml` に登録されている upstream example 由来のデバイス

現時点では、各データの役割を次のように区別しています。

| データ | 現時点の役割 |
| --- | --- |
| `chirimen.org/_data/partslist.csv` | 同期元。認定デバイスの一次情報として参照する |
| `data/supplemental-devices.yml` | partslist 未登録だが upstream example があるデバイスの補完定義 |
| `devices/**/README.md` / `meta.yml` | デバイス単位に整理した説明とメタデータ |
| `generated/devices.json` | `devices/` と `data/*.yml` を集約した JSON。dashboard などが参照する |

将来的な正本の扱いは移行方針に従って変更する可能性があります（詳細は「移行方針・今後の構成」を参照）。

## 現在のデータフロー

現時点の実装は、おおむね次の流れです。

```text
chirimen.org/_data/partslist.csv
data/supplemental-devices.yml
        |
        | pnpm sync:devices
        v
devices/**/README.md
devices/**/meta.yml
        |
        | pnpm validate:devices
        v
構成・スキーマ検証
        |
        | pnpm generate:devices
        v
generated/devices.json
```

## 各データの役割

### devices/

各デバイスの情報は、`README.md` と `meta.yml` のセットで管理します。

```text
devices/<device-id>/
  ├── README.md
  └── meta.yml
```

#### README.md

`README.md` は、人間が読むための説明です。

主に以下を記載します。

- デバイス概要
- 使用するインターフェース
- 使用するパッケージ
- Example へのリンク
- 画像
- 回路図
- 注意点
- 備考

画像や回路図は、Markdown で直接表示します。

例:

```md
![ADS1015](https://raw.githubusercontent.com/chirimen-oh/chirimen.org/master/partsImgs/ADS1015.jpg)
```

#### meta.yml

`meta.yml` は、一覧生成や JSON 生成に使う機械処理向けのメタデータです。

主に以下を記載します。

- デバイス ID
- 型番
- tag
- category
- description
- image URL
- product URL
- Example 情報
- 回路図 URL
- datasheet URL
- reference URL
- 使用パッケージ
- 元リポジトリのパス
- platform
- status
- verified

### ディレクトリ名のルール

`devices/` 配下のディレクトリ名は、`chirimen.org/_data/partslist.csv` の「型番」列と `data/aliases.yml` を基に決定します。

```text
単一デバイス:
  devices/<型番>/

複数デバイス:
  devices/<型番>_<型番>/

remote + 単一デバイス:
  devices/remote_<型番>/

remote + 複数デバイス:
  devices/remote_<型番>_<型番>/
```

例:

```text
devices/ADS1015/
devices/PCA9685_MX1508/
devices/remote_ADT7410/
devices/remote_PCA9685_MX1508/
```

### data/

| パス | 役割 |
| --- | --- |
| `data/aliases.yml` | 型番・ディレクトリ名・旧 Example 名の表記揺れ吸収 |
| `data/platforms.yml` | `pizero-esm`, `legacy-gc-i2c` などの platform 定義 |

### generated/devices.json

`pnpm generate:devices` による自動生成物です。`devices/` と `data/*.yml` を集約した JSON で、dashboard などの参照元として利用します。手動編集しないでください。元データを修正した後は再生成し、差分をコミットします。詳細は [generated/README.md](generated/README.md) を参照してください。

### schema/ / tools/

| パス | 役割 |
| --- | --- |
| `schema/` | front matter / meta.yml の検証用 JSON Schema |
| `tools/` | 同期・検証・生成スクリプト |

### Example の状態

Example は、環境や履歴に応じて状態を分けます。

| status | 意味 |
| --- | --- |
| `primary` | 現在の主な Example |
| `archive` | 旧構成・参照用 Example |
| `legacy` | 過去の構成だが参照価値がある Example |
| `incubator` | 取り込み中・確認中の Example |
| `special` | 特殊な用途・環境の Example |

## ディレクトリ構成

```text
chirimen-certified-devices/
├── .github/
│   └── workflows/
├── data/
│   ├── aliases.yml
│   └── platforms.yml
├── devices/
│   └── <device-id>/
│       ├── README.md
│       └── meta.yml
├── generated/
│   ├── README.md
│   └── devices.json
├── schema/
├── tools/
│   ├── README.md
│   └── src/
│       ├── sync-devices.ts
│       ├── validate-devices.ts
│       └── generate-devices.ts
├── CONTRIBUTING.md
├── package.json
└── README.md
```

個別デバイス名は列挙せず、収録内容は [`devices/`](devices/) を参照してください。

## 開発環境

このリポジトリの開発環境は pnpm を主に使用します。

```sh
pnpm install
```

コミットメッセージと PR タイトルは [Conventional Commits](https://www.conventionalcommits.org/) に準拠します。詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## 同期・検証・生成コマンド

| コマンド | 役割 |
| --- | --- |
| `pnpm sync:devices` | `partslist.csv` を取得し、`devices/**/README.md` と `meta.yml` を生成する |
| `pnpm validate:devices` | `meta.yml`、ディレクトリ構成、aliases、platform、status などを検証する |
| `pnpm generate:devices` | `devices/` と `data/*.yml` を集約して `generated/devices.json` を生成する |

オプションや終了コードなどの詳細は [tools/README.md](tools/README.md) を参照してください。

### sync:devices の注意

`pnpm sync:devices` は対象の `devices/<dir>/` を削除してから再作成する洗い替え生成です。手動編集した `README.md` / `meta.yml` は上書きされる可能性があります。手動編集を保護する機能はありません。

- 初期移行・再同期向けのコマンドです。通常のコントリビューション確認では実行しないでください
- 実行前に差分を確認する場合は `pnpm sync:devices --dry-run` を利用できます

## デバイス情報の修正方法

通常の修正では、次のファイルを編集してください。

- `devices/**/README.md`
- `devices/**/meta.yml`
- `data/aliases.yml` / `data/platforms.yml`

`meta.yml` を変更した場合は、必要に応じて `pnpm generate:devices` を実行し、`generated/devices.json` の差分をコミットしてください。

`pnpm sync:devices` は洗い替え生成のため、通常のデバイス修正では実行しないでください。手動編集内容が失われる可能性があります。

このリポジトリでは、Markdown での参加を優先します。`meta.yml` の編集に不安がある場合は、`README.md` 本文だけを修正して Pull Request を作成してください。必要なメタデータ調整はメンテナが対応します。

## コントリビューション

Pull Request を作成する前に、次のコマンドで確認してください。

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:devices
pnpm generate:devices
```

`pnpm sync:devices` は破壊的な洗い替え処理を含むため、通常の確認コマンドには含めません。

コミットメッセージと PR タイトルは [Conventional Commits](https://www.conventionalcommits.org/) に準拠してください。詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## 移行方針・今後の構成

現時点では `partslist.csv` を同期元として利用しています。一方で、将来的には本リポジトリ (`devices/` および関連データ) を認定デバイス情報の正本とし、`partslist.csv` は互換性維持または移行元として扱う方針も検討しています。

この方針は確定事項ではありません。移行の進捗に合わせて README と運用を更新します。

## 関連ドキュメント

- [CONTRIBUTING.md](CONTRIBUTING.md) — コントリビューションと Conventional Commits
- [tools/README.md](tools/README.md) — `sync` / `validate` / `generate` の詳細
- [generated/README.md](generated/README.md) — 自動生成物の扱い
