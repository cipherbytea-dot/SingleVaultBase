// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {VaultBase} from "./libraries/VaultBase.sol";
import {Convert} from "./Convert.sol";
import {assetNotZero,noZeroAddress,insufficientBalanceinVault,sharesNoZero} from "../customError/customError.sol";

contract SingleVaultBase is ERC20, VaultBase {
  IERC20 public immutable VAULT_TOKEN;

  constructor(address _vaultToken) ERC20("My Vault Shares","MVS") {
    VAULT_TOKEN = IERC20(_vaultToken);
  } 

  event Deposit (
    address indexed sender,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  event Withdraw (
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  function totalAssets() public view returns (uint256) {
    return VAULT_TOKEN.balanceOf(address(this));
  }

  // CONVERT TEAM

  function convertToShares(uint256 assets) public view returns (uint256 shares) {
    return Convert.convertToShares(assets, totalSupply(), totalAssets(), Math.Rounding.Floor);
  }

  function convertToAssets(uint256 shares) public view returns (uint256 assets) {
    return Convert.convertToAssets(shares, totalSupply(), totalAssets(), Math.Rounding.Floor);
  }

  // DEPOSIT TEAM

  function maxDeposit(address receiver) public view returns (uint256 maxAssets) {
    if (receiver == address(0)) {
      return 0;
    }

    if (paused()) {
      return 0;
    }

    return type(uint256).max;
  }

  function previewDeposit(uint256 assets) public view returns (uint256 shares) {
    return Convert.convertToShares(assets, totalSupply(), totalAssets(), Math.Rounding.Floor);
  }

  function deposit(uint256 assets, address receiver) public whenNotPaused nonReentrant returns (uint256 shares) {
    // CHECK
    if (assets == 0) {
      revert assetNotZero();
    }

    if (receiver == address(0)) {
      revert noZeroAddress();
    }

    // INTERACTIONS
    shares = previewDeposit(assets);
    VAULT_TOKEN.transferFrom(msg.sender, address(this), assets);

    // EFFECT
    _mint(receiver, shares);
    
    emit Deposit(msg.sender, receiver, assets, shares);
  }

  // MINT TEAM

  function maxMint(address receiver) public view returns (uint256 maxShares) {
    if (receiver == address(0)) {
      return 0;
    }

    if (paused()) {
      return 0;
    }

    return type(uint256).max;
  }

  function previewMint(uint256 shares) public view returns (uint256 assets) {
    return Convert.convertToAssets(shares, totalSupply(), totalAssets(), Math.Rounding.Ceil);
  }

  function mint(uint256 shares, address receiver) public whenNotPaused nonReentrant returns (uint256 assets) {
    if (shares == 0) {
      revert sharesNoZero();
    }

    if (receiver == address(0)) {
      revert noZeroAddress();
    }

    assets = previewMint(shares);
    VAULT_TOKEN.transferFrom(msg.sender, address(this), assets);

    _mint(receiver, shares);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  // WITHDRAW TEAM

  function maxWithdraw(address owner) public view returns (uint256 maxAssets) {
    if (owner == address(0)) {
      return 0;
    }

    if (paused()) {
      return 0;
    }

    return type(uint256).max;
  }

  function previewWithdraw(uint256 assets) public view returns (uint256 shares) {
    return Convert.convertToShares(assets, totalSupply(), totalAssets(), Math.Rounding.Ceil);
  }

  function withdraw(uint256 assets, address receiver, address owner) public whenNotPaused nonReentrant returns (uint256 shares) {
    // CHECK
    if (assets == 0) {
      revert assetNotZero();
    }

    if (receiver == address(0) || owner == address(0)) {
      revert noZeroAddress();
    }

    // EFFECT
    shares = previewWithdraw(assets);

    if (balanceOf(owner) < shares) {
        revert insufficientBalanceinVault(); 
    }

    if (msg.sender != owner) {
      burnFrom(owner, shares);
    } else {
      _burn(owner, shares);
    }

    // INTERACTIONS
    VAULT_TOKEN.transfer(receiver, assets);

    emit Withdraw(msg.sender, receiver, owner, assets, shares);
  }

  // REDEEM TEAM 
  
  function maxRedeem(address owner) public view returns (uint256 maxShares) {
    if (owner == address(0)) {
      return 0;
    }

    if (paused()) {
      return 0;
    }

    return type(uint256).max;
  }

  function previewRedeem(uint256 shares) public view returns (uint256 assets) {
    return Convert.convertToAssets(shares, totalSupply(), totalAssets(), Math.Rounding.Floor);
  }

  function redeem(uint256 shares, address receiver, address owner) public whenNotPaused nonReentrant returns (uint256 assets) {
    if (shares == 0) {
      revert sharesNoZero();
    }

    if (receiver == address(0) || owner == address(0)) {
      revert noZeroAddress();
    }
    
    assets = previewRedeem(shares);

    if (msg.sender != owner) {
      burnFrom(owner, shares);
    } else {
      _burn(owner, shares);
    }

    VAULT_TOKEN.transfer(receiver, assets);

    emit Withdraw(msg.sender, receiver, owner, assets, shares);
  }

  function setPause() external onlyOwner {
    pause();
  }

  function setUnpause() external onlyOwner {
    unpause();
  }
}
