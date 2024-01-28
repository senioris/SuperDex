import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { getCreate2Address } from "./lib/utilitiies";
import SuperDexPool from "../artifacts/contracts/SuperDexPool.sol/SuperDexPool.json";
import type { ContractFactory, Contract } from "ethers";

const TEST_ADDRESSES: [string, string] = [
    '0x1230000000000000000000000000000000000000',
    '0x3456000000000000000000000000000000000000'    
]
describe("SuperDexFactory", function () {
    async function deployFactoryFixture() {
        const SuperDexFactory = await ethers.getContractFactory("SuperDexFactory");
        const superDexFactory = await SuperDexFactory.deploy();
        await superDexFactory.waitForDeployment();
        return { superDexFactory}        
    }

    it("get no pool address before createPool", async function () {
        const { superDexFactory } = await loadFixture(deployFactoryFixture);
        expect(await superDexFactory.getPool(...TEST_ADDRESSES)).to.equal(ethers.ZeroAddress);
    })

    it("get pool address after createPool", async function () {
        const { superDexFactory } = await loadFixture(deployFactoryFixture);
        const tx = await superDexFactory.createPool(...TEST_ADDRESSES);
        const receipt = await tx.wait();
        expect(receipt).not.null;
        if (!receipt) {
            return;
        }
        const topics: string[] = [...receipt.logs[0].topics];
        const event = superDexFactory.interface.parseLog({ data: receipt.logs[0].data, topics: topics });
        expect(event).not.null;
        if (!event) {  
            return;
        }
        expect(event.name).to.equal('PoolCreated');
        const poolAddress = event.args[2];
        expect(await superDexFactory.getPool(TEST_ADDRESSES[0], TEST_ADDRESSES[1])).to.equal(poolAddress);
        expect(await superDexFactory.getPool(TEST_ADDRESSES[1], TEST_ADDRESSES[0])).to.equal(poolAddress);
    })

    it("get created at expected address", async function () {
        const { superDexFactory } = await loadFixture(deployFactoryFixture);
        const bytecode: string = SuperDexPool.bytecode;

        const [address0, address1] = TEST_ADDRESSES[0] < TEST_ADDRESSES[1] ? TEST_ADDRESSES : [TEST_ADDRESSES[0], TEST_ADDRESSES[1]];
        const create2Address = getCreate2Address(await superDexFactory.getAddress(), [address0, address1], bytecode);

        await expect(superDexFactory.createPool(...TEST_ADDRESSES))
            .to.emit(superDexFactory, 'PoolCreated')
            .withArgs(address0, address1, create2Address);
    })
})
