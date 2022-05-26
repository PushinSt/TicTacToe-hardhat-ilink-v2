import { ethers } from "hardhat";
import { task } from "hardhat/config"
//import { ethers, waffle } from "hardhat"


// npx hardhat create-game-erc --network ropsten --address $address --player $player --time $time --bet $bet
task("create-game-erc", "Create new game")
    .addParam("address", "The contract address")
    .addParam("player", "The player number")
    .addParam("time", "Waiting time for the opponent's move")
    .addParam("bet", "Bet per game")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        const erc = await contract.token();
        const Token2 = await hre.ethers.getContractFactory("ERC20Mock");
        const contractERC = await Token2.attach(erc);
        await contractERC.connect(sign[taskArgs.player]).approve(taskArgs.address, taskArgs.bet);
        await contract.connect(sign[taskArgs.player]).createGame(taskArgs.time, taskArgs.bet)
        console.log("Done!")
    })


    // npx hardhat create-game-eth --network ropsten --address $address --player $player --time $time --bet $bet
task("create-game-eth", "Create new game")
.addParam("address", "The contract address")
.addParam("player", "The player number")
.addParam("time", "Waiting time for the opponent's move")
.addParam("bet", "Bet per game")
.setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TicTacToe")
    const contract = await Token.attach(taskArgs.address)
    const sign = await hre.ethers.getSigners();
    //const erc = await contract.token();
    //const Token2 = await hre.ethers.getContractFactory("ERC20Mock");
    //const contractERC = await Token2.attach(erc);
    //await contractERC.connect(sign[taskArgs.player]).approve(taskArgs.address, taskArgs.bet);
    await contract.connect(sign[taskArgs.player]).createGame(taskArgs.time, 0, { value: hre.ethers.utils.parseUnits((taskArgs.bet), "finney") }); 
    //await contract.connect(sign[taskArgs.player]).createGame(taskArgs.time, taskArgs.bet)
    console.log("Done!")
})

// npx hardhat find-game --network ropsten --address $address --player $player --index $index --timemin $timeMin --timemax $timeMax --betmin $betMin --betmax $betMax
task("find-game", "Find one game")
    .addParam("address", "The contract address")
    .addParam("player", "The player number")
    .addParam("index", "Search start index game")
    .addParam("timemin", "Min waiting time")
    .addParam("timemax", "Max waiting time")
    .addParam("betmin", "Min bet per game")
    .addParam("betmax", "Max bet per game")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        const answer = await contract.connect(sign[taskArgs.player]).findOneGame(taskArgs.index, taskArgs.timemin, taskArgs.timemax, taskArgs.betmin, taskArgs.betmax);
        console.log("id game: " + answer)
        console.log("Done!")
    })


// npx hardhat pause-game --network ropsten --address $address --player $player --id $id
task("pause-game", "Pause/Continue find player for game")
    .addParam("address", "The contract address")
    .addParam("player", "The player number")
    .addParam("id", "Id game")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        await contract.connect(sign[taskArgs.player]).pauseGame(taskArgs.id)
        console.log("Done!")
    })

// npx hardhat join-game-erc --network ropsten --address $address --player $player --id $id --bet $bet
task("join-game-erc", "Join a new game")
    .addParam("address", "The contract address")
    .addParam("player", "The player number")
    .addParam("id", "Id game")
    .addParam("bet", "Bet")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        const erc = await contract.token();
        const Token2 = await hre.ethers.getContractFactory("ERC20Mock");
        const contractERC = await Token2.attach(erc);
        await contractERC.connect(sign[taskArgs.player]).approve(taskArgs.address, taskArgs.bet);
        await contract.connect(sign[taskArgs.player]).joinGame(taskArgs.id)
        console.log("Done!")
    })

    // npx hardhat join-game --network ropsten --address $address --player $player --id $id --bet $bet
task("join-game-eth", "Join a new game")
.addParam("address", "The contract address")
.addParam("player", "The player number")
.addParam("id", "Id game")
.addParam("bet", "Bet")
.setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TicTacToe")
    const contract = await Token.attach(taskArgs.address)
    const sign = await hre.ethers.getSigners();
    //const erc = await contract.token();
    //const Token2 = await hre.ethers.getContractFactory("ERC20Mock");
    //const contractERC = await Token2.attach(erc);
    //await contractERC.connect(sign[taskArgs.player]).approve(taskArgs.address, taskArgs.bet);
    await contract.connect(sign[taskArgs.player]).joinGame(taskArgs.id, { value: hre.ethers.utils.parseUnits((taskArgs.bet), "finney") }); 
    //await contract.connect(sign[taskArgs.player]).joinGame(taskArgs.id)
    console.log("Done!")
})



// npx hardhat move-player --network ropsten --address $address --player $player --id $id --cell $cell
task("move-player", "Make a move")
    .addParam("address", "The contract address")
    .addParam("player", "The player number")
    .addParam("id", "Id game")
    .addParam("cell", "The position of the cell in the game")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        await contract.connect(sign[taskArgs.player]).movePlayer(taskArgs.id, taskArgs.cell)
        console.log("Done!")
    })


// npx hardhat isFinish --network ropsten --address $address --player $player --id $id
task("isFinish", "Check status game")
    .addParam("address", "The contract address")
    .addParam("player", "The player number")
    .addParam("id", "Id game")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        await contract.connect(sign[taskArgs.player]).isFinish(taskArgs.id)
        console.log("Done!")
    })


// npx hardhat get-player-games --network ropsten --address $address --player $player
task("get-player-games", "Get all games by player")
    .addParam("address", "The contract address")
    .addParam("player", "The player address")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const answer = await contract.getGamesByPlayer(taskArgs.player)
        console.log(answer)
        console.log("Done!")
    })


