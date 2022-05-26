import { task } from "hardhat/config"

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})


task("balance", "Prints the list of accounts and balance", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners()

    //let balance = await hre.ethers.provider.getBalance("0x8D49D9C2fAd468d346c6EC00CE59Ccd3fEB7844A")
    //console.log(`Acc: ${"0x8D49D9C2fAd468d346c6EC00CE59Ccd3fEB7844A"} , balance: ${balance} `);

    for (const account of accounts) {
        let balance = await hre.ethers.provider.getBalance(account.address)
        console.log(`Acc: ${account.address } , balance: ${balance} `);
    }
})

