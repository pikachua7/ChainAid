
const hre = require("hardhat");

async function main() {

  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();

  console.log("ERC20 Token Contract deployed to:", token.address);

  const NGO = await hre.ethers.getContractFactory("NGO");
  const ngo = await NGO.deploy(token.address);

  await ngo.deployed();

  console.log("NGO Contract deployed to:", ngo.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// ERC20 Token Contract deployed to: 0x81Ad94d1f16d8966f85e2A5B9a102380DdBdFebE
// NGO Contract deployed to: 0xa1B0d2bDa4Cebf857A73dbDF4286fBE4085a5D04