async function main() {
    const verifierAddress = "0xD5c0e02be3e7aE5e068002e125E4e40fA1c46fa9"; // Verifier contract address
    const BridgeWithZKP = await ethers.getContractFactory("BridgeWithZKP");
    const bridgeWithZKP = await BridgeWithZKP.deploy(verifierAddress);
    await bridgeWithZKP.deployed();
    console.log("BridgeWithZKP deployed to:", bridgeWithZKP.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 