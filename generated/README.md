# generated

このディレクトリのファイルは **自動生成物** です。手編集しないでください。

## 含まれるファイル

| ファイル | 生成コマンド | 説明 |
| --- | --- | --- |
| `devices.json` | `pnpm generate:devices` | `devices/` と `data/*.yml` を集約した JSON |

## 修正方法

デバイス情報を変更する場合は、以下を編集してから `pnpm generate:devices` を再実行してください。

- `devices/**/README.md`
- `devices/**/meta.yml`
- `data/aliases.yml`
- `data/platforms.yml`
- `data/chirimen-drivers.yml`

生成後は `generated/devices.json` の差分をコミットしてください。
