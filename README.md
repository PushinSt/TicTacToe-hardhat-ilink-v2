## ilink Academy. Домашняя работа #3. 

### Задача:  
Работа со смарт-контрактами ERC-20. Особенности проверки на сторонних контрактах. Мультиподпись.  
Новый функционал игры крестики-нолики.  
1. Добавить возможность делать ставки в нативном токене eth и ERC-20.  
При создании игры указываем размер ставки. Средства игрока должны холдировать. Второму игроку, который присоединяется к игре, также холдировать средства. 
2. После завершения игры, победитель получает все средства.  
3. Добавить комиссию платформы, процент или сумма. Задается настройками в смарт-контракте.  
4. Комиссия начисляется на смарт-контракт Wallet. С Wallet можно вывести с согласия двух адресов.  

### Реализация
Hardhat 2.9.1;  
Solidity 0.8.9;

### Решение  
Решение состоит из:  
- Смарт контракт "Крестики нолики"  
- Смарт контракт "Кошелек"  
- Смарт контракт "ERC20Mock"  
#### Контракт "Крестики нолики":  
Смарт контракт состоит из: 
1. Структура Game, которая описывает партию игры
- address player1 - Адрес первого игрока;  
- address player2 - Адрес второго игрока (Либо nulll address);  
- uint8[9] grid - Игровое поле 3*3. Счет идет с верхнего левого угла, по строкам;  
- uint256 timeStart - Момент времени, когда был совершен крайних ход (в секундах, начиная с 1 января 1970 года (эпоха unix));  
- uint32 timeWait - Время ожидания хода соперника, в секундах;  
- uint32 bet - Ставка игроков
- State state - Текущий статус игры.

2. Перечисление State, которая описает все стадии игры:  
- FindPlayers - Стадия поиска (ожидание присоединения) второго игрока;  
- EndFirst - Первый игрок сделал свой ход;  
- EndSecond - Второй игрок сделал свой ход;  
- Pause - Первый игрок не дождался подключения второго игрока и поставил поиск на паузу;  
- Draw - Игра завершилась ничьей;  
- WinFirst - Игра завершилась победой первого игрока;  
- WinSecond - Игра завершилась победой второго игрока.  

3. Массив Game[] games, который хранит все игры.  
4. Массив  uint8[3][8] winCombinations, который хранит все возможные победные комбинации.  
5. Соответствие mapping (address => uint256) public playerGamesCount; // соответствие (адрес игрока => количество игр) 
6. Переменные:
- address owner - Адрес владельца контракта
- address wallet - Адрес контракта "Кошелек"
- IERC20 token - Игровая валюта
- uint8 commission - Комиссия за участие в игре (по умолчанию равна 10%).
- uint256 ethPerErc - Стоимость одной игровой валюты (по умолчанию равно 1 finney)

Реализованные методы (Только новые или обновленные, описание остального функционала можно найти в предыдущем ДЗ):
1. Пополнить свой игровой счёт:  
`function incGameAcc() external payable`
Игрок отправляет эфир на эту функцию с помощью параметра msg.value. Эфир пересчитывается по курсу ethPerErc и токены начисляются на игровой счёт  

2. Снять средства со своего игрового счёта:  
`function withdrawalGameAcc(uint256 _amountERC) external nonReentrant`  
_amountERC - Количество монет, которые хочешь вывести.
Прежде пользователь должен подтвердить эту операцию с помощью метода approve.  

3. Создать игру и сделать ставку:  
`function createGame(uint32 _timeWait, uint32 _bet) external payable`  
_timeWait - время ожидания хода соперника, _bet - ставка в ERC.  
Игрок может сделать ставку в токенак ERC или в ETH.  
Чтобы сделать ставку в ERC, необходимо: подтвердить эту операцию с помощью метода approve; указать сумму ставки в параметре _bet. Чтобы cделать ставку в ETH, необходимо: передать ETH в функцию с помощью параметра msg.value.  

4. Присоединиться к игре и сделать ставку:  
`function joinGame(uint256 _idGame) external outOfRange(_idGame)`  
_idGame - Идентификатор игры (её порядковый номер в массиве games).  
Игрок может сделать ставку в токенак ERC или в ETH.  
Чтобы cделать ставку в ERC, необходимо: подтвердить эту операцию с помощью метода approve. Чтобы cделать ставку в ETH, необходимо: передать ETH в функцию с помощью параметра msg.value.  

5. Сделать ход:  
`function movePlayer(uint256 _idGame, uint256 _cell) external outOfRange(_idGame)`  
_idGame - Идентификатор игры (её порядковый номер в массиве games), _cell - клетка на игровом поле (0..8).   
В случае, если ход игрока оказался победным (или игра свелась в ничью), то производится расчет с игроками и перевод комиссии на кошелек. Расчет с игроками производится в том виде, как они делали ставку (В виде ETH или ERC) 

6. Завершить игру (Проверить на признаки завершения):  
`function isFinish(uint256 _idGame) external outOfRange(_idGame) returns (uint256)`  
_idGame - Идентификатор игры (её порядковый номер в массиве games).  


