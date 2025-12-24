// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/utils/math/Math.sol";

library Convert {
    function convertToShares(uint256 assets, uint256 total_Supply, uint256 total_Asset, Math.Rounding rounding) internal pure returns (uint256 shares) {
        if (total_Supply == 0 || total_Asset == 0) {
            return assets;
        }

        return Math.mulDiv(assets, total_Supply, total_Asset, rounding);
    }

    function convertToAssets(uint256 shares, uint256 total_Supply, uint256 total_Asset, Math.Rounding rounding) internal pure returns (uint256 assets) {
        if (total_Supply == 0 || total_Asset == 0) {
            return shares;
        }

        return Math.mulDiv(shares, total_Asset, total_Supply, rounding);
    }
}