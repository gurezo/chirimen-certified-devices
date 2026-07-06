# tools

デバイスメタデータの同期・検証・生成スクリプトです。

## コマンド

| コマンド | 用途 | 実装 issue |
| --- | --- | --- |
| `pnpm sync:devices` | `partslist.csv` から `devices/` を生成 | [#9](https://github.com/gurezo/chirimen-certified-devices/issues/9) |
| `pnpm validate:devices` | `devices/**/meta.yml` とディレクトリ構成を検証 | [#10](https://github.com/gurezo/chirimen-certified-devices/issues/10) |
| `pnpm generate:devices` | `generated/devices.json` を生成 | [#11](https://github.com/gurezo/chirimen-certified-devices/issues/11) |

## 現状

各エントリポイントはスタブ実装です。`tsx` で起動でき、後続 issue で本実装に置き換えます。

```sh
pnpm sync:devices
pnpm validate:devices
pnpm generate:devices
```
