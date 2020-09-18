### Publishing checklist

- [ ] Update npm pkg version with `npm version {VERSION}`
- [ ] Generate changelog with `npx conventional-changelog-cli -i CHANGELOG.md -s`, and edit accordingly the version.
- [ ] Commit.
- [ ] Push tag `git push --follow-tags`.
