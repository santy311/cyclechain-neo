// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CycleChain is ERC721, Ownable {
    uint256 private _nextTokenId;

    struct Bicycle {
        string frameNumber;
        string manufacturer;
        string model;
        uint256 manufactureDate;
        bool isAuthentic;
        bytes32 cryptographicProof;
        uint256 maintenanceCount;
        uint256 verificationCount;
        uint256 componentCount;
    }

    struct MaintenanceRecord {
        string serviceDescription;
        uint256 date;
        string serviceProvider;
        string notes;
        bytes32 serviceProof;
    }

    struct VerificationEvent {
        uint256 date;
        string verifier;
        string location;
        bool authenticated;
        string notes;
    }

    struct ComponentChange {
        string componentType;
        string newComponentDetails;
        uint256 date;
        string installedBy;
    }

    // Mappings
    mapping(uint256 => Bicycle) public bicycles;
    mapping(uint256 => MaintenanceRecord[]) public maintenanceRecords;
    mapping(uint256 => VerificationEvent[]) public verificationEvents;
    mapping(uint256 => ComponentChange[]) public componentChanges;
    mapping(string => uint256) public frameNumberToToken;
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => bool) public authorizedServiceProviders;
    mapping(bytes32 => bool) public validProofs;

    // Events
    event BicycleRegistered(uint256 indexed tokenId, string frameNumber, string manufacturer);
    event BicycleVerified(uint256 indexed tokenId, bool authenticated, string location);
    event MaintenancePerformed(uint256 indexed tokenId, string serviceDescription);
    event ComponentChanged(uint256 indexed tokenId, string componentType);
    event ProofUpdated(uint256 indexed tokenId, bytes32 newProof);
    event ManufacturerStatusChanged(address indexed manufacturer, bool status);
    event VerifierStatusChanged(address indexed verifier, bool status);
    event ServiceProviderStatusChanged(address indexed provider, bool status);

    constructor() ERC721("CycleCert", "CYCLE") Ownable(msg.sender) {}

    modifier onlyManufacturer() {
        require(authorizedManufacturers[msg.sender], "Not a manufacturer");
        _;
    }

    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender], "Not a verifier");
        _;
    }

    modifier onlyServiceProvider() {
        require(authorizedServiceProviders[msg.sender], "Not a service provider");
        _;
    }

    function registerBicycle(
        string memory frameNumber,
        string memory manufacturer,
        string memory model,
        bytes32 initialProof
    ) external onlyManufacturer returns (uint256) {
        require(frameNumberToToken[frameNumber] == 0, "Bicycle already registered");
        require(initialProof != bytes32(0), "Invalid proof");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        bicycles[tokenId] = Bicycle({
            frameNumber: frameNumber,
            manufacturer: manufacturer,
            model: model,
            manufactureDate: block.timestamp,
            isAuthentic: true,
            cryptographicProof: initialProof,
            maintenanceCount: 0,
            verificationCount: 0,
            componentCount: 0
        });

        frameNumberToToken[frameNumber] = tokenId;
        validProofs[initialProof] = true;

        emit BicycleRegistered(tokenId, frameNumber, manufacturer);
        return tokenId;
    }

    function verifyBicycle(
        uint256 tokenId,
        bytes32 proof,
        string memory location,
        string memory notes
    ) external onlyVerifier {
        require(_exists(tokenId), "Bicycle not found");
        require(validProofs[proof], "Invalid proof");

        verificationEvents[tokenId].push(VerificationEvent({
            date: block.timestamp,
            verifier: "Authorized Verifier",
            location: location,
            authenticated: true,
            notes: notes
        }));

        bicycles[tokenId].verificationCount++;
        emit BicycleVerified(tokenId, true, location);
    }

    function addMaintenanceRecord(
        uint256 tokenId,
        string memory serviceDescription,
        string memory notes
    ) external onlyServiceProvider {
        require(_exists(tokenId), "Bicycle not found");

        bytes32 serviceProof = keccak256(abi.encodePacked(serviceDescription, notes, block.timestamp));
        
        maintenanceRecords[tokenId].push(MaintenanceRecord({
            serviceDescription: serviceDescription,
            date: block.timestamp,
            serviceProvider: "Authorized Service Provider",
            notes: notes,
            serviceProof: serviceProof
        }));

        bicycles[tokenId].maintenanceCount++;
        emit MaintenancePerformed(tokenId, serviceDescription);
    }

    function addComponentChange(
        uint256 tokenId,
        string memory componentType,
        string memory newComponentDetails
    ) external onlyServiceProvider {
        require(_exists(tokenId), "Bicycle not found");

        componentChanges[tokenId].push(ComponentChange({
            componentType: componentType,
            newComponentDetails: newComponentDetails,
            date: block.timestamp,
            installedBy: "Authorized Service Provider"
        }));

        bicycles[tokenId].componentCount++;
        emit ComponentChanged(tokenId, componentType);
    }

    // Role management functions
    function addManufacturer(address manufacturer) external onlyOwner {
        authorizedManufacturers[manufacturer] = true;
        emit ManufacturerStatusChanged(manufacturer, true);
    }

    function removeManufacturer(address manufacturer) external onlyOwner {
        authorizedManufacturers[manufacturer] = false;
        emit ManufacturerStatusChanged(manufacturer, false);
    }

    function addServiceProvider(address provider) external onlyOwner {
        authorizedServiceProviders[provider] = true;
        emit ServiceProviderStatusChanged(provider, true);
    }

    function removeServiceProvider(address provider) external onlyOwner {
        authorizedServiceProviders[provider] = false;
        emit ServiceProviderStatusChanged(provider, false);
    }

    function addVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = true;
        emit VerifierStatusChanged(verifier, true);
    }

    function removeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
        emit VerifierStatusChanged(verifier, false);
    }

    // View functions
    function getBicycleBasicDetails(uint256 tokenId) 
        external 
        view 
        returns (
            string memory frameNumber,
            string memory manufacturer,
            string memory model,
            uint256 manufactureDate,
            address owner
        ) 
    {
        require(_exists(tokenId), "Bicycle not found");
        Bicycle storage bike = bicycles[tokenId];
        return (
            bike.frameNumber,
            bike.manufacturer,
            bike.model,
            bike.manufactureDate,
            ownerOf(tokenId)
        );
    }

    function getBicycleAdditionalDetails(uint256 tokenId)
        external
        view
        returns (
            bool isAuthentic,
            bytes32 proof,
            uint256 maintenanceCount,
            uint256 verificationCount,
            uint256 componentCount
        )
    {
        require(_exists(tokenId), "Bicycle not found");
        Bicycle storage bike = bicycles[tokenId];
        return (
            bike.isAuthentic,
            bike.cryptographicProof,
            bike.maintenanceCount,
            bike.verificationCount,
            bike.componentCount
        );
    }

    function getMaintenanceHistory(uint256 tokenId) external view returns (MaintenanceRecord[] memory) {
        require(_exists(tokenId), "Bicycle not found");
        return maintenanceRecords[tokenId];
    }

    function getVerificationHistory(uint256 tokenId) external view returns (VerificationEvent[] memory) {
        require(_exists(tokenId), "Bicycle not found");
        return verificationEvents[tokenId];
    }

    function getComponentHistory(uint256 tokenId) external view returns (ComponentChange[] memory) {
        require(_exists(tokenId), "Bicycle not found");
        return componentChanges[tokenId];
    }

    function getOwnedBicycles(address owner) 
        external 
        view 
        returns (
            uint256[] memory tokenIds,
            Bicycle[] memory bicycleDetails
        ) 
    {
        // First, count how many tokens this owner has
        uint256 balance = balanceOf(owner);
        
        // Initialize return arrays with the correct size
        tokenIds = new uint256[](balance);
        bicycleDetails = new Bicycle[](balance);
        
        // Populate the arrays
        uint256 currentIndex = 0;
        
        // Iterate through all possible tokens up to _nextTokenId
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_exists(i) && ownerOf(i) == owner) {
                tokenIds[currentIndex] = i;
                bicycleDetails[currentIndex] = bicycles[i];
                currentIndex++;
            }
        }
        
        return (tokenIds, bicycleDetails);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }
}