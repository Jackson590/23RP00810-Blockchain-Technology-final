// SPDX-License-Identifier: MIT
pragma solidity >0.8.0 <0.9.0;

contract FarmProduceSaleLog {
    address public owner;

    struct Farmer {
        string name;
        string contactInfo;
        string location;
        bool isRegistered;
    }

    struct Produce {
        string name;
        string category;
        uint256 price;
        uint256 quantity;
        string harvestDate;
        bool isAvailable;
    }

    struct Sale {
        uint256 produceId;
        uint256 quantity;
        string buyerName;
        string buyerPhone;
        uint256 price;
        uint256 timestamp;
    }

    mapping(address => Farmer) public farmers;
    mapping(address => mapping(uint256 => Produce)) public farmerProduce;
    mapping(address => uint256) public produceCount;
    mapping(address => mapping(uint256 => Sale)) public farmerSales;
    mapping(address => uint256) public salesCount;

    event FarmerRegistered(address indexed farmerAddress, string name);
    event ProduceAdded(address indexed farmerAddress, uint256 produceId, string name);
    event ProduceUpdated(address indexed farmerAddress, uint256 produceId);
    event ProduceRemoved(address indexed farmerAddress, uint256 produceId);
    event SaleRecorded(address indexed farmerAddress, uint256 saleId, uint256 produceId, uint256 quantity);
    event LowStockAlert(address indexed farmerAddress, uint256 produceId, uint256 remainingQuantity);

    uint256 public constant LOW_STOCK_THRESHOLD = 5;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyRegisteredFarmer() {
        require(farmers[msg.sender].isRegistered, "Only registered farmers can perform this action");
        _;
    }

    function registerFarmer(string memory _name, string memory _contactInfo, string memory _location) public {
        require(!farmers[msg.sender].isRegistered, "Farmer already registered");

        farmers[msg.sender] = Farmer({
            name: _name,
            contactInfo: _contactInfo,
            location: _location,
            isRegistered: true
        });

        emit FarmerRegistered(msg.sender, _name);
    }

    function updateFarmerProfile(string memory _name, string memory _contactInfo, string memory _location) public onlyRegisteredFarmer {
        Farmer storage farmer = farmers[msg.sender];
        farmer.name = _name;
        farmer.contactInfo = _contactInfo;
        farmer.location = _location;
    }

    function addProduce(
        string memory _name,
        string memory _category,
        uint256 _price,
        uint256 _quantity,
        string memory _harvestDate
    ) public onlyRegisteredFarmer returns (uint256) {
        uint256 produceId = produceCount[msg.sender];

        farmerProduce[msg.sender][produceId] = Produce({
            name: _name,
            category: _category,
            price: _price,
            quantity: _quantity,
            harvestDate: _harvestDate,
            isAvailable: true
        });

        produceCount[msg.sender]++;
        emit ProduceAdded(msg.sender, produceId, _name);

        return produceId;
    }

    function updateProduce(
        uint256 _produceId,
        string memory _name,
        string memory _category,
        uint256 _price,
        uint256 _quantity,
        string memory _harvestDate,
        bool _isAvailable
    ) public onlyRegisteredFarmer {
        require(_produceId < produceCount[msg.sender], "Produce does not exist");

        Produce storage produce = farmerProduce[msg.sender][_produceId];

        produce.name = _name;
        produce.category = _category;
        produce.price = _price;
        produce.quantity = _quantity;
        produce.harvestDate = _harvestDate;
        produce.isAvailable = _isAvailable;

        emit ProduceUpdated(msg.sender, _produceId);
    }

    function removeProduce(uint256 _produceId) public onlyRegisteredFarmer {
        require(_produceId < produceCount[msg.sender], "Produce does not exist");

        farmerProduce[msg.sender][_produceId].isAvailable = false;

        emit ProduceRemoved(msg.sender, _produceId);
    }

    function recordSale(
        uint256 _produceId,
        uint256 _quantity,
        string memory _buyerName,
        string memory _buyerPhone,
        uint256 _price
    ) public onlyRegisteredFarmer returns (uint256) {
        require(_produceId < produceCount[msg.sender], "Produce does not exist");
        Produce storage produce = farmerProduce[msg.sender][_produceId];
        require(produce.isAvailable, "Produce is not available for sale");
        require(produce.quantity >= _quantity, "Insufficient quantity available");

        uint256 saleId = salesCount[msg.sender];

        farmerSales[msg.sender][saleId] = Sale({
            produceId: _produceId,
            quantity: _quantity,
            buyerName: _buyerName,
            buyerPhone: _buyerPhone,
            price: _price,
            timestamp: block.timestamp
        });

        salesCount[msg.sender]++;
        produce.quantity -= _quantity;

        if (produce.quantity <= LOW_STOCK_THRESHOLD) {
            emit LowStockAlert(msg.sender, _produceId, produce.quantity);
        }

        if (produce.quantity == 0) {
            produce.isAvailable = false;
        }

        emit SaleRecorded(msg.sender, saleId, _produceId, _quantity);

        return saleId;
    }

    function getProduceDetails(uint256 _produceId) public view returns (
        string memory name,
        string memory category,
        uint256 price,
        uint256 quantity,
        string memory harvestDate,
        bool isAvailable
    ) {
        require(_produceId < produceCount[msg.sender], "Produce does not exist");

        Produce storage produce = farmerProduce[msg.sender][_produceId];

        return (
            produce.name,
            produce.category,
            produce.price,
            produce.quantity,
            produce.harvestDate,
            produce.isAvailable
        );
    }

    function getSaleDetails(uint256 _saleId) public view returns (
        uint256 produceId,
        uint256 quantity,
        string memory buyerName,
        string memory buyerPhone,
        uint256 price,
        uint256 timestamp
    ) {
        require(_saleId < salesCount[msg.sender], "Sale does not exist");

        Sale storage sale = farmerSales[msg.sender][_saleId];

        return (
            sale.produceId,
            sale.quantity,
            sale.buyerName,
            sale.buyerPhone,
            sale.price,
            sale.timestamp
        );
    }

    function getFarmerProfile() public view returns (
        string memory name,
        string memory contactInfo,
        string memory location,
        bool isRegistered
    ) {
        Farmer storage farmer = farmers[msg.sender];

        return (
            farmer.name,
            farmer.contactInfo,
            farmer.location,
            farmer.isRegistered
        );
    }

    function getProduceCount() public view returns (uint256) {
        return produceCount[msg.sender];
    }

    function getSalesCount() public view returns (uint256) {
        return salesCount[msg.sender];
    }

    function getAllProduceIds() public view returns (uint256[] memory) {
        uint256 count = produceCount[msg.sender];
        uint256[] memory ids = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            ids[i] = i;
        }

        return ids;
    }

    function getAllSaleIds() public view returns (uint256[] memory) {
        uint256 count = salesCount[msg.sender];
        uint256[] memory ids = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            ids[i] = i;
        }

        return ids;
    }

    // New: Return all sales with timestamps for off-chain filtering
    function getAllSales() public view returns (Sale[] memory) {
        uint256 count = salesCount[msg.sender];
        Sale[] memory allSales = new Sale[](count);
        for (uint256 i = 0; i < count; i++) {
            allSales[i] = farmerSales[msg.sender][i];
        }
        return allSales;
    }
}
