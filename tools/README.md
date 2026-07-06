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
| `--csv-url <url>` | chirimen.org の `partslist.csv` | CSV 取得 URL を上書き |
| `--devices-dir <path>` | `devices/` | 出力先ディレクトリ |

例:

```sh
pnpm sync:devices --dry-run
pnpm sync:devices --devices-dir devices/
```

### 動作

1. `partslist.csv` をパースし、`data/aliases.yml` に基づいて単体・複合・remote デバイスにグルーピング
2. 各デバイスについて `meta.yml` と `README.md` を生成
3. 生成前に `schema/meta.schema.json` で検証
4. 対象の `devices/<dir>/` を削除してから再作成（洗い替え）

Example URL が分類できないデバイスは警告を出してスキップします。

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

## その他のコマンド

`generate:devices` は現時点ではスタブ実装です。

```sh
pnpm generate:devices
```
