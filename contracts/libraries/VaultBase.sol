// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

abstract contract VaultBase is ReentrancyGuard, Ownable, Pausable, ERC20Burnable {
    constructor() Ownable(msg.sender) {}

    function pause() internal {
        _pause();
    }

    function unpause() internal {
        _unpause();
    }
}