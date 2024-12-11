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

  describe("Owned Bicycles", function () {
    it("Should correctly return all bicycles owned by an address", async function () {
      const { cycleChain, manufacturer, customer } = await loadFixture(deployCycleChainFixture);
      
      // Register multiple bicycles
      const bikesToRegister = [
        { frameNumber: "BK2023001", model: "Mountain Pro" },
        { frameNumber: "BK2023002", model: "Road Elite" },
        { frameNumber: "BK2023003", model: "City Cruiser" }
      ];

      console.log('Registering multiple bicycles...');
      
      // Register bikes and transfer to customer
      for (const bike of bikesToRegister) {
        const proof = keccak256(toUtf8Bytes(bike.frameNumber));
        await cycleChain.connect(manufacturer).registerBicycle(
          bike.frameNumber,
          "BikeComp",
          bike.model,
          proof
        );
        // Transfer bike to customer
        await cycleChain.connect(manufacturer).transferFrom(
          manufacturer.address,
          customer.address,
          bikesToRegister.indexOf(bike)
        );
      }

      // Get owned bicycles
      const [tokenIds, bicycleDetails] = await cycleChain.getOwnedBicycles(customer.address);

      console.log('Retrieved owned bicycles:', {
        numberOfBicycles: tokenIds.length,
        tokenIds: tokenIds.map(id => id.toString()),
        frameNumbers: bicycleDetails.map(bike => bike.frameNumber)
      });

      // Verify the results
      expect(tokenIds.length).to.equal(3);
      expect(bicycleDetails.length).to.equal(3);
      
      // Verify each bicycle's details
      for (let i = 0; i < tokenIds.length; i++) {
        expect(bicycleDetails[i].frameNumber).to.equal(bikesToRegister[i].frameNumber);
        expect(bicycleDetails[i].model).to.equal(bikesToRegister[i].model);
        expect(await cycleChain.ownerOf(tokenIds[i])).to.equal(customer.address);
      }
    });

    it("Should return empty arrays for address with no bicycles", async function () {
      const { cycleChain, customer } = await loadFixture(deployCycleChainFixture);
      
      const [tokenIds, bicycleDetails] = await cycleChain.getOwnedBicycles(customer.address);

      console.log('Checking empty ownership:', {
        tokenIds: tokenIds.length,
        bicycleDetails: bicycleDetails.length
      });

      expect(tokenIds.length).to.equal(0);
      expect(bicycleDetails.length).to.equal(0);
    });

    it("Should update owned bicycles after transfers", async function () {
      const { cycleChain, manufacturer, customer } = await loadFixture(deployCycleChainFixture);
      
      // Register a bicycle
      const frameNumber = "BK2023001";
      const proof = keccak256(toUtf8Bytes(frameNumber));
      
      console.log('Testing ownership transfer scenario...');
      
      await cycleChain.connect(manufacturer).registerBicycle(
        frameNumber,
        "BikeComp",
        "Mountain Pro",
        proof
      );

      // Check manufacturer's bicycles
      let [tokenIds, bicycleDetails] = await cycleChain.getOwnedBicycles(manufacturer.address);
      expect(tokenIds.length).to.equal(1);
      
      // Transfer to customer
      await cycleChain.connect(manufacturer).transferFrom(
        manufacturer.address,
        customer.address,
        0
      );

      // Check updated ownership
      [tokenIds, bicycleDetails] = await cycleChain.getOwnedBicycles(manufacturer.address);
      expect(tokenIds.length).to.equal(0);

      [tokenIds, bicycleDetails] = await cycleChain.getOwnedBicycles(customer.address);
      expect(tokenIds.length).to.equal(1);
      expect(bicycleDetails[0].frameNumber).to.equal(frameNumber);

      console.log('Transfer test complete:', {
        newOwner: customer.address,
        ownedBicycles: tokenIds.length,
        frameNumber: bicycleDetails[0].frameNumber
      });
    });
  });
}); 