// npx hardhat get-statistic-player --network ropsten --address $address --player $player
task("get-statistic-player", "Get statistic by player")
    .addParam("address", "The contract address")
    .addParam("player", "The player address")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const answer = await contract.statisticsPlayer(taskArgs.player)
        console.log(answer)
        console.log("Done!")
    })


// npx hardhat get-statistic-games --network ropsten --address $address 
task("get-statistic-games", "Get statistic by all games")
    .addParam("address", "The contract address")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const answer = await contract.statisticsGames()
        console.log(answer)
        console.log("Done!")
    })


// npx hardhat get-one-game --network ropsten --address $address --id $id
task("get-one-game", "Get one game of id")
    .addParam("address", "The contract address")
    .addParam("id", "Id game")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const answer = await contract.getOneGame(taskArgs.id)
        console.log(answer)
        console.log("Done!")
    })




// npx hardhat inc-game-acc --network localhost --address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --player 1 --amount 100
task("inc-game-acc", "Increasing the game account")
    .addParam("address", "The contract address")
    .addParam("player", "The player address")
    .addParam("amount", "The player address")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
 

        await contract.connect(sign[taskArgs.player]).incGameAcc({ value: hre.ethers.utils.parseUnits((taskArgs.amount), "finney") }); 
           
        console.log("Done!")
    })



  
// npx hardhat balance-erc --network localhost --address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
task("balance-erc", "Balance erc")
    .addParam("address", "The contract address")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        let balance = await contract.balancePlayer(taskArgs.address)
        console.log(`Acc: ${taskArgs.address} , balance: ${balance} `);

        const accounts = await hre.ethers.getSigners()
        for (const account of accounts) {
            balance = await contract.balancePlayer(account.address)
            console.log(`Acc: ${account.address } , balance: ${balance} `);
        }
        console.log("Done!")
    })
    

    // npx hardhat set-wallet --network localhost --address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --player 0 --wallet 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
task("set-wallet", "Change address of wallet")
.addParam("address", "The contract address")
.addParam("player", "The player address")
.addParam("wallet", "The wallet address")
.setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("TicTacToe")
    const contract = await Token.attach(taskArgs.address)
    const sign = await hre.ethers.getSigners();
    await contract.connect(sign[taskArgs.player]).setWallet(taskArgs.wallet);       
    console.log("Done!")
})

    // npx hardhat set-commission --network localhost --address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --player 0 --commission 10
    task("set-commission", "Change commision")
    .addParam("address", "The contract address")
    .addParam("player", "The player address")
    .addParam("commission", "new commission")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        await contract.connect(sign[taskArgs.player]).setCommission(taskArgs.commission);       
        console.log("Done!")
    })
    

// npx hardhat withdrawal-game-acc --network localhost --address 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 --player 1 --amount 100
task("withdrawal-game-acc", "Player withdraws ERC from account")
    .addParam("address", "The contract address")
    .addParam("player", "The player address")
    .addParam("amount", "Number of ERC")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("TicTacToe")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();
        const erc = await contract.token();
        const Token2 = await hre.ethers.getContractFactory("ERC20Mock");
        const contractERC = await Token2.attach(erc);
        await contractERC.connect(sign[taskArgs.player]).approve(taskArgs.address, taskArgs.amount);
        await contract.connect(sign[taskArgs.player]).withdrawalGameAcc(taskArgs.amount); 
        console.log("Done!")
    })


// Wollet setVater


// npx hardhat set-vater --network localhost --address 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 --player 0 --vater 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 --id 1
task("set-vater", "Change the voiting's address")
    .addParam("address", "The contract address")
    .addParam("player", "The player address") 
    .addParam("vater", "The new voiting's address")
    .addParam("id", "Id voting")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("Wallet")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();       
        await contract.connect(sign[taskArgs.player]).setVater(taskArgs.vater, taskArgs.id); 
        console.log("Done!")
    })


// npx hardhat new-transaction --network localhost --address 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 --player 0 --to 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 --amount 100
task("new-transaction", "Create the transaction")
    .addParam("address", "The contract address")
    .addParam("player", "The player address") 
    .addParam("to", "Address of the recipient")
    .addParam("amount", "Sum")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("Wallet")
        const contract = await Token.attach(taskArgs.address)
        const sign = await hre.ethers.getSigners();       
        await contract.connect(sign[taskArgs.player]).newTransaction(taskArgs.to, hre.ethers.utils.parseUnits((taskArgs.amount), "finney")); 
        console.log("Done!")
    })

    
// npx hardhat conf-transaction --network localhost --address 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 --player 0 --id 0
task("conf-transaction", "Vote for a transaction")
.addParam("address", "The contract address")
.addParam("player", "The player address") 
.addParam("id", "Id transaction")
.setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("Wallet")
    const contract = await Token.attach(taskArgs.address)
    const sign = await hre.ethers.getSigners();       
    await contract.connect(sign[taskArgs.player]).confTransaction(taskArgs.id); 
    console.log("Done!")
})


// npx hardhat wallet-balance --network localhost --address 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 --player 0 
task("wallet-balance", "Get balance of wallet")
.addParam("address", "The contract address")
.addParam("player", "The player address") 
.setAction(async (taskArgs, hre) => {
    const Token = await hre.ethers.getContractFactory("Wallet")
    const contract = await Token.attach(taskArgs.address)
    const sign = await hre.ethers.getSigners();       
    const result = await contract.connect(sign[taskArgs.player]).walletBalance(); 
    console.log(result);
    console.log("Done!");
})



