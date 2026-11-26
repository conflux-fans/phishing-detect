# Fluent phishing domains

Static, host-only mirror for Fluent Wallet. This is not a list of sites visited by wallet users.

## Data source and attribution

The domain lists are derived from the [MetaMask eth-phishing-detect project and its contributors](https://github.com/MetaMask/eth-phishing-detect), specifically its [upstream configuration](https://github.com/MetaMask/eth-phishing-detect/blob/main/src/config.json). The upstream license notice reads **Copyright (C) 2018 kumavis**; the [unmodified license text](./LICENSE-MetaMask.txt) is **DON’T BE A DICK PUBLIC LICENSE, Version 1.2 (February 2021)**. The exact upstream commit used for each publication is in [source.json](./source.json).

Fluent filters the upstream data to hostname rules, normalizes, deduplicates and sorts them, and adds integrity metadata. Fluent maintains this mirror, not the original lists. This mirror is not an official MetaMask service and does not imply endorsement by MetaMask.

- [source.json](./source.json) is the small version stamp. `domainsSha256` is the SHA-256 of the exact UTF-8 bytes of `domains.json`, including its final newline.
- [domains.json](./domains.json) publishes the normalized whitelist and blacklist as one file. Whitelist entries take precedence. The feed excludes fuzzy matches and path rules; a path on a shared host is not a rule for the whole host.
- The stamp identifies the upstream commit and the SHA-256 of its original configuration and license. These hashes detect mismatched versions, not a compromise of the trusted repository.

A GitHub Action on `main` checks MetaMask every six hours (00:17, 06:17, 12:17, 18:17 UTC). It resolves the upstream commit once; validates both lists and the upstream license at that commit; and publishes a single fast-forward commit only when the normalized lists change. Invalid, incomplete or unexpectedly large changes fail without publishing. A license change requires manual review. The first schedule is active only after the workflow lands on the default branch.

Consumers should fetch the stamp first, download the list only if its hash differs, verify the bytes and keep the last validated copy on any failure. Do not submit browsing URLs to this repository.
