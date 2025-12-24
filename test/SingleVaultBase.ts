import { expect } from "chai";
import { ZeroAddress } from "ethers";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();

describe("SingleVaultBase", () => {
  const DEPOSIT_VALUE = 100n * 10n**18n;

  async function deployVaultFixture() {
    const [owner, nonOwner] = await ethers.getSigners();

    const token: any = await ethers.deployContract("myToken");
    await token.waitForDeployment();
    
    const singleVault: any = await ethers.deployContract("SingleVaultBase", [token.target]);
    await singleVault.waitForDeployment();

    return { singleVault, owner, nonOwner, token };
  };

  // --- DEPOSIT FUNCTION TESTER ---
  it("maxDeposit is ZERO because receiver ZeroAddress", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    expect(
      await singleVault.connect(owner).maxDeposit(ZeroAddress)
    ).to.equal(0);
  })

  it("maxDeposit is ZERO because contract is paused", async () => {
    const { singleVault, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await singleVault.connect(owner).setPause();

    expect(
      await singleVault.connect(nonOwner).maxDeposit(nonOwner)
    ).to.equal(0);
  })

  it("maxDeposit succeeded because contract don't paused", async () => {
    const { singleVault, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    expect(
      await singleVault.connect(nonOwner).maxDeposit(nonOwner)
    ).to.equal(ethers.MaxUint256)
  })

  it("previewDeposit return 100 because 2 : 1", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault, profit);

    const userDepositValue = 200n * 10n**18n;

    await token.connect(nonOwner).approve(singleVault, userDepositValue);
    await token.connect(owner).transfer(nonOwner, userDepositValue);

    const shares = 100n * 10n**18n;

    expect(
      await singleVault.connect(nonOwner).previewDeposit(userDepositValue)
    ).to.equal(shares);
  });

  it("Deposit failed because function is paused", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await singleVault.connect(owner).setPause();
    await token.connect(nonOwner).approve(singleVault.target, DEPOSIT_VALUE);

    await expect(
      singleVault.connect(nonOwner).deposit(DEPOSIT_VALUE, owner)
    ).to.be.revertedWithCustomError(
      singleVault,
      "EnforcedPause"
    )
  });

  it("Deposit failed because assets ZERO.", async () => {
    const { singleVault, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await expect(
      singleVault.connect(nonOwner).deposit(0, nonOwner.address)
    ).to.be.revertedWithCustomError(
      singleVault,
      "assetNotZero"
    );
  });

  it("Deposit failed because address ZERO.", async () => {
    const { singleVault, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await expect(
      singleVault.connect(nonOwner).deposit(DEPOSIT_VALUE, ZeroAddress)
    ).to.be.revertedWithCustomError(
      singleVault,
      "noZeroAddress"
    );
  });

  it("Deposit succced 1 : 1 scenario.", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture); 

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);

    await expect(
      singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address)
    )
    .to.emit(singleVault, "Deposit")
    .withArgs(owner.address, owner.address, DEPOSIT_VALUE, DEPOSIT_VALUE);

    expect(
      await singleVault.balanceOf(owner.address)
    ).to.equal(DEPOSIT_VALUE);
  });

  it("Deposit succed with profesional scenario.", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault, profit);

    const userDepositAmount = 200n * 10n**18n;
    await token.connect(owner).transfer(nonOwner, userDepositAmount);
    await token.connect(nonOwner).approve(singleVault, userDepositAmount);

    const expectedShares = 100n * 10n**18n;

    await expect(
      singleVault.connect(nonOwner).deposit(userDepositAmount, nonOwner)
    ).to.emit(
      singleVault,
      "Deposit"
    ).withArgs(
      nonOwner,
      nonOwner,
      userDepositAmount,
      expectedShares
    );

    expect(
      await singleVault.balanceOf(nonOwner)
    ).to.equal(expectedShares);
  });

  // --- MINT FUNCTION TESTER ---
  it("maxMint is ZERO because receiver is ZeroAddress", async () => {
    const { singleVault, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture); 

    expect(
      await singleVault.connect(nonOwner).maxMint(ZeroAddress)
    ).to.equal(0);
  });

  it("maxMint is ZERO because contract is paused", async () => {
    const { singleVault, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await singleVault.connect(owner).setPause();

    expect(
      await singleVault.connect(nonOwner).maxMint(nonOwner)
    ).to.equal(0)
  });

  it("maxMint is succeded because contract don't pause", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    expect(
      await singleVault.connect(owner).maxMint(owner)
    ).to.equal(ethers.MaxUint256);
  });

  it("previewMint return 50 asset", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    // 100 : 100 == 1 : 1
    await token.connect(owner).approve(singleVault, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    // 200 : 100 == 2 : 1
    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault, profit);

    const userMintAmount = 50n * 10n**18n;
    const expectedAsset = 100n * 10n**18n;

    expect(
      await singleVault.connect(nonOwner).previewMint(userMintAmount)
    ).to.equal(expectedAsset)
  });

  it("mint is failed because shares is ZERO", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await expect(
      singleVault.connect(owner).mint(0, owner)
    ).to.be.revertedWithCustomError(
      singleVault,
      "sharesNoZero"
    )
  });

  it("mint is failed because address receiver is ZERO", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await expect(
      singleVault.connect(owner).mint(200n * 10n**18n, ZeroAddress)
    ).to.be.revertedWithCustomError(
      singleVault,
      "noZeroAddress"
    )
  });

  it("mint succeed 1 : 1 scenario", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture); 

    await token.connect(owner).approve(singleVault, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    const sharesValue = 50n * 10n**18n;
    await token.connect(owner).approve(singleVault, sharesValue);

    await expect(
      singleVault.connect(owner).mint(sharesValue, owner)
    ).to.emit(singleVault, "Deposit")
    .withArgs(owner, owner, sharesValue, sharesValue)
  });

  it("mint succeed with professional scenario", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    // 100 : 100 == 1 : 1
    await token.connect(owner).approve(singleVault, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    // 200 : 100 == 2 : 1
    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault, profit);

    const userMintAmount = 10n * 10n**18n;
    const expectedAsset = 20n * 10n**18n;

    await token.connect(nonOwner).approve(singleVault, expectedAsset);
    await token.connect(owner).transfer(nonOwner, 1000n * 10n**18n);

    expect(
      await singleVault.connect(nonOwner).mint(userMintAmount, nonOwner)
    ).to.emit(
      singleVault,
      "Deposit"
    ).withArgs(
      nonOwner,
      nonOwner,
      expectedAsset,
      userMintAmount
    );
  });

  // --- WITHDRAW FUNCTION TESTER ---
  it("maxWithdraw is ZERO because receiver is ZeroAddress", async () => {
    const { singleVault, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture); 

    expect(
      await singleVault.connect(nonOwner).maxWithdraw(ZeroAddress)
    ).to.equal(0);
  });

  it("maxWithdraw is ZERO because contract is paused", async () => {
    const { singleVault, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await singleVault.connect(owner).setPause();

    expect(
      await singleVault.connect(nonOwner).maxWithdraw(nonOwner)
    ).to.equal(0)
  });

  it("maxWithdraw is succeed because contract don't pause", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    expect(
      await singleVault.connect(owner).maxWithdraw(owner)
    ).to.equal(ethers.MaxUint256);
  });

  it("previewWithdraw return 100 because 2 : 1", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault, profit);

    const userWithdrawValue = 200n * 10n**18n;

    const shares = 100n * 10n**18n;

    expect(
      await singleVault.connect(nonOwner).previewWithdraw(userWithdrawValue)
    ).to.equal(shares);
  });

  it("Withdraw failed because vault is PAUSED", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address);

    await singleVault.connect(owner).setPause();

    const withdrawAmount = 50n * 10n**18n; 
    
    await expect(
      singleVault.connect(owner).withdraw(withdrawAmount, owner.address, owner.address)
    ).to.be.revertedWithCustomError(
      singleVault,
      "EnforcedPause" 
    );
  });

  it("Withdraw failed because Insufficient Share Balance", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address);

    const tooMuchAmount = 200n * 10n**18n;

    await expect(
      singleVault.connect(owner).withdraw(tooMuchAmount, owner.address, owner.address)
    ).to.be.revertedWithCustomError(
      singleVault,
      "insufficientBalanceinVault"
    );
  });

  it("Withdraw succeed: Owner withdraws half balance", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address);

    const withdrawAmount = 50n * 10n**18n; 
    const expectedBurnedShares = 50n * 10n**18n; 

    const ownerTokenBalanceBefore = await token.balanceOf(owner.address);

    await expect(
      singleVault.connect(owner).withdraw(withdrawAmount, owner.address, owner.address)
    )
    .to.emit(singleVault, "Withdraw")
    .withArgs(
      owner.address, 
      owner.address, 
      owner.address, 
      withdrawAmount,
      expectedBurnedShares
    );
    
    expect(await singleVault.balanceOf(owner.address)).to.equal(50n * 10n**18n);

    const ownerTokenBalanceAfter = await token.balanceOf(owner.address);
    expect(ownerTokenBalanceAfter).to.equal(ownerTokenBalanceBefore + withdrawAmount);

    expect(await singleVault.totalAssets()).to.equal(50n * 10n**18n);
  });

  it("Withdraw Scenario 2: Profit Generated (1 Share = 2 Assets)", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address);

    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault.target, profit);

    const withdrawAmount = 100n * 10n**18n; 
    const expectedBurn = 50n * 10n**18n;    

    const ownerShareBefore = await singleVault.balanceOf(owner.address);

    await expect(
      singleVault.connect(owner).withdraw(withdrawAmount, owner.address, owner.address)
    )
    .to.emit(singleVault, "Withdraw")
    .withArgs(
      owner.address, 
      owner.address, 
      owner.address, 
      withdrawAmount, 
      expectedBurn 
    );

    expect(await singleVault.balanceOf(owner.address)).to.equal(ownerShareBefore - expectedBurn);

    expect(await singleVault.totalAssets()).to.equal(100n * 10n**18n);
  });

  // --- REDEEM FUNCTION TESTER ---
  
  it("maxRedeem is ZERO because owner is ZeroAddress", async () => {
    const { singleVault, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture); 

    expect(
      await singleVault.connect(nonOwner).maxRedeem(ZeroAddress)
    ).to.equal(0);
  });

  it("maxRedeem is ZERO because contract is paused", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await singleVault.connect(owner).setPause();

    expect(
      await singleVault.connect(owner).maxRedeem(owner)
    ).to.equal(0)
  });

  it("maxRedeem is succeeded because contract don't pause", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    expect(
      await singleVault.connect(owner).maxRedeem(owner)
    ).to.equal(ethers.MaxUint256);
  });

  it("previewRedeem return 100 assets because 2 : 1", async () => {
    const { singleVault, token, owner, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault, profit);

    const sharesToRedeem = 50n * 10n**18n;
    const expectedAssets = 100n * 10n**18n;

    expect(
      await singleVault.connect(nonOwner).previewRedeem(sharesToRedeem)
    ).to.equal(expectedAssets);
  });

  it("Redeem failed because vault is PAUSED", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address);

    await singleVault.connect(owner).setPause();

    const redeemShares = 50n * 10n**18n; 
    
    await expect(
      singleVault.connect(owner).redeem(redeemShares, owner.address, owner.address)
    ).to.be.revertedWithCustomError(
      singleVault,
      "EnforcedPause" 
    );
  });

  it("Redeem failed because shares is ZERO", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await expect(
      singleVault.connect(owner).redeem(0, owner.address, owner.address)
    ).to.be.revertedWithCustomError(
      singleVault,
      "sharesNoZero"
    );
  });

  it("Redeem failed because address receiver is ZERO", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner);

    await expect(
      singleVault.connect(owner).redeem(DEPOSIT_VALUE, ZeroAddress, owner)
    ).to.be.revertedWithCustomError(
      singleVault,
      "noZeroAddress"
    )
  });

  it("Redeem succeed 1 : 1 scenario", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address);

    const redeemShares = 50n * 10n**18n; 
    const expectedAssets = 50n * 10n**18n; 

    const ownerTokenBalanceBefore = await token.balanceOf(owner.address);

    await expect(
      singleVault.connect(owner).redeem(redeemShares, owner.address, owner.address)
    )
    .to.emit(singleVault, "Withdraw")
    .withArgs(
      owner.address, 
      owner.address, 
      owner.address, 
      expectedAssets,
      redeemShares
    );
    
    expect(await singleVault.balanceOf(owner.address)).to.equal(50n * 10n**18n);

    const ownerTokenBalanceAfter = await token.balanceOf(owner.address);
    expect(ownerTokenBalanceAfter).to.equal(ownerTokenBalanceBefore + expectedAssets);
  });

  it("Redeem Scenario 2: Profit Generated (1 Share = 2 Assets)", async () => {
    const { singleVault, token, owner } = await networkHelpers.loadFixture(deployVaultFixture);

    await token.connect(owner).approve(singleVault.target, DEPOSIT_VALUE);
    await singleVault.connect(owner).deposit(DEPOSIT_VALUE, owner.address);

    const profit = 100n * 10n**18n;
    await token.connect(owner).transfer(singleVault.target, profit);

    const redeemShares = 50n * 10n**18n; 
    const expectedAssets = 100n * 10n**18n;    

    const ownerShareBefore = await singleVault.balanceOf(owner.address);
    const ownerAssetBefore = await token.balanceOf(owner.address);

    await expect(
      singleVault.connect(owner).redeem(redeemShares, owner.address, owner.address)
    )
    .to.emit(singleVault, "Withdraw")
    .withArgs(
      owner.address, 
      owner.address, 
      owner.address, 
      expectedAssets, 
      redeemShares 
    );

    expect(await singleVault.balanceOf(owner.address)).to.equal(ownerShareBefore - redeemShares);
    
    expect(await token.balanceOf(owner.address)).to.equal(ownerAssetBefore + expectedAssets);
  });

  // --- PAUSE FUNCTION TESTER ---

  it("Set pause is failed, because caller not owner.", async () => {
    const { singleVault, nonOwner } = await networkHelpers.loadFixture(deployVaultFixture);

    await expect(
        singleVault.connect(nonOwner).setPause()
    ).to.be.revertedWithCustomError(
      singleVault,
      "OwnableUnauthorizedAccount"
    ).withArgs(nonOwner.address);
  });

  it("Set pause is succed, because caller is a owner.", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture)

    await expect(
      singleVault.connect(owner).setPause()
    ).to.emit(
      singleVault,
      "Paused"
    ).withArgs(owner.address)

    expect(await singleVault.paused()).to.equal(true);
  });

  it("setUnpause is failed, because caller not a owner.", async () => {
    const {singleVault, nonOwner} = await networkHelpers.loadFixture(deployVaultFixture);

    await expect(
      singleVault.connect(nonOwner).setUnpause()
  ).to.be.revertedWithCustomError(
    singleVault,
    "OwnableUnauthorizedAccount"
  ).withArgs(nonOwner.address);
  });

  it("setUnpause is succed, because caller is a owner.", async () => {
    const { singleVault, owner } = await networkHelpers.loadFixture(deployVaultFixture);
    
    await singleVault.connect(owner).setPause();

    await expect(
      singleVault.connect(owner).setUnpause()
    ).to.emit(
      singleVault,
      "Unpaused"
    ).withArgs(owner.address)

    expect(await singleVault.paused()).to.equal(false);
  });
});