async function main() {
    const CycleChain = await ethers.getContractFactory("CycleChain");
    const cycleChain = await CycleChain.deploy();
    await cycleChain.deployed();
    console.log("CycleChain deployed to:", cycleChain.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 