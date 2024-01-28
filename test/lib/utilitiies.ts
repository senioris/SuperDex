import { ethers } from "ethers";

export function getCreate2Address(factoryAddress: string, [tokenA, tokenB]: [string, string], bytecode: string): string {
    const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
    const create2Inputs = [
      '0xff',
      factoryAddress,
      ethers.keccak256(ethers.solidityPacked(['address', 'address'], [token0, token1])),
      ethers.keccak256(bytecode)
    ]
    const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
    return ethers.getAddress(`0x${ethers.keccak256(sanitizedInputs).slice(-40)}`)
}
