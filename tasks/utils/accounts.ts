import { task } from "hardhat/config"

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})


task("balance", "Prints the list of accounts and balance", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners()

    let balance = await hre.ethers.provider.getBalance("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
    console.log(`Acc: ${"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"} , balance: ${balance} `);

    for (const account of accounts) {
        let balance = await hre.ethers.provider.getBalance(account.address)
        console.log(`Acc: ${account.address } , balance: ${balance} `);
    }
})

