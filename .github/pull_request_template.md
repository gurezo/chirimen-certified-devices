> PR タイトルは [Conventional Commits](https://www.conventionalcommits.org/) に準拠してください (例: `feat(devices): add ADS1015 device metadata`)。
> 利用可能な scope は [CONTRIBUTING.md](../CONTRIBUTING.md#スコープ一覧) と `commitlint.config.ts` を参照してください。

## Summary

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] Chore (build/test/ci)
- [ ] Breaking change

## Related issues

- Fixes #

## What changed?

-
-

## Schema / Generated output

- [ ] `schema/` の変更あり
  - Details:
- [ ] `generated/devices.json` の再生成が必要
- [ ] `devices/**/meta.yml` の変更あり
- [ ] `data/*.yml` の変更あり
- [ ] この変更は後方互換性がある
- [ ] この変更は破壊的変更を含む
  - Migration notes:

## How to test

1. `pnpm validate:devices`（デバイスメタデータ変更時）
2. `pnpm test`
3. `pnpm typecheck`
4. `pnpm sync:devices` / `pnpm generate:devices`（該当する場合）

## Environment (if relevant)

- Node version:
- pnpm version:

## Checklist

- [ ] PR タイトルが Conventional Commits に準拠している
- [ ] コミットメッセージが Conventional Commits に準拠している（commitlint 通過）
- [ ] ローカルでテストを実行した（利用可能な場合）
- [ ] `README.md` / `CONTRIBUTING.md` を必要に応じて更新した
- [ ] デバイスメタデータ変更時に `pnpm validate:devices` が通過する