#### Контракт "Кошелек":   
Смарт контракт состоит из:  
1. Структура Transaction, которая описывает одну транзакцию;  
- address to - Адрес получателя средств;  
- uint256 amount - Сумма перевода;  
- bool[3] arr - Список голосов доверенных лиц;  
- bool isSend - Флаг, показывающий отправлена транзакция или нет;  
2. Массив Transaction[] _transactions, который хранит все транзакции.  
3. Переменные:
- address _owner - Адрес владельца контракта  
- address _voting1 - Адрес доверенного лица №1  
- address _voting2 - Адрес доверенного лица №2  
- 
Реализованные методы:
1. Создать новую транзакцию:  
`function newTransaction(address _to, uint256 _amount) external isVoter`
_to - Адрес получателя, _amount - Сумма средств.  
Транзакцию  может создать только владелец или доверенное лицо. Учитывается доступная сумма средств на контракте в момент создания транзакции.

2. Подтвердить транзакцию:  
`function confTransaction(uint256 _idTransaction) external isVoter`
_idTransaction - id транзакции.  
Подтвердить транзакцию может только владелец или доверенное лицо. Причем пользователь не может подтвердить транзакцию, если она предназначена ему. После подтверждения транзакции, если голосов становится 2 или больше, то транзакция совершается.  


#### Задачи для cli hardhat (TicTacToe)
Смарт контракт размещался в тестовой сети Rospen. Предоставлены только новые или обновленный задачи (Описание остального функционала можно найти в предыдущем ДЗ). 
1. Создать игру и сделать ставку в ERC:  
`npx hardhat create-game-erc --network ropsten --address $address --player $player --time $time --bet $bet`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $time - время ожидания хода соперника, $bet - ставка в erc. 

2. Создать игруи сделать ставку в ETH:  
`npx hardhat create-game-eth --network ropsten --address $address --player $player --time $time --bet $bet`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $time - время ожидания хода соперника, $bet - ставка в eth. 

3. Присоединиться к игре и сделать ставку в ERC:  
`npx hardhat join-game-erc --network ropsten --address $address --player $player --id $id --bet $bet`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $id - идентификатор игры (её порядковый номер в массиве games), $bet - ставка в erc.  

4. Присоединиться к игре и сделать ставку в ETH:  
`npx hardhat join-game-eth --network ropsten --address $address --player $player --id $id --bet $bet`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $id - идентификатор игры (её порядковый номер в массиве games), $bet - ставка в eth.  

5. Сделать ход:  
`npx hardhat move-game --network ropsten --address $address --player $player --id $id --cell $cell`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $id - идентификатор игры (её порядковый номер в массиве games), $cell - клетка на игровом поле (0..8).  

6. Завершить игру (Проверить на признаки завершения):  
`npx hardhat isFinish --network ropsten --address $address --player $player --id $id`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $id - идентификатор игры (её порядковый номер в массиве games).  

7. Пополнить свой игрвой счёт:  
`npx hardhat balance-erc --network ropsten --address $address`
$address - адрес контракта.  

8. Снять средства со своего игрового счёта:  
`npx hardhat withdrawal-game-acc --network ropsten --address $address --player $player --amount $amount`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $amount - Количество монет, которые хочешь вывести.  

9. Установить адрес кошелька:  
`npx hardhat set-wallet --network ropsten --address $address --player $player --wallet $wallet`  
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $wallet - новый адрес кошелька.   

#### Задачи для cli hardhat (Wallet)
Смарт контракт размещался в тестовой сети Rospen.  
1. Новый адрес доверенного лица:  
`npx hardhat set-vater --network ropsten --address $address --player $player --vater $vater --id $id`
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $vater - адрес нового доверенного лица, $id - номер довереного лица (1 или 2). 

2. Создать транзакцию на вывод средств с кошелька:  
`npx hardhat new-transaction --network ropsten --address $address --player $player --to $to --amount $amount`
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $to - адрес получателя транзакции, $amount - сумма для вывода средств. 

3. Подтвердить транзакцию:  
`npx hardhat conf-transaction --network ropsten --address $address --player $player --id $id`
$address - адрес контракта, $player - порядковый номер счета из mnemonic, $id - идентификатор транзакции. 


#### Тестирование
Автоматизированные тесты (Игровая логика) описаны в файле tests\TicTacToe.test.ts и запускаются командой:  
`npx hardhat test tests\TicTacToe.test.ts`

Автоматизированные тесты (Бизнес логика) описаны в файле tests\TicTacToe_pay.test.ts и запускаются командой:  
`npx hardhat test tests\TicTacToe_pay.test.ts`

Автоматизированные тесты (Контракт кошелька) описаны в файле tests\Wallet.test.ts и запускаются командой:  
`npx hardhat test tests\Wallet.test.ts`

Анализ расхода газа можно включить с помощью ключа GAS_REPORT:
![Анализ расхода газа](gas-report.png)


#### Проверка и публикация исходного кода контракта
Команда для публикации контракта в тестовой сети ropsten:  
`npx hardhat deploy --network ropsten --tags TicTacToe`  
`npx hardhat deploy --network ropsten --tags Wallet`


Команда для верификации контракта в сети ropsten:  
`npx hardhat --network ropsten etherscan-verify --solc-input --contract-name TicTacToe`  
`npx hardhat --network ropsten etherscan-verify --solc-input --contract-name Wallet`
