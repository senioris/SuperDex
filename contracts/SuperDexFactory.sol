// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./SuperDexPool.sol";

contract SuperDexFactory {
    mapping(address => mapping(address => address)) public getPool;

    event PoolCreated(address indexed token0, address indexed token1, address pool);
    function createPool(address tokenA, address tokenB) external returns (address pool) {
        require(tokenA != tokenB, "SuperDexFactory: IDENTICAL_ADDRESSES");
        // アドレスをソートする
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "SuperDexFactory: ZERO_ADDRESS");
        // 登録されていないペアは0x0が返る
        require(getPool[token0][token1] == address(0), "SuperDexFactory: POOL_EXISTS");
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        // 新しいコントラクトをデプロイする
        SuperDexPool newPool = new SuperDexPool{salt: salt}();
        newPool.initialize(token0, token1);

        pool = address(newPool);
        getPool[token0][token1] = pool;
        getPool[token1][token0] = pool;

        emit PoolCreated(token0, token1, pool);
    }
}
