# CHIRIMEN コミュニティ 認定デバイスリポジトリ

CHIRIMEN 関連の認定デバイス情報、Example、ドライバー、画像、回路図、関連資料の所在を、デバイス単位で整理するためのリポジトリです。

## 現在のステータス

このリポジトリは現在、`chirimen.org/_data/partslist.csv` に登録された情報を基に、認定デバイス情報をデバイス単位へ再構成している移行・整備中のリポジトリです。

`devices/` 配下には、元データから機械的に生成された未整理・未確認の情報が含まれる場合があります。デバイス一覧は [`devices/`](devices/) および生成済みの [`generated/devices.json`](generated/devices.json) を参照してください。

## 認定デバイスの定義

このリポジトリでは、以下を **CHIRIMEN 認定デバイス** とします。

> `chirimen.org/_data/partslist.csv` に登録されているデバイス

現時点では、各データの役割を次のように区別しています。

| データ | 現時点の役割 |
| --- | --- |
| `chirimen.org/_data/partslist.csv` | 同期元。認定デバイスの一次情報として参照する |
| `devices/**/README.md` / `meta.yml` | デバイス単位に整理した説明とメタデータ |
| `generated/devices.json` | `devices/` と `data/*.yml` を集約した JSON。dashboard などが参照する |

将来的な正本の扱いは移行方針に従って変更する可能性があります（詳細は「移行方針・今後の構成」を参照）。

## 現在のデータフロー

現時点の実装は、おおむね次の流れです。

```text
chirimen.org/_data/partslist.csv
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
chirimen-certified-devices
  ├── README.md
  ├── CONTRIBUTING.md
  ├── .github
  │   └── workflows
  │       ├── validate.yml
  │       └── generate.yml
  │
  ├── devices
  │   ├── ADS1015
  │   │   ├── README.md
  │   │   └── meta.yml
  │   │
  │   └── PCA9685_MX1508
  │       ├── README.md
  │       └── meta.yml
  │
  ├── data
  │   ├── aliases.yml
  │   └── platforms.yml
  │
  ├── generated
  │   ├── README.md
  │   └── devices.json
  │
  ├── schema
  │   ├── frontmatter.schema.json
  │   └── meta.schema.json
  │
  └── tools
      ├── README.md
      └── src
          ├── generate-devices.ts
          └── validate-devices.ts
```

## 開発環境

このリポジトリの開発環境は pnpm を主に使用します。

依存パッケージをインストールします。

```sh
pnpm install
```

主な検証コマンドは以下です。

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm sync:devices
pnpm validate:devices
pnpm generate:devices
```

`sync:devices` / `validate:devices` / `generate:devices` は現時点ではスタブ実装です（[#12](https://github.com/gurezo/chirimen-certified-devices/issues/12) 基盤、本実装は #9–#11）。

`pnpm test` は Vitest を実行します。テストファイルがまだ存在しない場合も、初期開発環境の検証として成功する設定です。

### コミットメッセージ

コミットメッセージと PR タイトルは [Conventional Commits](https://www.conventionalcommits.org/) に準拠します。詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## 編集方針

このリポジトリでは、Markdown での参加を優先します。

`meta.yml` の編集に不安がある場合は、`README.md` 本文だけを修正してください。  
必要なメタデータ調整はメンテナが対応します。
