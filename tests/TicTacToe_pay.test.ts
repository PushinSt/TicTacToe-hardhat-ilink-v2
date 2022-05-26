import { expect, use } from "chai"
import { ethers, waffle } from "hardhat"
import { BigNumber } from "ethers"
import { prepareERC20Tokens, prepareTicTacToe, prepareSigners, prepareWallet } from "./utils/prepare"
import { latest, increase, advanceBlock, duration } from "./utils/time"

use(waffle.solidity)

function checkBignumber(answer: BigNumber, amount: number,) {
    expect(answer).to.eq(BigNumber.from(amount).mul(BigNumber.from(10 ** 15)));
}

describe("TicTacToe contract payable", function () {
    beforeEach(async function () {
        await prepareSigners(this)
        await prepareERC20Tokens(this, this.bob)
        await prepareTicTacToe(this, this.bob)
        await prepareWallet(this, this.bob)

        const wallet = this.token5.address;
        this.token4.setWallet(wallet);
        await this.token1.connect(this.bob).transfer(this.token4.address, 1000000);
    })

    describe("1. Function incGameAcc", function () {
        it("1.1. Number of ERC by default", async function () {
            this.result2 = await this.token1.balanceOf(this.token4.address);  // Количество монет ERC у контракта после деплоя
            expect(this.result2).to.eq(10 ** 6);
        })

        it("1.2. Account increase check", async function () {
            await expect(this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") })) // Тёма закидывает на свой счет 100 токенов
                .to.emit(this.token4, 'IncGameAcc') // Тестирование события 
                .withArgs(this.tema.address, this.amount1); // Аргументы события
            this.result2 = await this.token1.balanceOf(this.tema.address); // Количество монет ERC у Тёмы
            expect(this.result2).to.eq(this.amount1);
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, this.amount1);
        })

        it("1.3. Accounts increase check", async function () {
            await expect(this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") })) // Тёма закидывает на свой счет 100 токенов
                .to.emit(this.token4, 'IncGameAcc') // Тестирование события 
                .withArgs(this.tema.address, this.amount1); // Аргументы события
            this.result2 = await this.token1.balanceOf(this.tema.address); // Количество монет ERC у Тёмы
            expect(this.result2).to.eq(this.amount1);
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1);
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, this.amount1);

            await expect(this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits((2 * this.amount1).toString(), "finney") })) // Миша закидывает на свой счет 200 токенов
                .to.emit(this.token4, 'IncGameAcc') // Тестирование события 
                .withArgs(this.misha.address, 2 * this.amount1); // Аргументы события
            this.result2 = await this.token1.balanceOf(this.misha.address); // Количество монет ERC у Миши
            expect(this.result2).to.eq(2 * this.amount1);
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1 - 2 * this.amount1);
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, this.amount1 + 2 * this.amount1);

            await expect(await this.token4.connect(this.bob).incGameAcc({ value: ethers.utils.parseUnits((10 * this.amount1).toString(), "finney") })) // Боб закидывает на свой счет 1000 токенов
                .to.emit(this.token4, 'IncGameAcc') // Тестирование события 
                .withArgs(this.bob.address, 10 * this.amount1); // Аргументы события
            this.result2 = await this.token1.balanceOf(this.bob.address); // Количество монет ERC у Боба
            expect(this.result2).to.eq(10 * this.amount1);
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1 - 2 * this.amount1 - 10 * this.amount1);
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, this.amount1 + 2 * this.amount1 + 10 * this.amount1);

            await expect(this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits((5 * this.amount1).toString(), "finney") })) // Тёма закидывает на свой счет 500 токенов
                .to.emit(this.token4, 'IncGameAcc') // Тестирование события 
                .withArgs(this.tema.address, 5 * this.amount1); // Аргументы события
            this.result2 = await this.token1.balanceOf(this.tema.address); // Количество монет ERC у Тёмы
            expect(this.result2).to.eq(this.amount1 + 5 * this.amount1);
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1 - 2 * this.amount1 - 10 * this.amount1 - 5 * this.amount1);
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, this.amount1 + 2 * this.amount1 + 10 * this.amount1 + 5 * this.amount1);
        })

        it("1.4. Check require", async function () {
            await expect(this.token4.connect(this.tema).incGameAcc({ value: 0 })).to.be.reverted;  // Нельзя отправить 0 эфира
            await expect(this.token4.connect(this.tema).incGameAcc({ value: 100 })).to.be.reverted;  // Не хватит эфира даже на одну монету ERC
            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount_lot.toString(), "finney") });  // покупаем много монет
            await expect(this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount_lot.toString(), "finney") })).to.be.reverted; // монеты закончились
        })
    })

    describe("2. Function setWallet / getWallet", function () {
        it("2.1. Check Basic functionality", async function () {
            await expect(this.token4.connect(this.bob).setWallet(this.tema.address)) // Установить новый адрес кошелька
                .to.emit(this.token4, 'SetWallet') // Тестирование события 
                .withArgs(this.tema.address); // Аргументы события
            this.result2 = await this.token4.connect(this.bob).getWallet(); // Прочитать новый адрес кошелька
            expect(this.result2).to.eq(this.tema.address);
        })

        it("2.2. Check require", async function () {
            await expect(this.token4.connect(this.misha).setWallet(this.tema.address)).to.be.reverted;  // Установить новый адрес кошелька может только владелец
            await expect(this.token4.connect(this.bob).setWallet(this.nullAddress)).to.be.reverted;  // Нельзя установить нулевой адрес
            await expect(this.token4.connect(this.tema).getWallet()).to.be.reverted;  // Прочитать адрес кошелька может только владелец
        })
    })

    describe("3. Function setCommission / getCommission", function () {
        it("3.1. Check Basic functionality", async function () {
            await expect(await this.token4.connect(this.bob).setCommission(50)) // Установить новую комиссию
                .to.emit(this.token4, 'SetCommission') // Тестирование события 
                .withArgs(50); // Аргументы события
            this.result2 = await this.token4.connect(this.bob).getCommission(); // Прочитать новую комиссию кошелька
            expect(this.result2).to.eq(50);
        })

        it("3.2. Check require", async function () {
            await expect(this.token4.connect(this.misha).setCommission(50)).to.be.reverted;  // Установить новую комиссию может только владелец
            await expect(this.token4.connect(this.bob).setCommission(1000)).to.be.reverted;  // Нельзя установить комиссию больше 100%
            await expect(this.token4.connect(this.tema).getCommission()).to.be.reverted;  // Прочитать комиссию может только владелец
        })
    })

    describe("4. Function withdrawalGameAcc", function () {
        it("4.1. Check Basic functionality", async function () {
            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тёма закидывает на свой счет 100 токенов
            this.result2 = await this.token1.balanceOf(this.tema.address); // Количество монет ERC у Тёмы
            expect(this.result2).to.eq(this.amount1);
            this.result3 = await ethers.provider.getBalance(this.tema.address); // Количество эфира ETH у Тёмы
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1);

            await this.token1.connect(this.tema).approve(this.token4.address, this.amount1); // Тёма разрешает отправку ERC на контракт
            expect(await this.token1.allowance(this.tema.address, this.token4.address)).to.eq(this.amount1); // Количество разрешенных к отправке монет

            await expect(this.token4.connect(this.tema).withdrawalGameAcc(this.amount1)) // Обмен ERC на ETH
                .to.emit(this.token4, 'WithdrawalGameAcc') // Тестирование события 
                .withArgs(this.tema.address, this.amount1); // Аргументы события
            this.result2 = await this.token1.balanceOf(this.tema.address); // Количество монет ERC у Тёмы
            expect(this.result2).to.eq(0);
            this.result2 = await ethers.provider.getBalance(this.tema.address); // Количество эфира ETH у Тёмы
            expect(this.result2).to.above(this.result3); // Количество эфира после продажи ERC выросло
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6);

            await this.token1.connect(this.misha).approve(this.token4.address, 2 * this.amount1); // Миша разрешает отправку 200 монет ERC на контракт (Которых у него ещё нет!)
            await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") }); // Миша закидывает на свой счет 100 монет ERC
            expect(await this.token1.allowance(this.misha.address, this.token4.address)).to.eq(2 * this.amount1); // Количество у Миши разрешенных к отправке монет
            this.result2 = await this.token1.balanceOf(this.misha.address); // Количество монет ERC у Миши
            expect(this.result2).to.eq(this.amount1);

            await expect(this.token4.connect(this.misha).withdrawalGameAcc(this.amount1)) // Миша меняет ERC на ETH
                .to.emit(this.token4, 'WithdrawalGameAcc') // Тестирование события 
                .withArgs(this.misha.address, this.amount1); // Аргументы события
            expect(await this.token1.allowance(this.misha.address, this.token4.address)).to.eq(this.amount1); // Количество у Миши разрешенных к отправке монет
            this.result2 = await this.token1.balanceOf(this.misha.address); // Количество монет ERC у Миши
            expect(this.result2).to.eq(0);
            await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
            expect(await this.token1.allowance(this.misha.address, this.token4.address)).to.eq(this.amount1); // Количество разрешенных к отправке монет
            this.result2 = await this.token1.balanceOf(this.misha.address); // Количество монет ERC у Миши
            expect(this.result2).to.eq(this.amount1);

            await expect(this.token4.connect(this.misha).withdrawalGameAcc(this.amount1)) // Обмен ERC на ETH
                .to.emit(this.token4, 'WithdrawalGameAcc') // Тестирование события 
                .withArgs(this.misha.address, this.amount1); // Аргументы события
            expect(await this.token1.allowance(this.misha.address, this.token4.address)).to.eq(0); // Количество разрешенных к отправке монет
            this.result2 = await this.token1.balanceOf(this.misha.address); // Количество монет ERC у Миши
            expect(this.result2).to.eq(0);

        })

        it("4.2. Check require", async function () {
            await expect(this.token4.connect(this.tema).withdrawalGameAcc(this.amount1)).to.be.reverted;  // Нет разрешения на отправку ERC       
            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тёма закидывает на свой счет 100 токенов
            await this.token1.connect(this.tema).approve(this.token4.address, 2 * this.amount1); // Тёма разрешает отправку ERC на контракт
            await expect(this.token4.connect(this.tema).withdrawalGameAcc(0)).to.be.reverted;  // Для отправки нужно больше 0 ERC
            await expect(this.token4.connect(this.tema).withdrawalGameAcc(2 * this.amount1)).to.be.reverted;  // Недостаточно ERC на балансе
        })



    })

    describe("5. Function createGame/joinGame (payble)", function () {
        it("5.1. Check Basic functionality", async function () {
            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тёма закидывает на свой счет 100 токенов
            await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тёма разрешает отправку ERC на контракт

            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], this.bid)) //  Тема создает игру и делает ставку
                .to.emit(this.token4, 'PlaceBet') // Тестирование события 
                .withArgs(this.tema.address, this.bid); // Аргументы события


            this.result2 = await this.token4.connect(this.bob).getHeldERC(); // Ставка попадает в захолдированые средства
            expect(this.result2).to.eq(this.bid);
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1 + this.bid); // Количество ERC на контракте

            await this.token1.connect(this.tema).approve(this.token4.address, 2 * this.bid); // Тёма разрешает отправку ERC на контракт  
            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], 2 * this.bid)) //   Тема создает вторую игру и делает удвоенную ставку
                .to.emit(this.token4, 'PlaceBet') // Тестирование события 
                .withArgs(this.tema.address, 2 * this.bid); // Аргументы события

            this.result2 = await this.token4.connect(this.bob).getHeldERC(); // Ставка попадает в захолдированые средства
            expect(this.result2).to.eq(this.bid + 2 * this.bid);
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1 + this.bid + 2 * this.bid); // Количество ERC на контракте

            expect((await this.token4.statisticsGames())[0]).to.eq(BigNumber.from(2)); // Создано две игры

            await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов

            await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт
            await this.token4.connect(this.misha).joinGame(0); // Миша присоединяется к игре и делает ставку
            this.result2 = await this.token4.connect(this.bob).getHeldERC(); // Ставка попадает в захолдированые средства
            expect(this.result2).to.eq(this.bid + 2 * this.bid + this.bid);
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - this.amount1 + this.bid + 2 * this.bid - this.amount1 + this.bid); // Количество ERC на контракте
        })

        it("5.2. Bet in ETH", async function () {




            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], 0, { value: ethers.utils.parseUnits("10", "finney") })) //  Тема создает игру и делает ставку
                .to.emit(this.token4, 'PlaceBet') // Тестирование события 
                .withArgs(this.tema.address, ethers.utils.parseUnits("10", "finney")); // Аргументы события

            this.result2 = await this.token4.connect(this.bob).getHeldETH(); // Ставка попадает в захолдированые средства
            expect(this.result2).to.eq(ethers.utils.parseUnits("10", "finney"));
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(ethers.utils.parseUnits("10", "finney")); // Количество ETH на контракте


            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], 0, { value: ethers.utils.parseUnits("20", "finney") })) //   Тема создает вторую игру и делает удвоенную ставку
                .to.emit(this.token4, 'PlaceBet') // Тестирование события 
                .withArgs(this.tema.address, ethers.utils.parseUnits("20", "finney")); // Аргументы события


            this.result2 = await this.token4.connect(this.bob).getHeldETH(); // Ставка попадает в захолдированые средства
            expect(this.result2).to.eq(ethers.utils.parseUnits("30", "finney"));
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(ethers.utils.parseUnits("30", "finney")); // Количество ETH на контракте


            expect((await this.token4.statisticsGames())[0]).to.eq(BigNumber.from(2)); // Создано две игры



            await this.token4.connect(this.misha).joinGame(0, { value: ethers.utils.parseUnits("10", "finney") }); // Миша присоединяется к игре и делает ставку

            await this.token4.connect(this.bob).joinGame(1, { value: ethers.utils.parseUnits("20", "finney") }); // Боб присоединяется к игре и делает ставку

            this.result2 = await this.token4.connect(this.bob).getHeldETH(); // Ставка попадает в захолдированые средства
            expect(this.result2).to.eq(ethers.utils.parseUnits("60", "finney"));
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(ethers.utils.parseUnits("60", "finney")); // Количество ETH на контракте

        })


        it("5.3. Check require", async function () {
            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тёма закидывает на свой счет 100 токенов
            await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тёма разрешает отправку ERC на контракт
            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], 0)).to.be.reverted;  // Нельзя сделать нулевую ставку
            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], 1001)).to.be.reverted;  // Нельзя сделать ставку больше 1000
            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], 2 * this.bid)).to.be.reverted;  // Нельзя сделать ставку больше, чем разрешил на отправку

            await this.token1.connect(this.tema).approve(this.token4.address, this.amount1 + this.bid); // Тёма разрешает отправку ERC на контракт
            await expect(this.token4.connect(this.tema).createGame(this.timeWait[0], this.amount1 + this.bid)).to.be.reverted;  // Нельзя сделать ставку больше, чем у тебя есть

            await expect(this.token4.statisticsGames()).to.be.reverted;   // Не создано ни одной игры

            await this.token4.connect(this.tema).createGame(this.timeWait[0], this.bid); // Тема создает игру и делает ставку
            await expect(this.token4.connect(this.misha).joinGame(0)).to.be.reverted;  // Нельзя присоединиться к игре не имея ERC
            await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
            await expect(this.token4.connect(this.misha).joinGame(0)).to.be.reverted;  // Нельзя присоединиться к игре не имея разрешенных к отправке ERC
            await this.token1.connect(this.misha).approve(this.token4.address, this.bid / 2); // Миша разрешает отправку ERC на контракт
            await expect(this.token4.connect(this.misha).joinGame(0)).to.be.reverted;  // Нельзя присоединиться к игре имея недостаточно разрешенных к отправке ERC

        })
    })

    describe("6. Function isFinish (payble) and takeCommission and withdrawalGameAcc", function () {
        it("6.1. Check win player", async function () {


            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тёма закидывает на свой счет 100 токенов
            await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits((this.amount1).toString(), "finney") });  //  Миша закидывает на свой счет 200 токенов

            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - 2 * this.amount1); // Количество ERC на контракте 
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, 2 * this.amount1);


            await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тёма разрешает отправку ERC на контракт
            await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт

            await this.token4.connect(this.tema).createGame(this.timeWait[0], this.bid); // Тема создает игру и делает ставку
            await this.token4.connect(this.misha).joinGame(0); // Миша подключается к игре и делает ставку
            expect(await this.token1.balanceOf(this.token4.address)).to.eq(10 ** 6 - 2 * this.amount1 + 2 * this.bid); // Количество ERC на контракте 
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, 2 * this.amount1);


            // Делаем ходы. Последний ход выигрышный (Тема проиграл, Миша выиграл)
            for (let i = 0; i < 6; i = i + 2) {
                await this.token4.connect(this.tema).movePlayer(0, this.combinations[0][i])
                await this.token4.connect(this.misha).movePlayer(0, this.combinations[0][i + 1])
            }

            this.result2 = await this.token1.balanceOf(this.tema.address);
            expect(this.result2).to.eq(this.amount1 - this.bid); // Счет ERC проигравшего
            this.result2 = await this.token1.balanceOf(this.misha.address);
            expect(this.result2).to.eq(this.amount1 - this.bid + 1.8 * this.bid); // Счет ERC победившего
            this.result2 = await this.token1.balanceOf(this.token4.address);
            expect(this.result2).to.eq(10 ** 6 - this.amount1 - this.amount1 + this.bid + this.bid - 1.8 * this.bid); // Счет ERC контракта 
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, 2 * this.amount1 - 2 * this.bid + 1.8 * this.bid);
            this.result2 = await this.token5.walletBalance(); // Количество эфира ETH на кошельке
            checkBignumber(this.result2, 0.2 * this.bid);

            expect(await this.token4.connect(this.bob).getHeldERC()).to.eq(0); // После окончания игры нет захолдированных средств

            await this.token1.connect(this.tema).approve(this.token4.address, this.amount1 - this.bid); // Тёма разрешает отправку ERC на контракт
            await this.token4.connect(this.tema).withdrawalGameAcc(this.amount1 - this.bid); // Тема выводит свои средства с игрового счетва
            this.result2 = await this.token1.balanceOf(this.tema.address);
            expect(this.result2).to.eq(0); // Счет Темы
            this.result2 = await this.token1.balanceOf(this.token4.address);
            expect(this.result2).to.eq(10 ** 6 - this.amount1 - this.amount1 + this.bid + this.bid - 1.8 * this.bid + (this.amount1 - this.bid)); // Счет ERC контракта 
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, 2 * this.amount1 - 2 * this.bid + 1.8 * this.bid - (this.amount1 - this.bid));

            await this.token1.connect(this.misha).approve(this.token4.address, this.amount1 - this.bid + 1.8 * this.bid); // Миша разрешает отправку ERC на контракт
            await this.token4.connect(this.misha).withdrawalGameAcc(this.amount1 - this.bid + 1.8 * this.bid); // Миша выводит свои средства с игрового счетва
            this.result2 = await this.token1.balanceOf(this.misha.address);
            expect(this.result2).to.eq(0); // Счет Миши
            this.result2 = await this.token1.balanceOf(this.token4.address);
            expect(this.result2).to.eq(10 ** 6 - this.amount1 - this.amount1 + this.bid + this.bid - 1.8 * this.bid + this.amount1 - this.bid + (this.amount1 - this.bid + 1.8 * this.bid)); // Счет ERC контракта 
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, 2 * this.amount1 - 2 * this.bid + 1.8 * this.bid - (this.amount1 - this.bid) - (this.amount1 - this.bid + 1.8 * this.bid));
        })

        it("6.2. Check win player (in ETH)", async function () {
            this.result2 = await ethers.provider.getBalance(this.misha.address);
            await this.token4.connect(this.tema).createGame(this.timeWait[0], 1, { value: ethers.utils.parseUnits("10", "finney") }); // Тёма делает ставку в ETH
            await this.token4.connect(this.misha).joinGame(0, { value: ethers.utils.parseUnits("10", "finney") }); // Миша присоединяется к игре и делает ставку в ETH
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(ethers.utils.parseUnits("20", "finney")); // Количество ETH на контракте
            // Делаем ходы. Последний ход выигрышный (Тема проиграл, Миша выиграл)
            for (let i = 0; i < 6; i = i + 2) {
                await this.token4.connect(this.tema).movePlayer(0, this.combinations[0][i])
                await this.token4.connect(this.misha).movePlayer(0, this.combinations[0][i + 1])
            }
            this.result3 = await ethers.provider.getBalance(this.misha.address);
            expect(this.result3).to.above(this.result2); // После победы эфира стало больше
            expect(await this.token4.connect(this.bob).getHeldETH()).to.eq(0); // После окончания игры нет захолдированных средств
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(0); // Количество ETH на контракте
            expect(await ethers.provider.getBalance(this.token5.address)).to.eq(ethers.utils.parseUnits("2", "finney")); // Количество ETH на кошельке



            // Созадаём вторую игру
            this.result2 = await ethers.provider.getBalance(this.misha.address);
            await this.token4.connect(this.tema).createGame(this.timeWait[0], 1, { value: ethers.utils.parseUnits("20", "finney") }); // Тёма делает ставку в ETH
            await this.token4.connect(this.misha).joinGame(1, { value: ethers.utils.parseUnits("20", "finney") }); // Миша присоединяется к игре и делает ставку в ETH
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(ethers.utils.parseUnits("40", "finney")); // Количество ETH на контракте
            // Делаем ходы. Последний ход выигрышный (Тема проиграл, Миша выиграл)
            for (let i = 0; i < 6; i = i + 2) {
                await this.token4.connect(this.tema).movePlayer(1, this.combinations[0][i])
                await this.token4.connect(this.misha).movePlayer(1, this.combinations[0][i + 1])
            }
            this.result3 = await ethers.provider.getBalance(this.misha.address);
            expect(this.result3).to.above(this.result2); // После победы эфира стало больше
            expect(await this.token4.connect(this.bob).getHeldETH()).to.eq(0); // После окончания игры нет захолдированных средств
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(0); // Количество ETH на контракте
            expect(await ethers.provider.getBalance(this.token5.address)).to.eq(ethers.utils.parseUnits("6", "finney")); // Количество ETH на кошельке


            // Созадаём третью и четверую игру
            this.result2 = await ethers.provider.getBalance(this.misha.address);
            await this.token4.connect(this.tema).createGame(this.timeWait[0], 1, { value: ethers.utils.parseUnits("10", "finney") }); // Тёма делает ставку в ETH
            await this.token4.connect(this.misha).joinGame(2, { value: ethers.utils.parseUnits("10", "finney") }); // Миша присоединяется к игре и делает ставку в ETH
            await this.token4.connect(this.tema).createGame(this.timeWait[0], 1, { value: ethers.utils.parseUnits("20", "finney") }); // Тёма делает ставку в ETH
            await this.token4.connect(this.misha).joinGame(3, { value: ethers.utils.parseUnits("20", "finney") }); // Миша присоединяется к игре и делает ставку в ETH

            
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(ethers.utils.parseUnits("60", "finney")); // Количество ETH на контракте
            // Делаем ходы. Последний ход выигрышный (Тема проиграл, Миша выиграл)
            for (let i = 0; i < 6; i = i + 2) {
                await this.token4.connect(this.tema).movePlayer(3, this.combinations[0][i])
                await this.token4.connect(this.misha).movePlayer(3, this.combinations[0][i + 1])
            }
            this.result3 = await ethers.provider.getBalance(this.misha.address);
            expect(this.result3).to.above(this.result2); // После победы эфира стало больше
            expect(await this.token4.connect(this.bob).getHeldETH()).to.eq(ethers.utils.parseUnits("20", "finney")); // Осталась незаконченая игра
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(ethers.utils.parseUnits("20", "finney")); // Количество ETH на контракте
            expect(await ethers.provider.getBalance(this.token5.address)).to.eq(ethers.utils.parseUnits("10", "finney")); // Количество ETH на кошельке


            this.result2 = await ethers.provider.getBalance(this.misha.address);
            // Делаем ходы. Последний ход выигрышный (Тема проиграл, Миша выиграл)
            for (let i = 0; i < 6; i = i + 2) {
                await this.token4.connect(this.tema).movePlayer(2, this.combinations[0][i])
                await this.token4.connect(this.misha).movePlayer(2, this.combinations[0][i + 1])
            }
            this.result3 = await ethers.provider.getBalance(this.misha.address);
            expect(this.result3).to.above(this.result2); // После победы эфира стало больше
            expect(await this.token4.connect(this.bob).getHeldETH()).to.eq(0); // 
            expect(await ethers.provider.getBalance(this.token4.address)).to.eq(0); // Количество ETH на контракте
            expect(await ethers.provider.getBalance(this.token5.address)).to.eq(ethers.utils.parseUnits("12", "finney")); // Количество ETH на кошельке
        })


        it("6.2. Check timeout", async function () {
            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тёма закидывает на свой счет 100 токенов
            await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits((this.amount1).toString(), "finney") });  //  Миша закидывает на свой счет 200 токенов
            await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тёма разрешает отправку ERC на контракт
            await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт

            await this.token4.connect(this.tema).createGame(this.timeWait[0], this.bid); // Тема создает игру и делает ставку
            await this.token4.connect(this.misha).joinGame(0); // Миша подключается к игре и делает ставку

            await this.token4.connect(this.tema).movePlayer(0, this.combinations[0][0])
            await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед


            await expect(this.token4.isFinish(0)) // заканчиваем игру (по таймауту) и определяем победителя (Тема win)
                .to.emit(this.token4, 'ReturnWinERC') // Тестирование события 
                .withArgs(this.tema.address, 2 * this.bid); // Аргументы события

            //await this.token4.isFinish(0); //

            this.result2 = await this.token1.balanceOf(this.tema.address);
            expect(this.result2).to.eq(this.amount1 - this.bid + 1.8 * this.bid); // Счет ERC победившего
            this.result2 = await this.token1.balanceOf(this.misha.address);
            expect(this.result2).to.eq(this.amount1 - this.bid); // Счет ERC проигравшего
            this.result2 = await this.token1.balanceOf(this.token4.address);
            expect(this.result2).to.eq(10 ** 6 - this.amount1 - this.amount1 + this.bid + this.bid - 1.8 * this.bid); // Счет ERC контракта 
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, 2 * this.amount1 - 2 * this.bid + 1.8 * this.bid);
            this.result2 = await this.token5.walletBalance(); // Количество эфира ETH на кошельке
            checkBignumber(this.result2, 0.2 * this.bid);


            expect(await this.token4.connect(this.bob).getHeldERC()).to.eq(0); // После окончания игры нет захолдированных средств
        })

        it("6.3. Check draw", async function () {
            await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тёма закидывает на свой счет 100 токенов
            await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits((this.amount1).toString(), "finney") });  //  Миша закидывает на свой счет 200 токенов
            await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тёма разрешает отправку ERC на контракт
            await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт

            await this.token4.connect(this.tema).createGame(this.timeWait[0], this.bid); // Тема создает игру и делает ставку
            await this.token4.connect(this.misha).joinGame(0); // Миша подключается к игре и делает ставку

            // Сводим игру в ничью
            await this.token4.connect(this.tema).movePlayer(0, this.moves3[0])
            await this.token4.connect(this.misha).movePlayer(0, this.moves3[1])
            await this.token4.connect(this.tema).movePlayer(0, this.moves3[2])
            await this.token4.connect(this.misha).movePlayer(0, this.moves3[3])
            await this.token4.connect(this.tema).movePlayer(0, this.moves3[4])
            await this.token4.connect(this.misha).movePlayer(0, this.moves3[5])
            await this.token4.connect(this.tema).movePlayer(0, this.moves3[6])
            await this.token4.connect(this.misha).movePlayer(0, this.moves3[7])
            //await this.token4.connect(this.tema).movePlayer(0, this.moves3[8])

            await expect(this.token4.connect(this.tema).movePlayer(0, this.moves3[8])) // заканчиваем игру (по таймауту) и определяем победителя (Тема win)
                .to.emit(this.token4, 'TakeCommission') // Тестирование события 
                .withArgs(0.1 * this.bid); // Аргументы события



            this.result2 = await this.token1.balanceOf(this.tema.address);
            expect(this.result2).to.eq(this.amount1 - this.bid + 0.9 * this.bid); // Счет игрока после ничьи
            this.result2 = await this.token1.balanceOf(this.misha.address);
            expect(this.result2).to.eq(this.amount1 - this.bid + 0.9 * this.bid); // Счет игрока после ничьи
            this.result2 = await this.token1.balanceOf(this.token4.address);
            expect(this.result2).to.eq(10 ** 6 - this.amount1 - this.amount1 + this.bid + this.bid - 1.8 * this.bid); // Счет ERC контракт
            this.result2 = await ethers.provider.getBalance(this.token4.address); // Количество эфира ETH на контракте
            checkBignumber(this.result2, 2 * this.amount1 - 2 * this.bid + 1.8 * this.bid);
            this.result2 = await this.token5.walletBalance(); // Количество эфира ETH на кошельке
            checkBignumber(this.result2, 0.2 * this.bid);

            expect(await this.token4.connect(this.bob).getHeldERC()).to.eq(0); // После окончания игры нет захолдированных средств
        })
    })
})