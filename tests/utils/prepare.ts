import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"



export async function prepareSigners(thisObject: Mocha.Context) {
    thisObject.signers = await ethers.getSigners()
    thisObject.owner = thisObject.signers[0]
    thisObject.alice = thisObject.signers[1]
    thisObject.bob = thisObject.signers[2]
    thisObject.carol = thisObject.signers[3]
    thisObject.tema = thisObject.signers[4]
    thisObject.misha = thisObject.signers[5]


    // Для тестов TicTacToe - begin
    thisObject.nullAddress = '0x0000000000000000000000000000000000000000';  

    thisObject.nowTime;
    thisObject.result;

    thisObject.timeWait = [60, 120, 300, 500, 80];

    thisObject.moves1 = [4, 0, 1, 3, 7]; // Выйграет 1 игрок за 5 ходов
    thisObject.moves2 = [1, 0, 5, 4, 6, 8]; // Выйграет 2 игрок за 6 ходов
    thisObject.moves3 = [4, 3, 0, 8, 2, 6, 7, 1, 5]; // ничья. 9 ходов
    // Ходы игроков для всех победных комбинаций
    thisObject.combinations = [
        [3,0,6,1,5,2,8],
        [0,3,6,4,2,5,8],
        [0,6,3,7,2,8,5],
        [1,0,2,3,7,6,8],
        [0,1,2,4,6,7,8],
        [0,2,1,5,6,8,7],
        [3,0,7,4,1,8,5],
        [1,6,3,4,5,2,7]
    ];
    // Для тестов TicTacToe - end


    thisObject.contractERC;
    thisObject.amount1 = 100; 
    thisObject.bid = 10; 
    thisObject.win = 20; 
    thisObject.amount_lot = 6*10**5; 
    thisObject.result2;
    thisObject.result3;
    
}

export async function prepareERC20Tokens(thisObject: Mocha.Context, signer: SignerWithAddress) {
    const tokenFactory = await ethers.getContractFactory("ERC20Mock")

    const token1 = await tokenFactory.connect(signer).deploy("Token1", "TKN1", 1000000)
    await token1.deployed()
    thisObject.token1 = token1

    const token2 = await tokenFactory.connect(signer).deploy("Token1", "TKN1", ethers.utils.parseUnits("100000", 6))
    await token2.deployed()
    thisObject.token2 = token2

    const token3 = await tokenFactory.connect(signer).deploy("Token1", "TKN1", ethers.utils.parseUnits("100000", 6))
    await token3.deployed()
    thisObject.token3 = token3
}

export async function prepareTicTacToe(thisObject: Mocha.Context, signer: SignerWithAddress) {
    const tokenFactory = await ethers.getContractFactory("TicTacToe")

    const token4 = await tokenFactory.connect(signer).deploy(thisObject.token1.address)
    await token4.deployed()
    thisObject.token4 = token4
}


export async function prepareWallet(thisObject: Mocha.Context, signer: SignerWithAddress) {
    const tokenFactory = await ethers.getContractFactory("Wallet")

    const token5 = await tokenFactory.connect(signer).deploy()
    await token5.deployed()
    thisObject.token5 = token5
}