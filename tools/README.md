# tools

デバイスメタデータの同期・検証・生成スクリプトです。

## コマンド

| コマンド | 用途 | 実装 issue |
| --- | --- | --- |
| `pnpm sync:devices` | `partslist.csv` から `devices/` を生成 | [#9](https://github.com/gurezo/chirimen-certified-devices/issues/9) |
| `pnpm validate:devices` | `devices/**/meta.yml` とディレクトリ構成を検証 | [#10](https://github.com/gurezo/chirimen-certified-devices/issues/10) |
| `pnpm generate:devices` | `generated/devices.json` を生成 | [#11](https://github.com/gurezo/chirimen-certified-devices/issues/11) |

## sync:devices

`chirimen.org/_data/partslist.csv` を取得し、`devices/<dir>/README.md` と `meta.yml` を洗い替え生成します。

```sh
pnpm sync:devices
```

### オプション

| オプション | デフォルト | 説明 |
| --- | --- | --- |
| `--dry-run` | off | 作成予定のディレクトリを表示のみ（ファイルは書き込まない） |
| `--only-supplemental` | off | `data/supplemental-devices.yml` のデバイスだけを書き込む（partslist 由来は触らない） |
| `--csv-url <url>` | chirimen.org の `partslist.csv` | CSV 取得 URL を上書き |
| `--devices-dir <path>` | `devices/` | 出力先ディレクトリ |

例:

```sh
pnpm sync:devices --dry-run
pnpm sync:devices --devices-dir devices/
pnpm sync:devices --only-supplemental
```

### 動作

1. `partslist.csv` をパースし、`data/supplemental-devices.yml` をマージ（同型番は partslist 優先）
2. `data/aliases.yml` に基づいて単体・複合・remote デバイスにグルーピング
3. `data/chirimen-drivers.yml` の許可リストに基づき、`examples[].driver` と README の jsDelivr リンクを付与
4. 各デバイスについて `meta.yml` と `README.md` を生成
5. 生成前に `schema/meta.schema.json` で検証
6. 対象の `devices/<dir>/` を削除してから再作成（洗い替え）

`--only-supplemental` では partslist の取得・洗い替えを行わず、supplemental に定義したデバイスのみを書き込みます。upstream example はあるが partslist 未登録のデバイスを登録する用途です。

Example URL が分類できないデバイスは警告を出してスキップします。

### chirimen-drivers.yml

`data/chirimen-drivers.yml` は [chirimen-drivers README](https://github.com/chirimen-oh/chirimen-drivers/blob/master/README.md) の Download セクションのスナップショットです。`packages` がこのリストにあるときだけ、README に jsDelivr リンクを付け、`pizero-esm` の `examples[].driver` にパッケージソース URL を入れます。chirimen-drivers 側でパッケージが増減したら、このファイルを更新してください。

### supplemental-devices.yml

`data/supplemental-devices.yml` は partslist にまだ無いが upstream example があるデバイスを定義します。`qrcodescanner` のような汎用デモは含めません。

## validate:devices

`devices/` 配下の `meta.yml` とディレクトリ構成を検証します。`sync:devices` 実行後の品質確認や CI 連携を想定しています。

```sh
pnpm validate:devices
```

### オプション

| オプション | デフォルト | 説明 |
| --- | --- | --- |
| `--devices-dir <path>` | `devices/` | 検証対象ディレクトリ |

例:

```sh
pnpm validate:devices --devices-dir devices/
```

### 検証内容

1. 各 `devices/<dir>/meta.yml` が `schema/meta.schema.json` に適合すること
2. 各 `devices/<dir>/` に `README.md` と `meta.yml` が存在すること
3. ディレクトリ名と `meta.yml` の `id` / `model` の整合性
4. `data/aliases.yml` で定義された composite / remote デバイスが `devices/` に存在すること
5. `examples[].platform` が `data/platforms.yml` に定義されていること
6. `examples[].status` が許可値（`primary`, `archive`, `legacy`, `incubator`, `special`）であること

### 終了コード

| コード | 意味 |
| --- | --- |
| `0` | 検証成功 |
| `1` | 検証エラーあり、または実行時エラー |

エラー時は `path: message` 形式で stderr に出力します。

## generate:devices

`devices/` 配下の `meta.yml` / `README.md` と `data/*.yml` を集約し、`generated/devices.json` を生成します。dashboard 等の参照元として利用する集約 JSON です。

```sh
pnpm generate:devices
```

### オプション

| オプション | デフォルト | 説明 |
| --- | --- | --- |
| `--dry-run` | off | JSON を stdout に出力のみ（ファイルは書き込まない） |
| `--devices-dir <path>` | `devices/` | 入力ディレクトリ |
| `--output <path>` | `generated/devices.json` | 出力ファイル |

例:

```sh
pnpm generate:devices --dry-run
pnpm generate:devices --output generated/devices.json
```

### 出力形式

`generated/devices.json` は以下の集約形式です。

- `platforms` — `data/platforms.yml` の内容
- `aliases` — `data/aliases.yml` の内容
- `devices[]` — 各デバイスの正規化済み `meta.yml`、README front matter、相対パス

`devices[]` は `id` 順にソートされます。`meta.examples[]` には `platformLabel` が付与されます。

### 終了コード

| コード | 意味 |
| --- | --- |
| `0` | 生成成功 |
| `1` | 入力エラーあり、または実行時エラー |

エラー時は `path: message` 形式で stderr に出力します。
