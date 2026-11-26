# Fluent phishing domains

Static, host-only mirror for Fluent Wallet, derived from [MetaMask eth-phishing-detect](https://github.com/MetaMask/eth-phishing-detect). See [LICENSE-MetaMask.txt](./LICENSE-MetaMask.txt) for the upstream license. This is not a list of sites visited by wallet users.

- [source.json](./source.json) is the small version stamp. `domainsSha256` is the SHA-256 of the exact UTF-8 bytes of `domains.json`, including its final newline.
- [domains.json](./domains.json) publishes the normalized whitelist and blacklist as one file. Whitelist entries take precedence. The feed excludes fuzzy matches and path rules; a path on a shared host is not a rule for the whole host.
- The stamp identifies the upstream commit and the SHA-256 of its original configuration and license. These hashes detect mismatched versions, not a compromise of the trusted repository.

Consumers should fetch the stamp first, download the list only if its hash differs, verify the bytes and keep the last validated copy on any failure. Do not submit browsing URLs to this repository.
