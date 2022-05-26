import { expect, use } from "chai"
import { ethers, waffle } from "hardhat"
import { BigNumber } from "ethers"
import { prepareSigners, prepareWallet } from "./utils/prepare"

use(waffle.solidity)

function checkBignumber(answer: BigNumber, amount: number,) {
    expect(answer).to.eq(BigNumber.from(amount).mul(BigNumber.from(10 ** 15)));
}

describe("Wallet contract payable", function () {
    beforeEach(async function () {
        await prepareSigners(this)
        await prepareWallet(this, this.bob)
    })

    describe("1. Function receive", function () {
        it("1.1. Balance by default", async function () {
            this.result2 = await this.token5.walletBalance();  // Баланс после деплоя
            expect(this.result2).to.eq(0);
        })

        it("1.2. Wallet deposit ETH", async function () {
            // Тёма закидывает на счет кошелька 100 токенов
            await expect(
                this.tema.sendTransaction({
                    to: this.token5.address,
                    value: ethers.utils.parseUnits(this.amount1.toString(), "wei"),
                })
            )
                .to.emit(this.token5, 'Payable') // Тестирование события 
                .withArgs(this.tema.address, this.amount1); // Аргументы события

            this.result2 = await this.token5.walletBalance();  // Баланс кошелька
            expect(this.result2).to.eq(this.amount1);

            // Миша закидывает на счет кошелька 200 токенов
            await expect(
                this.misha.sendTransaction({
                    to: this.token5.address,
                    value: ethers.utils.parseUnits((2 * this.amount1).toString(), "wei"),
                })
            )
                .to.emit(this.token5, 'Payable') // Тестирование события 
                .withArgs(this.misha.address, 2 * this.amount1); // Аргументы события

            this.result2 = await this.token5.walletBalance();  // Баланс кошелька
            expect(this.result2).to.eq(this.amount1 + 2 * this.amount1);
        })

        it("1.3. check require", async function () {
            //Нельзя отправить отрицательное значение
            await expect(
                this.tema.sendTransaction({
                    to: this.token5.address,
                    value: -1,
                })
            ).to.be.reverted;  // Нельзя отправить 0 эфира
        })
    })

    describe("2. Function setVater", function () {
        it("2.1. Vater by default", async function () {
            this.result2 = await this.token5.getVater(1);  // Доверенное лицо №1 после деплоя
            expect(this.result2).to.eq(this.nullAddress);
            this.result2 = await this.token5.getVater(2);  // Доверенное лицо №2 после деплоя
            expect(this.result2).to.eq(this.nullAddress);
        })

        it("2.2. Check Basic functionality", async function () {
            await expect(this.token5.setVater(this.tema.address, 1))
                .to.emit(this.token5, 'SetVater') // Тестирование события 
                .withArgs(this.tema.address, 1); // Аргументы события
            this.result2 = await this.token5.getVater(1);  // Доверенное лицо №1 после деплоя
            expect(this.result2).to.eq(this.tema.address);

            await expect(this.token5.setVater(this.misha.address, 2))
                .to.emit(this.token5, 'SetVater') // Тестирование события 
                .withArgs(this.misha.address, 2); // Аргументы события
            this.result2 = await this.token5.getVater(2);  // Доверенное лицо №1 после деплоя
            expect(this.result2).to.eq(this.misha.address);
        })

        it("2.3. check require", async function () {
            await expect(this.token5.setVater(this.bob.address, 1)).to.be.reverted;  // Нельзя записывать самого себя
            await expect(this.token5.setVater(this.tema.address, 0)).to.be.reverted;  // Неверный индекс довереного лица
            await this.token5.setVater(this.tema.address, 1);
            await expect(this.token5.setVater(this.tema.address, 2)).to.be.reverted;  // Нельзя записывать одного пользователя два раза
            await this.token5.setVater(this.misha.address, 2);
            await expect(this.token5.setVater(this.misha.address, 1)).to.be.reverted;  // Нельзя записывать одного пользователя два раза
        })
    })

    describe("3. Function newTransaction", function () {
        it("3.1. Check Basic functionality", async function () {

            // Миша закинул эфир на кошелек
            await this.misha.sendTransaction({
                to: this.token5.address,
                value: ethers.utils.parseUnits(this.amount1.toString(), "wei"),
            });

            await this.token5.setVater(this.tema.address, 1)
            await this.token5.setVater(this.misha.address, 2)
            // Создаем транзакцию на вывод средств с кошелька
            await expect(this.token5.connect(this.tema).newTransaction(this.tema.address, this.amount1))
                .to.emit(this.token5, 'NewTransaction') // Тестирование события 
                .withArgs(0, this.tema.address, this.amount1); // Аргументы события

            // Создаем транзакцию на вывод средств с кошелька
            await expect(this.token5.connect(this.misha).newTransaction(this.bob.address, this.amount1))
                .to.emit(this.token5, 'NewTransaction') // Тестирование события 
                .withArgs(1, this.bob.address, this.amount1); // Аргументы события
        })

        it("3.2. check require", async function () {
            // Миша закинул эфир на кошелек
            this.misha.sendTransaction({
                to: this.token5.address,
                value: ethers.utils.parseUnits(this.amount1.toString(), "wei"),
            });
            await expect(this.token5.connect(this.bob).newTransaction(this.nullAddress, this.amount1)).to.be.reverted;  // Неверный адресс получателя
            await expect(this.token5.connect(this.bob).newTransaction(this.tema.address, 2 * this.amount1)).to.be.reverted;  // Недостаточно сррдств на кошельке
            await expect(this.token5.connect(this.tema).newTransaction(this.tema.address, this.amount1)).to.be.reverted;  // Нет прав для создания транзакции
        })
    })

    describe("4. Function confTransaction", function () {
        it("4.1. Check Basic functionality", async function () {
            this.result3 = await ethers.provider.getBalance(this.tema.address);

            // Миша закинул эфир на кошелек
            await this.misha.sendTransaction({
                to: this.token5.address,
                value: ethers.utils.parseUnits(this.amount1.toString(), "wei"),
            });

            await this.token5.setVater(this.tema.address, 1)
            await this.token5.setVater(this.misha.address, 2)
            await this.token5.connect(this.misha).newTransaction(this.tema.address, this.amount1); // Создаем транзакцию на вывод средств с кошелька

            // Создаем транзакцию на вывод средств с кошелька
            await expect(this.token5.connect(this.misha).confTransaction(0))
                .to.emit(this.token5, 'ConfTransaction') // Тестирование события 
                .withArgs(this.misha.address, 0); // Аргументы события

            // Создаем транзакцию на вывод средств с кошелька
            await expect(this.token5.connect(this.bob).confTransaction(0))
                .to.emit(this.token5, 'CallETH') // Тестирование события 
                .withArgs(this.tema.address, this.amount1); // Аргументы события

            this.result2 = await ethers.provider.getBalance(this.tema.address); // Количество эфира ETH у Тёмы
            expect(this.result2).to.eq(BigNumber.from(this.result3).add(this.amount1));
        })

        it("4.2. check require", async function () {
            // Миша закинул эфир на кошелек
            this.misha.sendTransaction({
                to: this.token5.address,
                value: ethers.utils.parseUnits(this.amount1.toString(), "wei"),
            });

            await this.token5.setVater(this.tema.address, 1)
            await this.token5.setVater(this.misha.address, 2)

            await this.token5.connect(this.misha).newTransaction(this.tema.address, this.amount1); // Создаем транзакцию на вывод средств с кошелька
            await this.token5.connect(this.misha).newTransaction(this.misha.address, this.amount1); // Создаем транзакцию на вывод средств с кошелька
            await expect(this.token5.connect(this.tema).confTransaction(0)).to.be.reverted;  // Нельзя подтверждать свою транзакцию
            await this.token5.connect(this.misha).confTransaction(0);
            await this.token5.connect(this.bob).confTransaction(0);
            await expect(this.token5.connect(this.misha).confTransaction(0)).to.be.reverted;  // Нельзя подтверждать уже завершенную транзакцию
            await this.token5.connect(this.tema).confTransaction(1);
            await expect(this.token5.connect(this.bob).confTransaction(1)).to.be.reverted; // Недостаточно средств на кошельке
        })
    })

    describe("5. Functions getTransactions", function () {
        it("5.1. Check Basic functionality", async function () {
            this.result3 = await ethers.provider.getBalance(this.tema.address);
            // Миша закинул эфир на кошелек
            await this.misha.sendTransaction({
                to: this.token5.address,
                value: ethers.utils.parseUnits(this.amount1.toString(), "wei"),
            });

            await this.token5.setVater(this.tema.address, 1)
            await this.token5.setVater(this.misha.address, 2)

            await this.token5.connect(this.misha).newTransaction(this.tema.address, this.amount1); // Создаем транзакцию на вывод средств с кошелька
            await this.token5.connect(this.misha).newTransaction(this.misha.address, this.amount1 / 2); // Создаем транзакцию на вывод средств с кошелька
            await this.token5.connect(this.tema).confTransaction(1);
            await this.token5.connect(this.bob).confTransaction(1);

            this.result2 = await this.token5.getTransactions(0);
            expect(this.result2[0]).to.eq(this.tema.address);
            expect(this.result2[1]).to.eq(this.amount1);
            expect(this.result2[2][0]).to.eq(false);
            expect(this.result2[2][1]).to.eq(false);
            expect(this.result2[2][2]).to.eq(false);
            expect(this.result2[3]).to.eq(false);

            this.result2 = await this.token5.getTransactions(1);
            expect(this.result2[0]).to.eq(this.misha.address);
            expect(this.result2[1]).to.eq(this.amount1 / 2);
            expect(this.result2[2][0]).to.eq(true);
            expect(this.result2[2][1]).to.eq(true);
            expect(this.result2[2][2]).to.eq(false);
            expect(this.result2[3]).to.eq(true);
        })
    })
})