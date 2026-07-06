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

## その他のコマンド

`validate:devices` と `generate:devices` は現時点ではスタブ実装です。

```sh
pnpm validate:devices
pnpm generate:devices
```
