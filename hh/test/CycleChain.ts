import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("CycleChain", function () {
  // Fixture to deploy the contract and set up test accounts
  async function deployCycleChainFixture() {
    const [owner, manufacturer, serviceProvider, verifier, customer] = await ethers.getSigners();

    const CycleChain = await ethers.getContractFactory("CycleChain");
    const cycleChain = await CycleChain.deploy();

    // Add authorized roles
    await cycleChain.addManufacturer(manufacturer.address);
    await cycleChain.addServiceProvider(serviceProvider.address);
    await cycleChain.addVerifier(verifier.address);

    return { cycleChain, owner, manufacturer, serviceProvider, verifier, customer };
  }

  describe("Role Management", function () {
    it("Should allow owner to add and remove manufacturers", async function () {
      const { cycleChain, owner, manufacturer } = await loadFixture(deployCycleChainFixture);
      
      console.log(`Testing manufacturer role management for address: ${manufacturer.address}`);
      console.log('Initial manufacturer authorization status:', await cycleChain.authorizedManufacturers(manufacturer.address));
      
      expect(await cycleChain.authorizedManufacturers(manufacturer.address)).to.be.true;
      
      await cycleChain.removeManufacturer(manufacturer.address);
      console.log('Authorization status after removal:', await cycleChain.authorizedManufacturers(manufacturer.address));
      
      expect(await cycleChain.authorizedManufacturers(manufacturer.address)).to.be.false;
    });

    it("Should prevent non-owners from adding manufacturers", async function () {
      const { cycleChain, manufacturer, customer } = await loadFixture(deployCycleChainFixture);
      
      await expect(
        cycleChain.connect(customer).addManufacturer(manufacturer.address)
      ).to.be.revertedWithCustomError(cycleChain, "OwnableUnauthorizedAccount");
    });
  });

  describe("Bicycle Registration", function () {
    it("Should allow manufacturer to register a new bicycle", async function () {
      const { cycleChain, manufacturer } = await loadFixture(deployCycleChainFixture);
      
      const frameNumber = "BK2023001";
      const manufacturerName = "BikeComp";
      const model = "Mountain Pro";
      const proof = keccak256(toUtf8Bytes(`${frameNumber}${manufacturerName}${model}`));

      console.log('Registering new bicycle with details:');
      console.log('Frame Number:', frameNumber);
      console.log('Manufacturer:', manufacturerName);
      console.log('Model:', model);
      console.log('Proof:', proof);

      await cycleChain.connect(manufacturer).registerBicycle(
        frameNumber,
        manufacturerName,
        model,
        proof
      );

      const bicycle = await cycleChain.bicycles(0);
      console.log('Registered bicycle details:', {
        frameNumber: bicycle.frameNumber,
        isAuthentic: bicycle.isAuthentic,
        maintenanceCount: bicycle.maintenanceCount
      });

      expect(bicycle.frameNumber).to.equal(frameNumber);
      expect(bicycle.isAuthentic).to.be.true;
    });
  });

  describe("Maintenance Records", function () {
    it("Should allow service provider to add maintenance record", async function () {
      const { cycleChain, manufacturer, serviceProvider } = await loadFixture(deployCycleChainFixture);
      
      const frameNumber = "BK2023001";
      const proof = keccak256(toUtf8Bytes(frameNumber));
      
      console.log('Registering bicycle before maintenance test');
      await cycleChain.connect(manufacturer).registerBicycle(
        frameNumber,
        "BikeComp",
        "Mountain Pro",
        proof
      );

      const serviceDescription = "Annual Service";
      const notes = "Changed brake pads and tuned gears";

      console.log('Adding maintenance record:', {
        serviceDescription,
        notes,
        provider: serviceProvider.address
      });

      await cycleChain.connect(serviceProvider).addMaintenanceRecord(
        0,
        serviceDescription,
        notes
      );

      const bicycle = await cycleChain.bicycles(0);
      console.log('Updated bicycle maintenance count:', bicycle.maintenanceCount);
    });
  });

  describe("Verification Events", function () {
    it("Should allow verifier to authenticate a bicycle", async function () {
      const { cycleChain, manufacturer, verifier } = await loadFixture(deployCycleChainFixture);
      
      const frameNumber = "BK2023001";
      const proof = keccak256(toUtf8Bytes(frameNumber));
      
      console.log('Setting up bicycle for verification test');
      await cycleChain.connect(manufacturer).registerBicycle(
        frameNumber,
        "BikeComp",
        "Mountain Pro",
        proof
      );

      const location = "Bike Shop NYC";
      const notes = "All original components verified";

      console.log('Performing verification:', {
        location,
        notes,
        verifier: verifier.address
      });

      await cycleChain.connect(verifier).verifyBicycle(
        0,
        proof,
        location,
        notes
      );

      const bicycle = await cycleChain.bicycles(0);
      console.log('Verification count after verification:', bicycle.verificationCount);
    });
  });

  describe("Component Changes", function () {
    it("Should allow service provider to record component changes", async function () {
      const { cycleChain, manufacturer, serviceProvider } = await loadFixture(deployCycleChainFixture);
      
      // Register a bicycle
      const frameNumber = "BK2023001";
      const proof = keccak256(toUtf8Bytes(frameNumber));
      await cycleChain.connect(manufacturer).registerBicycle(
        frameNumber,
        "BikeComp",
        "Mountain Pro",
        proof
      );

      // Record component change
      const componentType = "Front Fork";
      const newComponentDetails = "RockShox Pike Ultimate";

      await expect(
        cycleChain.connect(serviceProvider).addComponentChange(
          0, // tokenId
          componentType,
          newComponentDetails
        )
      ).to.emit(cycleChain, "ComponentChanged")
        .withArgs(0, componentType);

      const bicycle = await cycleChain.bicycles(0);
      expect(bicycle.componentCount).to.equal(1);
    });
  });

  describe("History Retrieval", function () {
    it("Should return complete bicycle history", async function () {
      const { cycleChain, manufacturer, serviceProvider, verifier } = await loadFixture(deployCycleChainFixture);
      
      console.log('Creating comprehensive bicycle history...');
      
      const frameNumber = "BK2023001";
      const proof = keccak256(toUtf8Bytes(frameNumber));
      
      console.log('1. Registering bicycle');
      await cycleChain.connect(manufacturer).registerBicycle(
        frameNumber,
        "BikeComp",
        "Mountain Pro",
        proof
      );

      console.log('2. Adding maintenance record');
      await cycleChain.connect(serviceProvider).addMaintenanceRecord(
        0,
        "Initial Service",
        "Setup and safety check"
      );

      console.log('3. Adding verification');
      await cycleChain.connect(verifier).verifyBicycle(
        0,
        proof,
        "Bike Shop NYC",
        "Initial verification"
      );

      const maintenanceHistory = await cycleChain.getMaintenanceHistory(0);
      const verificationHistory = await cycleChain.getVerificationHistory(0);

      console.log('Retrieved history:', {
        maintenanceRecords: maintenanceHistory.length,
        verificationRecords: verificationHistory.length
      });
      console.log('Maintenance details:', maintenanceHistory);
      console.log('Verification details:', verificationHistory);
    });
  });
}); 