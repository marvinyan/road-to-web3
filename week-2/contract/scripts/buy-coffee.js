const hre = require('hardhat');

async function getBalance(address) {
  const balanceBigInt = await hre.waffle.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

async function printBalances(addresses) {
  for (let i = 0; i < addresses.length; i++) {
    console.log(`Address ${i} balance: ${await getBalance(addresses[i])}`);
  }
}

async function printMemos(memos) {
  for (const memo of memos) {
    const { timestamp, name: tipper, from: tipperAddress, message } = memo;
    console.log(`At ${timestamp} ${tipper}(${tipperAddress}) said: "${message}"`);
  }
}

async function main() {
  // Get example accounts
  const [owner, tipper1, tipper2, tipper3] = await hre.ethers.getSigners();

  // Get the contract to deploy & deploy it
  const BuyMeACoffee = await hre.ethers.getContractFactory('BuyMeACoffee');
  const buyMeACoffee = await BuyMeACoffee.deploy();
  await buyMeACoffee.deployed();
  console.log(`${owner.address} deployed BuyMeACoffee at ${buyMeACoffee.address}`);

  // Check balances before the coffee purchase
  const addresses = [owner.address, tipper1.address, buyMeACoffee.address];
  console.log('== Balances after deployment ==');
  await printBalances(addresses);

  // Buy the owner a few coffees
  const tip = {
    value: hre.ethers.utils.parseEther('1'),
  };
  await buyMeACoffee.connect(tipper1).buyCoffee('Tipper 1', 'Message one', tip);
  await buyMeACoffee.connect(tipper2).buyCoffee('Tipper 2', 'Message two', tip);
  await buyMeACoffee.connect(tipper3).buyCoffee('Tipper 3', 'Message three', tip);

  // Check balance after coffee purchase
  console.log('== Balances after tips ==');
  await printBalances(addresses);

  // Withdraw funds
  await buyMeACoffee.connect(owner).withdrawTips();

  // Check balance after withdrawal
  console.log('== Balances after withdrawing tips ==');
  await printBalances(addresses);

  // Read all the memos left for the owner
  console.log('== Memos ==');
  const memos = await buyMeACoffee.getMemos();
  printMemos(memos);

  // Try to call transferOwnership as tipper1
  console.log('== Expect transferOwnership error ==');
  let curOwner = await buyMeACoffee.owner();
  console.log(`Starting owner: ${curOwner}`);

  try {
    await buyMeACoffee.connect(tipper1).transferOwnership(tipper2.address);
  } catch (error) {
    console.log('Caught expected error:', error.message);
  }

  curOwner = await buyMeACoffee.owner();
  console.log(`Owner after failed transfer attempt: ${curOwner}`);

  // Try to call transferOwnership as owner
  console.log('== Ownership transferred ==');
  await buyMeACoffee.connect(owner).transferOwnership(tipper1.address);
  curOwner = await buyMeACoffee.owner();
  console.log(`Owner after successful transfer: ${curOwner}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
