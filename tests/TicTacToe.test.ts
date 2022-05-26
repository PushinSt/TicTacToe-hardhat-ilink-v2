import { expect, use } from "chai"
import { ethers, waffle } from "hardhat"
import { BigNumber } from "ethers"
import { prepareERC20Tokens, prepareTicTacToe, prepareSigners, prepareWallet } from "./utils/prepare"
import { latest, increase, advanceBlock, duration } from "./utils/time"

use(waffle.solidity)

// Функция сравнения игры
function compareGame(_answer: any, _player1: string, _player2: string, _grid: number[], _timeStart: BigNumber, _timeWait: BigNumber, _state: number) {
    expect(_answer.player1).to.eq(_player1);
    expect(_answer.player2).to.eq(_player2);
    expect(_answer.grid.length).to.eq(_grid.length);
    for (let i = 0; i < Math.min(_answer.grid.length, _grid.length); i++) {
        expect(_answer.grid[i]).to.eq(_grid[i]);
    }
    expect(_answer.timeStart).to.be.closeTo(_timeStart, 1); //+-1
    expect(_answer.timeWait).to.eq(_timeWait);
    expect(_answer.state).to.eq(_state);
}

describe("TicTacToe contract", function () {
    beforeEach(async function () {
        await prepareSigners(this)
        await prepareERC20Tokens(this, this.bob)
        await prepareTicTacToe(this, this.bob)
        await prepareWallet(this, this.bob)

        const wallet = this.token5.address;
        this.token4.setWallet(wallet);
        await this.token1.connect(this.bob).transfer(this.token4.address, 1000000);

        //const wallet = this.token5.address;
        //this.token4.setWallet(wallet);
        //const erc = await this.token4.token();
        //const Token2 = await ethers.getContractFactory("ERC20Mock");
        //this.token1 = await Token2.attach(erc);
    })

    describe("1. Deployment", function () {
        it("1.1. Contract address is correct", async function () {
            expect(this.token4.address).to.be.properAddress // Проверка, что адрес контракта корректный
        })

        it("1.2 Сontract after creation has 0 games", async function () {
            expect(this.token4.games.length).to.eq(0) // Проверка, что при создании контракта нет игр
        })
    })

    describe("2. Action", function () {
        // Тестирования функции создания игры
        describe("2.1 CreateGame", function () {
            // Проверка создания игры
            it("2.1.1. Create one game", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт

                await expect(this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid)) // Создание игры
                    .to.emit(this.token4, 'EventGame') // Тестирование события
                    .withArgs(0, 0, this.alice.address, this.nullAddress,  this.timeWait[0]) // Аргументы события
                this.result = await this.token4.getOneGame(0); // Получаем игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.nullAddress, [0, 0, 0, 0, 0, 0, 0, 0, 0], BigNumber.from(0), this.timeWait[0], 0);
            })

            // Проверка создания нескольких игр
            it("2.1.2. Create multiple games", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 2*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт

                await expect(this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid)) // Создание первой игры
                    .to.emit(this.token4, 'EventGame') // Тестирование события
                    .withArgs(0, 0, this.alice.address, this.nullAddress,  this.timeWait[0]) // Аргументы события
                this.result = await this.token4.getOneGame(0); // Получаем вторую игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.nullAddress, [0, 0, 0, 0, 0, 0, 0, 0, 0], BigNumber.from(0), this.timeWait[0], 0);

                await expect(this.token4.connect(this.alice).createGame(this.timeWait[1], this.bid)) // Создание второй игры
                    .to.emit(this.token4, 'EventGame') // Тестирование события
                    .withArgs(1, 0, this.alice.address, this.nullAddress,  this.timeWait[1]) // Аргументы события
                this.result = await this.token4.getOneGame(1); // Получаем вторую игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.nullAddress, [0, 0, 0, 0, 0, 0, 0, 0, 0], BigNumber.from(0), this.timeWait[1], 0);

                await expect(this.token4.connect(this.tema).createGame(this.timeWait[2], this.bid)) // Создание третьей игры
                    .to.emit(this.token4, 'EventGame') // Тестирование события
                    .withArgs(2, 0, this.tema.address, this.nullAddress,  this.timeWait[2]) // Аргументы события
                this.result = await this.token4.getOneGame(2); // Получаем третью игру и проверяем её параметры
                compareGame(this.result, this.tema.address, this.nullAddress, [0, 0, 0, 0, 0, 0, 0, 0, 0], BigNumber.from(0), this.timeWait[2], 0);

                await expect(this.token4.connect(this.misha).createGame(this.timeWait[3], this.bid)) // Создание четвертой игры
                    .to.emit(this.token4, 'EventGame') // Тестирование события
                    .withArgs(3, 0, this.misha.address, this.nullAddress,  this.timeWait[3]) // Аргументы события
                this.result = await this.token4.getOneGame(3); // Получаем четвертую игру и проверяем её параметры
                compareGame(this.result, this.misha.address, this.nullAddress, [0, 0, 0, 0, 0, 0, 0, 0, 0], BigNumber.from(0), this.timeWait[3], 0);
            })

            // Проверка сработки require
            it("2.1.3. Check require", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await expect(this.token4.connect(this.alice).createGame(0, this.bid)).to.be.reverted  // (Время ожидания игры должно быть > 0)
                await expect(this.token4.connect(this.alice).createGame(-10, this.bid)).to.be.reverted  // (Время ожидания игры должно быть > 0)
            })
        })

        // Тестирования функции приостановки/возобновления поиска игроков
        describe("2.2 PauseGame", function () {
            // Проверка паузы/возобновления поиска игроков
            it("2.2.1. Pause/Continue game", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры

                await expect(this.token4.connect(this.alice).pauseGame(0)) // Ставим поиск игроков на паузу
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 3, this.alice.address, this.nullAddress,  1) // Аргументы события
                this.result = await this.token4.getOneGame(0); // Получаем тестовую игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.nullAddress, [0, 0, 0, 0, 0, 0, 0, 0, 0], BigNumber.from(0), this.timeWait[0], 3);

                await expect(this.token4.connect(this.alice).pauseGame(0)) // Возобновляем поиск игроков
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 3, this.alice.address, this.nullAddress,  0) // Аргументы события
                this.result = await this.token4.getOneGame(0); // Получаем тестовую игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.nullAddress, [0, 0, 0, 0, 0, 0, 0, 0, 0], BigNumber.from(0), this.timeWait[0], 0);
            })

            // Проверка сработки require
            it("2.2.2. Check require", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await expect(this.token4.connect(this.tema).pauseGame(0)).to.be.reverted  // (Поставить поиск игроков на паузу может только её создатель)
                await this.token4.connect(this.tema).joinGame(0); // К тестовой игре присоединился игрок
                await expect(this.token4.connect(this.alica).pauseGame(0)).to.be.reverted  // (Поставить поиск игроков на паузу можно только во время ожидания присоединения игрока)
            })
        })

        // Тестирования функции присоединения к игре
        describe("2.3 JoinGame", function () {
            // Проверка присоединения к одной игре
            it("2.3.1. Join one game", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт

                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.tema).joinGame(0)) // Присоединение к игре
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 2, this.alice.address, this.tema.address,  this.timeWait[0]) // Аргументы события
                this.result = await this.token4.getOneGame(0); // Получаем тестовую игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.tema.address, [0, 0, 0, 0, 0, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);
            })

            // Проверка присоединения к нескольким играм
            it("2.3.2. Join multiple games", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 2*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание первой тестовой игры
                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.tema).joinGame(0)) // Присоединение к первой тестовой игре
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 2, this.alice.address, this.tema.address,  this.timeWait[0]) // Аргументы события
                this.result = await this.token4.getOneGame(0); // Получаем первую тестовую игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.tema.address, [0, 0, 0, 0, 0, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);

                await this.token4.connect(this.alice).createGame(this.timeWait[1], this.bid); // Создание второй тестовой игры
                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.misha).joinGame(1)) // Присоединение к второй тестовой игре
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(1, 2, this.alice.address, this.misha.address,  this.timeWait[1]) // Аргументы события
                this.result = await this.token4.getOneGame(1); // Получаем вторую тестовую игру и проверяем её параметры
                compareGame(this.result, this.alice.address, this.misha.address, [0, 0, 0, 0, 0, 0, 0, 0, 0], this.nowTime, this.timeWait[1], 2);
            })

            // Проверка сработки require #1
            it("2.3.3. Check require #1", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await expect(this.token4.connect(this.alice).joinGame(0)).to.be.reverted  // (Создатель игры не может подключиться к этой же игре вторым игроком)
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к тестовой игре
                await expect(this.token4.connect(this.misha).joinGame(0)).to.be.reverted  // (Нельзя присоединиться к игре, где уже есть оба игрока)
                await expect(this.token4.connect(this.misha).joinGame(10)).to.be.reverted  // (Нельзя присоединиться к несущетсвующей игре)
            })

            // Проверка сработки require #2
            it("2.3.4. Check require #2", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).pauseGame(0); // Ставим поиск игроков на паузу
                await expect(this.token4.connect(this.misha).joinGame(0)).to.be.reverted  // Т.к. поиск игроков на паузе, то к ней нельзя присоединиться
                await this.token4.connect(this.alice).pauseGame(0); // Возобновляем поиск игроков 
                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.misha).joinGame(0)) // Присоединение к тестовой игре
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 2, this.alice.address, this.misha.address,  this.timeWait[0]) // Аргументы события
                this.result = await this.token4.getOneGame(0); // Проверяем, что присоединение к игре прошло успешно
                compareGame(this.result, this.alice.address, this.misha.address, [0, 0, 0, 0, 0, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);
            })
        })

        // Тестирования функций "ход игрока" и "проверка окончания игры"
        describe("2.4 MoveGame and IsFinish", function () {
            // Проверка хода первого и второго игрока
            it("2.4.1. Turns player1 and player2", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к игре

                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.alice).movePlayer(0, this.moves1[0])) // Ход первого игрока
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 1, this.alice.address, this.tema.address,  this.moves1[0]); // Аргументы события
                this.result = await this.token4.getOneGame(0); // Проверяем ход игры
                compareGame(this.result, this.alice.address, this.tema.address, [0, 0, 0, 0, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.tema).movePlayer(0, this.moves1[1])) // Ход второго игрока
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 2, this.alice.address, this.tema.address,  this.moves1[1]); // Аргументы события
                this.result = await this.token4.getOneGame(0); // Проверяем ход игры
                compareGame(this.result, this.alice.address, this.tema.address, [2, 0, 0, 0, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.alice).movePlayer(0, this.moves1[2])) // Ход первого игрока
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 1, this.alice.address, this.tema.address,  this.moves1[2]); // Аргументы события
                this.result = await this.token4.getOneGame(0); // Проверяем ход игры
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await expect(this.token4.connect(this.tema).movePlayer(0, this.moves1[3])) // Ход второго игрока
                    .to.emit(this.token4, 'EventGame') // Тестирование события 
                    .withArgs(0, 2, this.alice.address, this.tema.address,  this.moves1[3]); // Аргументы события
                this.result = await this.token4.getOneGame(0); // Проверяем ход игры
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 2, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);
            })

            // Победа первого игрока
            it("2.4.2. Player1 victory", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к игре

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves1[0]);
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [0, 0, 0, 0, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves1[1]);
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 0, 0, 0, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves1[2])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves1[3])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 2, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves1[4])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 2, 1, 0, 0, 1, 0], this.nowTime, this.timeWait[0], 5);

                await expect(this.token4.connect(this.tema).movePlayer(0, 2)).to.be.reverted  // Первый игрок выиграл, больше нельзя сделать ход
                //await this.token4.isFinish(0); // Проверка комбинации
                this.result = await this.token4.getOneGame(0); // Получение игры и проверка её параметров
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 2, 1, 0, 0, 1, 0], this.nowTime, this.timeWait[0], 5);
            })

            // Победа второго игрока
            it("2.4.3. Player2 victory", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к игре

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves2[0])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [0, 1, 0, 0, 0, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves2[1])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 0, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves2[2])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 0, 1, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves2[3])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 2, 1, 0, 0, 0], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves2[4])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 2, 1, 1, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves2[5])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 2, 1, 1, 0, 2], this.nowTime, this.timeWait[0], 6);

                await expect(this.token4.connect(this.alice).movePlayer(0, 2)).to.be.reverted  // Второй игрок выиграл, больше нельзя сделать ход
                //await this.token4.isFinish(0); // Проверка комбинации
                this.result = await this.token4.getOneGame(0); // Получение игры и проверка её параметров
                compareGame(this.result, this.alice.address, this.tema.address, [2, 1, 0, 0, 2, 1, 1, 0, 2], this.nowTime, this.timeWait[0], 6);
            })

            // Ничья
            it("2.4.4. Draw", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к игре

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves3[0])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [0, 0, 0, 0, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves3[1])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [0, 0, 0, 2, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves3[2])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 0, 0, 2, 1, 0, 0, 0, 0], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves3[3])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 0, 0, 2, 1, 0, 0, 0, 2], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves3[4])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 0, 1, 2, 1, 0, 0, 0, 2], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves3[5])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 0, 1, 2, 1, 0, 2, 0, 2], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves3[6])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 0, 1, 2, 1, 0, 2, 1, 2], this.nowTime, this.timeWait[0], 1);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.tema).movePlayer(0, this.moves3[7])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 2, 1, 2, 1, 0, 2, 1, 2], this.nowTime, this.timeWait[0], 2);

                this.nowTime = await latest(); // Фиксируем время 
                await this.token4.connect(this.alice).movePlayer(0, this.moves3[8])
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 2, 1, 2, 1, 1, 2, 1, 2], this.nowTime, this.timeWait[0], 4);

                await expect(this.token4.connect(this.tema).movePlayer(0, 2)).to.be.reverted  // Т.к. ничья, то больше нельзя сделать ход
                //await this.token4.isFinish(0); // Проверка комбинации
                this.result = await this.token4.getOneGame(0);
                compareGame(this.result, this.alice.address, this.tema.address, [1, 2, 1, 2, 1, 1, 2, 1, 2], this.nowTime, this.timeWait[0], 4);
            })

            // Проверка всех выигрышных комбинаций
            it("2.4.5. Check all winner combinations", async function () {
                for (let j = 0; j < 8; j++) { // Всего существует 8 комбинаций
                    await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                    await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                    await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                    await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                    
                    await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                    await this.token4.connect(this.tema).joinGame(j); // Присоединение к игре

                    // Делаем ходы. Последний ход выигрышный
                    for (let i = 0; i < 6; i = i + 2) {
                        await this.token4.connect(this.alice).movePlayer(j, this.combinations[j][i])
                        await this.token4.connect(this.tema).movePlayer(j, this.combinations[j][i + 1])
                    }
                    await expect(this.token4.connect(this.alice).movePlayer(j, this.combinations[j][6])).to.be.reverted  // Т.к. второй игрок выиграл, то больше нельзя ходить
                    //await this.token4.isFinish(j); // Проверяем комбинацию и параметры игры
                    this.result = await this.token4.getOneGame(j);
                    expect(this.result.state).to.eq(6);
                }
            })

            // Проверка времени ожидания
            it("2.4.6. Check time wait", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к игре

                await this.token4.connect(this.alice).movePlayer(0, 4); // Делаем ходы
                await this.token4.connect(this.tema).movePlayer(0, 5)

                await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед
                await expect(this.token4.connect(this.alice).movePlayer(0, 2)).to.be.reverted; // Т.к. время вышло, то нельзя сделать ход
                await this.token4.isFinish(0); // Проверяем ход игры
                this.result = await this.token4.getOneGame(0); //Проверяем параметры игры
                expect(this.result.state).to.eq(6); // Второй игрок выиграл
            })

            // Проверка  сработки require для movePLayer
            it("2.4.7. Check require (MovePlayer)", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к игре
                await expect(this.token4.connect(this.alice).movePlayer(0, 9)).to.be.reverted  // Нельзя сделать ход на несуществующую клетку (0..8)
                await expect(this.token4.connect(this.alice).movePlayer(1, 0)).to.be.reverted // Нельзя сделать ход в несуществующей игре
                await expect(this.token4.connect(this.tema).movePlayer(0, 0)).to.be.reverted // Нельзя ходить, если не твоя очередь
                await this.token4.connect(this.alice).movePlayer(0, 4) //Первый игрок сделал ход
                await expect(this.token4.connect(this.alice).movePlayer(0, 2)).to.be.reverted // Нельзя ходить, если не твоя очередь
                await expect(this.token4.connect(this.tema).movePlayer(0, 4)).to.be.reverted // Нельзя ходить к клетку, которая уже занята
                await expect(this.token4.connect(this.bob).movePlayer(0, 2)).to.be.reverted // Нельзя ходить, если ты не участвуешь в игре
            })

            it("2.4.8. Check require (isFinish)", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, this.bid); // Тема разрешает отправку ERC на контракт
                
                await expect(this.token4.isFinish(0)).to.be.reverted; // Нельзя проверить игру, которой нет
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await expect(this.token4.isFinish(0)).to.be.reverted; // Нельзя проверить игру, которая ещё не началась
                await this.token4.connect(this.tema).joinGame(0); // Присоединение к игре
                //await expect(this.token4.isFinish(0)).to.be.reverted; // Нельзя проверить игру, которая ещё идет
                await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед
                await this.token4.isFinish(0); // Проверяем ход игры
                await expect(this.token4.isFinish(0)).to.be.reverted; // Нельзя проверить игру, уже был определен победить 
            })
        })  
    })

    // Тестирования функции получения игр и получения статистики
    describe("3. Getter", function () {
        // Функция поиска игры
        describe("3.1 findOneGame", function () {
            it(" 3.1.1  Find games", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 2*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, 2*this.bid); // Тема разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт

                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.misha).createGame(this.timeWait[1], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).createGame(this.timeWait[2], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[3], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).createGame(this.timeWait[4], this.bid); // Создание тестовой игры
                this.answer = await this.token4.connect(this.bob).findOneGame(0, 0, 1000, 0, 1000);  // Поиск игры, начиная с индекса 0
                expect(this.answer).to.eq(0);
                this.answer = await this.token4.connect(this.bob).findOneGame(2, 0, 1000, 0, 1000); // Поиск игры, начиная с индекса 2
                expect(this.answer).to.eq(2);
                this.answer = await this.token4.connect(this.bob).findOneGame(0, 450, 1000, 0, 1000); // Поиск игры, начиная с индекса 0 (Но с ограничением по времени)
                expect(this.answer).to.eq(3);
            })

            it(" 3.1.2 Check require", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 2*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, 2*this.bid); // Тема разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт


                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.misha).createGame(this.timeWait[1], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).createGame(this.timeWait[2], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[3], this.bid); // Создание тестовой игры
                await this.token4.connect(this.tema).createGame(this.timeWait[4], this.bid); // Создание тестовой игры
                await expect(this.token4.connect(this.bob).findOneGame(5, 0, 1000, 0, 1000)).to.be.reverted; //Индекс начала поиска больше чем количество доступных игр
                await expect(this.token4.connect(this.bob).findOneGame(0, 100, 50, 0, 1000)).to.be.reverted; // Минимальное время больше максимального времени
                await expect(this.token4.connect(this.bob).findOneGame(0, 0, 50, 0, 1000)).to.be.reverted;  // Не нашлось подходящих игр
            })
        })

        // Проверка функции вывода всех игра для игрока
        describe("3.2 findGamesPlayer", function () {
            it(" 3.2.1 Find all games by player", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 3*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт
                await this.token4.connect(this.bob).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Боб закидывает на свой счет 100 токенов
                await this.token1.connect(this.bob).approve(this.token4.address, 2*this.bid); // Боб разрешает отправку ERC на контракт


                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.misha).createGame(this.timeWait[1], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[2], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[3], this.bid); // Создание тестовой игры

                this.answer = await this.token4.getGamesByPlayer(this.alice.address); // Получение игр для игрока 
                expect(this.answer.length).to.eq(3);
                expect(this.answer[0]).to.eq(0);
                expect(this.answer[1]).to.eq(2);
                expect(this.answer[2]).to.eq(3);

                await this.token4.connect(this.bob).joinGame(1); // Присоединение к игре
                await this.token4.connect(this.bob).joinGame(3); // Присоединение к игре

                this.answer = await this.token4.getGamesByPlayer(this.bob.address); // Получение игр для игрока 
                expect(this.answer.length).to.eq(2);
                expect(this.answer[0]).to.eq(1);
                expect(this.answer[1]).to.eq(3);
            })

            it(" 3.2.2 Check require", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 3*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт


                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.misha).createGame(this.timeWait[1], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[2], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[3], this.bid); // Создание тестовой игры
                await expect(this.token4.getGamesByPlayer(this.bob.address)).to.be.reverted; // У игрока нет игр
            })
        })

        // Проверка получения статистики
        describe("3.3 Statistics", function () {
            it(" 3.3.1 Get statistics for player and  for games", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 10*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, 4*this.bid); // Миша разрешает отправку ERC на контракт
                await this.token4.connect(this.bob).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Боб закидывает на свой счет 100 токенов
                await this.token1.connect(this.bob).approve(this.token4.address, 4*this.bid); // Боб разрешает отправку ERC на контракт
                await this.token4.connect(this.tema).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Тема закидывает на свой счет 100 токенов
                await this.token1.connect(this.tema).approve(this.token4.address, 8*this.bid); // Тема разрешает отправку ERC на контракт


                // Создаем  15 игр
                for (let i = 0; i < 3; i++) {
                    await this.token4.connect(this.tema).createGame(this.timeWait[0], this.bid);
                    await this.token4.connect(this.misha).createGame(this.timeWait[0], this.bid);
                    await this.token4.connect(this.bob).createGame(this.timeWait[0], this.bid);
                    await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid);
                    await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid);
                }

                await this.token4.connect(this.alice).joinGame(0); // Присоединение к игре
                await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед
                await this.token4.isFinish(0); //заканчиваем игру (по таймауту) и определяем победителя

                await this.token4.connect(this.alice).joinGame(1); // Присоединение к игре
                await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед
                await this.token4.isFinish(1); //заканчиваем игру (по таймауту) и определяем победителя

                await this.token4.connect(this.alice).joinGame(2); // Присоединение к игре
                await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед
                await this.token4.isFinish(2); //заканчиваем игру (по таймауту) и определяем победителя

                await this.token4.connect(this.bob).joinGame(3); // Присоединение к игре
                await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед
                await this.token4.isFinish(3); //заканчиваем игру (по таймауту) и определяем победителя

                await this.token4.connect(this.misha).joinGame(4); // Присоединение к игре
                await increase(duration.seconds(this.timeWait[0] + 10)); // Проматываем время вперед
                await this.token4.isFinish(4); //заканчиваем игру (по таймауту) и определяем победителя

                await this.token4.connect(this.alice).joinGame(5); // Присоединение к игре
                //сводим игру в ничью
                await this.token4.connect(this.tema).movePlayer(5, this.moves3[0])
                await this.token4.connect(this.alice).movePlayer(5, this.moves3[1])
                await this.token4.connect(this.tema).movePlayer(5, this.moves3[2])
                await this.token4.connect(this.alice).movePlayer(5, this.moves3[3])
                await this.token4.connect(this.tema).movePlayer(5, this.moves3[4])
                await this.token4.connect(this.alice).movePlayer(5, this.moves3[5])
                await this.token4.connect(this.tema).movePlayer(5, this.moves3[6])
                await this.token4.connect(this.alice).movePlayer(5, this.moves3[7])
                await this.token4.connect(this.tema).movePlayer(5, this.moves3[8])
                //await this.token4.isFinish(5); //заканчиваем игру 

                //Создаем дополнительно 5 игр
                for (let i = 0; i < 5; i++) {
                    await this.token4.connect(this.tema).createGame(this.timeWait[0], this.bid);
                }

                this.answer = await this.token4.statisticsPlayer(this.alice.address); // Получаем статистику по игроку
                //Проверяем полученные значения
                expect(this.answer.length).to.eq(5);
                expect(this.answer[0]).to.eq(10);
                expect(this.answer[1]).to.eq(30);
                expect(this.answer[2]).to.eq(20);
                expect(this.answer[3]).to.eq(10);
                expect(this.answer[4]).to.eq(40);

                this.answer = await this.token4.statisticsGames(); // Получаем статистику по всем играм
                //Проверяем полученные значения
                expect(this.answer.length).to.eq(5);
                expect(this.answer[0]).to.eq(20);
                expect(this.answer[1]).to.eq(0);
                expect(this.answer[2]).to.eq(25);
                expect(this.answer[3]).to.eq(5);
                expect(this.answer[4]).to.eq(70);
            })

            it(" 3.3.2 Check require", async function () {
                await this.token4.connect(this.alice).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Алиса закидывает на свой счет 100 токенов
                await this.token1.connect(this.alice).approve(this.token4.address, 3*this.bid); // Алиса разрешает отправку ERC на контракт
                await this.token4.connect(this.misha).incGameAcc({ value: ethers.utils.parseUnits(this.amount1.toString(), "finney") });  // Миша закидывает на свой счет 100 токенов
                await this.token1.connect(this.misha).approve(this.token4.address, this.bid); // Миша разрешает отправку ERC на контракт


                await expect(this.token4.statisticsGames()).to.be.reverted; // Нельзя получить статистику по играм, если их ещё нет
                await this.token4.connect(this.alice).createGame(this.timeWait[0], this.bid); // Создание тестовой игры
                await this.token4.connect(this.misha).createGame(this.timeWait[1], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[2], this.bid); // Создание тестовой игры
                await this.token4.connect(this.alice).createGame(this.timeWait[3], this.bid); // Создание тестовой игры
                await expect(this.token4.statisticsPlayer(this.bob.address)).to.be.reverted; // нельзя получить статистику по игроку, который никогда не играл
            })
        })
    }) 
})