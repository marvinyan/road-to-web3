const main = async() => {
  try {
    const chainBattlesFactory = await hre.ethers.getContractFactory("ChainBattles");
    const chainBattles = await chainBattlesFactory.deploy();
    await chainBattles.deployed();
    
    console.log(`Deployed contract at ${chainBattles.address}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();