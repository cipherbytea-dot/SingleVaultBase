# 🏦 SingleVault (ERC-4626)

![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.28-363636?style=flat-square&logo=solidity)
![Hardhat](https://img.shields.io/badge/Built%20With-Hardhat-yellow?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Network](https://img.shields.io/badge/Network-Sepolia-gF47?style=flat-square)

A robust, gas-optimized, and secure implementation of the **ERC-4626 Tokenized Vault Standard**. This vault allows users to deposit ERC-20 tokens (Assets) and receive vault shares (Shares) in return, representing their fractional ownership of the pool.

## 🚀 Features

### Core Functionality (ERC-4626)
- **Deposit:** User deposits Assets ➡️ Receives Shares.
- **Mint:** User requests specific Shares ➡️ Pays Assets.
- **Withdraw:** User burns Shares ➡️ Receives specific Assets.
- **Redeem:** User burns specific Shares ➡️ Receives Assets.

### 🛡️ Security & Rounding Protection
Implemented strict rounding logic to prevent dust attacks and inflation attacks (vault insolvency):
- **Favors the Vault:**
  - `Deposit` & `Redeem`: Uses `Math.Rounding.Floor` (User gets slightly less/exact).
  - `Mint` & `Withdraw`: Uses `Math.Rounding.Ceil` (User pays/burns slightly more).
- **Reentrancy Protection:** All state-changing functions are guarded with `nonReentrant`.
- **Access Control:** `Pausable` functionality restricted to the Contract Owner.

### ⚡ Optimization
- **Immutable Storage:** The underlying `VAULT_TOKEN` address is immutable to save gas on every call.
- **OpenZeppelin Integrated:** Built on top of battle-tested OpenZeppelin contracts.

---

## 🛠️ Tech Stack

- **Language:** Solidity `^0.8.28`
- **Framework:** Hardhat
- **Testing:** Chai & Ethers.js
- **Network:** Sepolia Testnet

---

## 🌐 Deployed Addresses (Sepolia)

| Contract | Address | Verification |
|----------|---------|--------------|
| **SingleVault** | `0x...MASUKIN_ADDRESS_VAULT_LU_DISINI...` | [View on Etherscan](https://sepolia.etherscan.io/address/ADDRESS_VAULT_LU_DISINI) |
| **Underlying Asset** | `0x...MASUKIN_ADDRESS_TOKEN_LU_DISINI...` | [View on Etherscan](https://sepolia.etherscan.io/address/ADDRESS_TOKEN_LU_DISINI) |

> *Note: The Underlying Asset is a mock ERC20 token deployed for testing purposes.*

---

## 💻 Local Development

### 1. Clone the Repository
```bash
git clone [https://github.com/USERNAME_LU/SingleVault-ERC4626.git](https://github.com/USERNAME_LU/SingleVault-ERC4626.git)
cd SingleVault-ERC4626
