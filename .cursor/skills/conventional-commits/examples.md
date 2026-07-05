# Examples

chirimen-certified-devices 向けの Conventional Commits 例。

## 良い例

### devices

```
feat(devices): add ADS1015 device metadata
fix(devices): correct PCA9685_MX1508 example link
docs(devices): update ADS1015 wiring notes
```

### data / schema / tools

```
feat(data): add aliases for legacy example names
fix(schema): allow optional datasheet url in meta.yml
feat(tools): add validate-devices script
test(tools): add generate-devices unit tests
```

### generated

```
build(generated): regenerate devices.json
```

### workspace / ci

```
build(workspace): add commitlint and husky
docs(workspace): add contributing guide and commit conventions
ci(ci): add commitlint workflow
chore(workspace): update eslint config
```

### Breaking change

```
feat(tools): change devices.json output schema

BREAKING CHANGE: devices.json field names have been renamed
```

## 悪い例

| メッセージ | 問題 |
| --- | --- |
| `update files` | type / scope がない |
| `fix issue` | 曖昧すぎる summary |
| `feat: Added New Feature.` | 大文字始まり、ピリオドあり、過去形 |
| `feat(devices): add ADS1015 and fix schema` | 無関係な変更の混在 |
| `FEAT(devices): add ads1015` | type が大文字 |
| `feat(unknown): add device` | 未定義の scope |

## 参照

- [`SKILL.md`](SKILL.md)
- [`scopes.md`](scopes.md)
