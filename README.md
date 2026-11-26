# Fluent phishing configuration

[config.json](./config.json) contains **Fluent-maintained rules only**. It is not a MetaMask mirror, and no scheduled job imports or republishes MetaMask data. Empty lists mean Fluent has not configured any exceptions or blocks.

Propose changes by pull request: include the hostname and reason, review false positives (especially shared hosting platforms), then merge. Use the MetaMask v2 configuration shape (`version: 2`, `whitelist`, `blacklist`, `fuzzylist`, `tolerance`). The Fluent wallet currently uses only hostname rules in the whitelist and blacklist. Do not add a full URL, path, wildcard or private browsing data. Allowlist entries also cover subdomains, so review their scope carefully.

The wallet fetches MetaMask's maintained rules independently from MetaMask's phishing-detection API. For historical attribution only: [the original mirrored data](https://github.com/MetaMask/eth-phishing-detect) credited Copyright (C) 2018 kumavis; [the upstream license notice](./LICENSE-MetaMask.txt) is retained for previous revisions. This repository is not an official MetaMask service.
