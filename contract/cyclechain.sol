// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts@5.0.1/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@5.0.1/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts@5.0.1/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts@5.0.1/access/Ownable.sol";
import "@openzeppelin/contracts@5.0.1/utils/Counters.sol";

contract CycleChain is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct PhysicalItem {
        string serialNumber;
        string manufacturer;
        string model;
        uint256 manufactureDate;
        bool isAuthentic;
        string itemType;
        bytes32 cryptographicProof;
        MaintenanceRecord[] maintenanceHistory;
        VerificationEvent[] verificationHistory;
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

    mapping(uint256 => PhysicalItem) public items;
    mapping(string => uint256) public serialNumberToToken;
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => bool) internal authorizedServiceProviders;
    mapping(bytes32 => bool) public validProofs;
    ComponentChange[] public componentHistory;

    event ItemRegistered(uint256 tokenId, string serialNumber, string itemType);
    event ItemVerified(uint256 tokenId, bool authentic, string location);
    event MaintenancePerformed(uint256 tokenId, string serviceDescription);
    event ProofUpdated(uint256 tokenId, bytes32 newProof);
    event ComponentChanged(uint256 tokenId, string componentType);

    constructor() ERC721("PhysicalNFT", "PNFT") Ownable(msg.sender) {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function getItemsByOwner(
        address owner
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokens;
    }

    function registerItem(
        string memory serialNumber,
        string memory manufacturer,
        string memory model,
        string memory itemType,
        bytes32 initialProof,
        string memory tokenURI
    ) external onlyManufacturer returns (uint256) {
        require(
            serialNumberToToken[serialNumber] == 0,
            "Item already registered"
        );
        require(initialProof != bytes32(0), "Invalid proof");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        PhysicalItem storage newItem = items[newTokenId];
        newItem.serialNumber = serialNumber;
        newItem.manufacturer = manufacturer;
        newItem.model = model;
        newItem.manufactureDate = block.timestamp;
        newItem.isAuthentic = true;
        newItem.itemType = itemType;
        newItem.cryptographicProof = initialProof;

        serialNumberToToken[serialNumber] = newTokenId;
        validProofs[initialProof] = true;

        emit ItemRegistered(newTokenId, serialNumber, itemType);
        return newTokenId;
    }

    function verifyItem(
        uint256 tokenId,
        bytes32 proof,
        string memory location,
        string memory notes
    ) external {
        require(validProofs[proof], "Invalid proof provided");

        VerificationEvent memory event_ = VerificationEvent({
            date: block.timestamp,
            verifier: "Authorized Verifier",
            location: location,
            authenticated: true,
            notes: notes
        });

        items[tokenId].verificationHistory.push(event_);
        emit ItemVerified(tokenId, true, location);
    }

    modifier onlyManufacturer() {
        require(
            authorizedManufacturers[msg.sender],
            "Not an authorized manufacturer"
        );
        _;
    }

    modifier onlyServiceProvider() {
        require(
            authorizedServiceProviders[msg.sender],
            "Not an authorized service provider"
        );
        _;
    }

    modifier onlyBicycleOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the bicycle owner");
        _;
    }

    function addMaintenanceRecord(
        uint256 tokenId,
        string memory serviceDescription,
        string memory notes
    ) external onlyServiceProvider {
        MaintenanceRecord memory record = MaintenanceRecord({
            serviceDescription: serviceDescription,
            date: block.timestamp,
            serviceProvider: "Authorized Service Provider",
            notes: notes,
            serviceProof: keccak256(abi.encodePacked(serviceDescription, notes))
        });

        items[tokenId].maintenanceHistory.push(record);
        emit MaintenancePerformed(tokenId, serviceDescription);
    }

    function addComponentChange(
        uint256 tokenId,
        string memory componentType,
        string memory newComponentDetails
    ) external onlyServiceProvider {
        ComponentChange memory change = ComponentChange({
            componentType: componentType,
            newComponentDetails: newComponentDetails,
            date: block.timestamp,
            installedBy: "Authorized Service Provider"
        });

        items[tokenId].componentHistory.push(change);
        emit ComponentChanged(tokenId, componentType);
    }

    function getBicycleDetails(
        uint256 tokenId
    )
        external
        view
        returns (
            string memory frameNumber,
            string memory manufacturer,
            string memory model,
            uint256 manufactureDate,
            address currentOwner,
            bool isStolen
        )
    {
        PhysicalItem storage bike = items[tokenId];
        return (
            bike.serialNumber,
            bike.manufacturer,
            bike.model,
            bike.manufactureDate,
            ownerOf(tokenId),
            bike.isAuthentic
        );
    }

    function addManufacturer(address manufacturer) external onlyOwner {
        authorizedManufacturers[manufacturer] = true;
    }

    function removeManufacturer(address manufacturer) external onlyOwner {
        authorizedManufacturers[manufacturer] = false;
    }

    function addServiceProvider(address provider) external onlyOwner {
        authorizedServiceProviders[provider] = true;
    }

    function removeServiceProvider(address provider) external onlyOwner {
        authorizedServiceProviders[provider] = false;
    }
}