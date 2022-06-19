pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20{

    constructor(uint256 initialSupply) ERC20("mockToken", "MT") {
        _mint(msg.sender, initialSupply);
    }
}

contract MockLpToken is ERC20{
     constructor(uint256 initialSupply) ERC20("mockLpToken", "MLT") {
        _mint(msg.sender, initialSupply);
    }
}