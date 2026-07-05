# CHIRIMEN コミュニティ 認定デバイスリポジトリ

CHIRIMEN 関連の認定デバイス情報、Example、ドライバー、画像、回路図、関連資料の所在を、デバイス単位で整理するためのリポジトリです。

## 認定デバイスの定義

このリポジトリでは、以下を **CHIRIMEN 認定デバイス** とします。

> `chirimen.org/_data/partslist.csv` に登録されているデバイス

このリポジトリは、`partslist.csv` を置き換えるものではありません。  
`partslist.csv` を認定デバイスの一次情報として参照し、各デバイスに対応する Example、ドライバー、画像、回路図、補足情報を整理します。

## 管理方針

各デバイスの情報は、`README.md` と `meta.yml` のセットで管理します。

```text
devices/<型番>/
  ├── README.md
  └── meta.yml
```

### README.md

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

回路図の例:

```md
![ADS1015 回路図](https://raw.githubusercontent.com/chirimen-oh/chirimen/master/gc/i2c/i2c-ADS1015/schematic.png)
```

### meta.yml

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

`meta.yml` の編集が不安な場合は、`README.md` だけ修正して Pull Request を作成してください。  
必要なメタデータ調整はメンテナが対応します。

## ディレクトリ名のルール

`devices/` 配下のディレクトリ名は、`chirimen.org/_data/partslist.csv` の「型番」列を正本として決定します。

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
  ├── README.md
  └── meta.yml

devices/PCA9685_MX1508/
  ├── README.md
  └── meta.yml

devices/remote_ADT7410/
  ├── README.md
  └── meta.yml

devices/remote_PCA9685_MX1508/
  ├── README.md
  └── meta.yml
```

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

## 各ディレクトリの役割

| パス                     | 役割                                               |
| ------------------------ | -------------------------------------------------- |
| `devices/**/README.md`   | 各デバイスの説明。人間が読む・編集する             |
| `devices/**/meta.yml`    | 各デバイスの機械処理向けメタデータ                 |
| `data/aliases.yml`       | 型番・ディレクトリ名・旧 Example 名の表記揺れ吸収  |
| `data/platforms.yml`     | `pizero-esm`, `legacy-gc-i2c` などの platform 定義 |
| `generated/devices.json` | 自動生成物。手編集しない                           |
| `schema/`                | front matter / meta.yml の検証用                   |
| `tools/`                 | 生成・検証スクリプト                               |

## Example の状態

Example は、環境や履歴に応じて状態を分けます。

| status      | 意味                                 |
| ----------- | ------------------------------------ |
| `primary`   | 現在の主な Example                   |
| `archive`   | 旧構成・参照用 Example               |
| `legacy`    | 過去の構成だが参照価値がある Example |
| `incubator` | 取り込み中・確認中の Example         |
| `special`   | 特殊な用途・環境の Example           |

## 生成物について

`generated/` 以下のファイルは自動生成物です。  
直接編集しないでください。

デバイス情報を修正する場合は、以下を編集してください。

- `devices/**/README.md`
- `devices/**/meta.yml`
- `data/*.yml`

将来的には、`README.md`、`meta.yml`、`data/*.yml`、`partslist.csv` を元に、以下の JSON を生成することを想定しています。

```text
generated/devices.json
```

## 初期対象

初期段階では、以下を対象にします。

- `devices/ADS1015/`
- `devices/PCA9685_MX1508/`

今後、`partslist.csv` に登録済みのデバイスを順次追加します。

## 編集方針

このリポジトリでは、Markdown での参加を優先します。

`meta.yml` の編集に不安がある場合は、`README.md` 本文だけを修正してください。  
必要なメタデータ調整はメンテナが対応します。
