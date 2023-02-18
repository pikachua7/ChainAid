// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Token.sol";
import "./AggregatorV3Interface.sol";

contract NGO is ERC721URIStorage {
using Counters for Counters.Counter;
    uint public ngoCount = 0;
    mapping(uint => Ngo) public ngoList;
    mapping(uint => NFT) public nft;
    AggregatorV3Interface internal priceFeed;
    Token private token;
    Counters.Counter public _nftId;
  /**
   * Network: Mumbai Testnet
   * Aggregator: MATIC/USD
   * Address: 0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada
   */
    constructor(Token _token) ERC721("EthforAllNFT", "ENFT") {
        token = _token;
        priceFeed = AggregatorV3Interface(0x9326BFA02ADD2366b30bacB125260Af641031331);
    }

    struct Ngo {
        uint ngoId;
        string name;
        string description;
        string location;
        string imageURL;
        uint donationNeeded;
        uint date;
        address payable owner;
    }

    struct NFT {
        uint tokenId;
        string name;
        uint red;
        uint green;
        uint blue;
        uint amount;
    }

    event NgoCreated (
        uint ngoId,
        string name,
        string description,
        string location,
        string imageURL,
        uint donationNeeded,
        uint date,
        address payable owner
    );

    event DonationForNgo (
        uint ngoId,
        uint amount,
        uint donationNeeded,
        uint date,
        address from,
        address payable owner
    );

    event ChangeColor (
        uint tokenId,
        uint red,
        uint green,
        uint blue
    );

    function createNgo(string memory _name, string memory _description, string memory _location, string memory _imageURL, uint _donationNeeded) public {
        require(_donationNeeded > 0);
        require(bytes(_name).length > 0);
        require(bytes(_description).length > 0);
        require(bytes(_location).length > 0);

        ngoCount++;

        ngoList[ngoCount] = Ngo(ngoCount, _name, _description, _location, _imageURL, _donationNeeded, block.timestamp, payable(msg.sender));
        emit NgoCreated(ngoCount, _name, _description, _location, _imageURL, _donationNeeded, block.timestamp, payable(msg.sender));
    }

    function donateETHToNgo(uint _ngoId, string memory _tokenURI) public payable {
        Ngo memory _ngo = ngoList[_ngoId];

        require(_ngo.donationNeeded >= msg.value);
        _ngo.owner.transfer(msg.value);

        _ngo.donationNeeded -= msg.value;
        ngoList[_ngoId] = _ngo;

        // Create NFT
        _nftId.increment();
        uint _tokenId = _nftId.current();
        _safeMint(msg.sender, _tokenId);
        _setTokenURI(_tokenId, _tokenURI);

        // Random color
        uint red = getRandomValue(253);
        uint green = getRandomValue(254);
        uint blue = getRandomValue(255);
        nft[_tokenId] = NFT(_tokenId, _ngo.name, red, green, blue, msg.value);

        // Give 3 token (FTR) to the donator
        token.transfer(msg.sender, 3000000000000000000);

        emit DonationForNgo(_ngoId, msg.value, _ngo.donationNeeded, block.timestamp, msg.sender, _ngo.owner);
    }

    function donateETHToNgoWithReferrer(uint _ngoId, string memory _tokenURI, address _referrer) public payable {
        Ngo memory _ngo = ngoList[_ngoId];

        require(_ngo.donationNeeded >= msg.value);
        _ngo.owner.transfer(msg.value);

        _ngo.donationNeeded -= msg.value;
        ngoList[_ngoId] = _ngo;

        // Create NFT for donator
      _nftId.increment();
        uint _tokenId = _nftId.current();
        _safeMint(msg.sender, _tokenId);
        _setTokenURI(_tokenId, _tokenURI);

        // Random color
        uint red = getRandomValue(253);
        uint green = getRandomValue(254);
        uint blue = getRandomValue(255);
        nft[_tokenId] = NFT(_tokenId, _ngo.name, red, green, blue, msg.value);
        
        // Give 3 token (FTR) to the donator
        token.transfer(msg.sender, 3000000000000000000);
        // Give 1 token (FTR) to the referrer
        token.transfer(_referrer, 1000000000000000000);

        emit DonationForNgo(_ngoId, msg.value, _ngo.donationNeeded, block.timestamp, msg.sender, _ngo.owner);
    }

    function changeColorOfNFT(uint _tokenId) external {
        require(token.balanceOf(msg.sender) > 0);
        //require(_tokenId <= totalSupply());

        NFT memory _nft = nft[_tokenId];
        uint red = getRandomValue(253);
        uint green = getRandomValue(254);
        uint blue = getRandomValue(255);
        _nft.red = red;
        _nft.green = green;
        _nft.blue = blue;
        nft[_tokenId] = _nft;

        token.payOneToken(msg.sender, address(this));
        emit ChangeColor(_tokenId, red, green, blue);
    }

    function getRandomValue(uint mod) internal view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender))) % mod;
    }

    function getLatestPrice() public view returns (int) {
        (
        uint80 roundID, 
        int price,
        uint startedAt,
        uint timeStamp,
        uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
    
    function fetchNfts() public view returns (uint256) {
        uint256 totalCount = _nftId.current();
        return totalCount;
    }
}