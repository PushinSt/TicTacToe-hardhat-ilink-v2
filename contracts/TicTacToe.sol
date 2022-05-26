// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./ERC20Mock.sol";

/// @title Tic-Tac-Toe game with betting
/// @author Starostin Dmitry
/// @notice Creation of a game party. Join the game party. Making a move. Checking combinations. Waiting time for a move player. Betting
/// @dev Contract under testing
contract TicTacToe {
    address private owner; // owner address
    address private wallet; // wallet address
    IERC20 public token; // player money
    uint8 private commission = 10; // commision (percent of winning)
    uint256 private ethPerErc = 10**15; // price of one ERC (in eth)
    uint256 private heldERC = 0; // holding ERC
    uint256 private heldETH = 0; // holding ETH

    // for prevent reentrant calls to a function
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    enum State {
        FindPlayers, // Searching players
        EndFirst, // Move of the first player
        EndSecond, // Move of the second player
        Pause, // Pause searching for players
        Draw, // Draw
        WinFirst, // Win of the first player
        WinSecond // Win of the second player
    }

    struct Game {
        address player1; // master
        address player2; // slave
        uint8[9] grid; // Playing field
        uint256 timeStart; // Ending time of the move
        uint32 timeWait; // Waiting time of the move
        uint32 betERC; // Bet in the game (in ERC)
        uint256 betETH; // Bet in the game (in ETH)
        State state; // Game status
    }

    Game[] public games; // Games list
    uint8[3][8] private winCombinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [6, 4, 2]]; // All of the winning combinations
    mapping(address => uint256) playerGamesCount; // (player address => number of game)

    event EventGame(uint256 indexed _IdGame, State indexed _stateGame, address player1, address player2, uint256 value);
    event IncGameAcc(address indexed player, uint256 indexed amountERC);
    event SetWallet(address indexed newWalet);
    event SetCommission(uint256 indexed newCommission);
    event WithdrawalGameAcc(address indexed player, uint256 indexed amountERC);
    event PlaceBet(address indexed player, uint256 indexed bet);
    event ReturnWinERC(address indexed player, uint256 indexed amount);
    event TakeCommission(uint256 indexed amount);

    // Existence of the game
    modifier outOfRange(uint256 _idGame) {
        require(_idGame >= 0 && games.length > _idGame, "This game is not exist");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner.");
        _;
    }

    // prevent reentrant calls to a function
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _ERC20Address) {
        token = IERC20(_ERC20Address);
        owner = msg.sender;
        _status = _NOT_ENTERED;
    }

    /// @notice Player is credit ETH to account
    function incGameAcc() external payable {
        require(msg.value > 0, "Need to ETH > 0");
        uint256 amountERC = msg.value / ethPerErc; // Total ERC
        require(amountERC > 0, "Need to send more ETH");
        uint256 AvailableERC = token.balanceOf(address(this)); // Number of available contract's ERC
        require(AvailableERC - heldERC >= amountERC, "Not enough ERC on contract");
        bool sent = token.transfer(msg.sender, amountERC); // ERC transaction from contract to player's account
        require(sent, "4"); // ERC transaction is not successful
        emit IncGameAcc(msg.sender, amountERC);
    }

    /// @notice Change address of wallet
    /// @param _wallet New wallet's address
    function setWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Address of new wallet is not correct");
        wallet = _wallet;
        emit SetWallet(_wallet);
    }

    /// @notice Change commision
    /// @param _commision New commision
    function setCommission(uint8 _commision) external onlyOwner {
        require(_commision >= 0 && _commision <= 100, "Commision is not correct");
        commission = _commision;
        emit SetCommission(_commision);
    }

    /// @notice Player withdraws ERC from account
    /// @param _amountERC Number of ERC
    function withdrawalGameAcc(uint256 _amountERC) external nonReentrant {
        //token.approve(address(this), _amountERC);
        require(_amountERC > 0, "Need to ERC > 0");
        uint256 playerBalanceERC = token.balanceOf(msg.sender); // Number of available player's ERC
        require(playerBalanceERC >= _amountERC, "Your ERC balance is less then you can sell");
        uint256 amountETH = _amountERC * ethPerErc; // Total ETH
        uint256 AvailableETH = address(this).balance; // Number of available contract's ETH
        require(AvailableETH >= amountETH, "Not enough ETH on contract #1");

        bool sent = token.transferFrom(msg.sender, address(this), _amountERC); // ERC transaction from player's account to contract
        require(sent, "ERC transaction is not successful");
        (sent, ) = msg.sender.call{value: amountETH}(""); // ETH transaction from contract to player's account
        require(sent, "ETH transaction is not successful");
        emit WithdrawalGameAcc(msg.sender, _amountERC);
    }

    /// @notice Player creates a game and does the bet
    /// @param _timeWait Waiting time of the opponent's move
    /// @param _bet Bet
    function createGame(uint32 _timeWait, uint32 _bet) external payable {
        require(_bet > 0 || msg.value > 0, "Bet must be more than zero!");
        require(_bet <= 1000, "Bet must be less than 1000!");
        require(_timeWait > 0, "TimeWait must be more 0");
        games.push(Game({player1: msg.sender, player2: address(0), grid: [0, 0, 0, 0, 0, 0, 0, 0, 0], timeStart: 0, timeWait: _timeWait, betERC: 0, betETH: 0, state: State.FindPlayers})); // Add a new game to the list
        playerGamesCount[msg.sender]++; // Increasing number of games for player

        emit EventGame(games.length - 1, State.FindPlayers, msg.sender, address(0), _timeWait);

        if (msg.value == 0) {
            games[games.length - 1].betERC = _bet;
            placeBet(msg.sender, _bet); // Player does the bet
        } else {
            heldETH = heldETH + msg.value; // Holding player's ETH
            games[games.length - 1].betETH = msg.value;
            emit PlaceBet(msg.sender, msg.value);
        }
    }

    /// @notice Pause/Continue searching of player for the game
    /// @param _idGame Id game
    function pauseGame(uint256 _idGame) external outOfRange(_idGame) {
        require(games[_idGame].state == State.FindPlayers || games[_idGame].state == State.Pause, "This game has already started");
        require(games[_idGame].player1 == msg.sender, "Only for creator of the game");
        require(games[_idGame].player2 == address(0));
        if (games[_idGame].state == State.FindPlayers) {
            games[_idGame].state = State.Pause; // Pause of searching
            emit EventGame(_idGame, State.Pause, msg.sender, address(0), 1);
        } else if (games[_idGame].state == State.Pause) {
            games[_idGame].state = State.FindPlayers; // Continue of searching
            emit EventGame(_idGame, State.Pause, msg.sender, address(0), 0);
        }
    }

    /// @notice  Player joins the new game and does the bet
    /// @param _idGame Id game
    function joinGame(uint256 _idGame) external payable outOfRange(_idGame) {
        require(games[_idGame].state == State.FindPlayers, "This game is not available to join");
        require(games[_idGame].player1 != msg.sender, "You are the player1");
        require(games[_idGame].player2 == address(0), "The second player has been already exist");
        games[_idGame].player2 = msg.sender;
        games[_idGame].timeStart = block.timestamp; // Saving time of ending the move
        games[_idGame].state = State.EndSecond; // Move of the second player
        playerGamesCount[msg.sender]++; // Increasing number of games of the player
        emit EventGame(_idGame, State.EndSecond, games[_idGame].player1, msg.sender, games[_idGame].timeWait);

        if (msg.value == 0) {
            placeBet(msg.sender, games[_idGame].betERC); // Player does the bet
        } else {
            require(msg.value == games[_idGame].betETH, "Bet must be the identical");
            heldETH = heldETH + msg.value; // Holding player's ETH
        }
    }

    /// @notice Player's move
    /// @param _idGame Id game
    /// @param _cell Cell of the playing field
    function movePlayer(uint256 _idGame, uint256 _cell) external outOfRange(_idGame) {
        require(_cell >= 0 && _cell <= 8, "This grid 3x3. Cell from 0 to 8");
        require((games[_idGame].player1 == msg.sender && games[_idGame].state == State.EndSecond) || (games[_idGame].player2 == msg.sender && games[_idGame].state == State.EndFirst), "It's not your turn to move!");
        require(games[_idGame].grid[_cell] == 0, "Cell is not free!");
        require(checkingCombinations(games[_idGame].grid), "Game over. Winning combination is completed");
        require(checkingDraw(games[_idGame].grid), "Game over. Draw combination is completed");
        require(checkingTimeOut(games[_idGame].timeStart + games[_idGame].timeWait), "Game over. Your time to move is over");

        // Move of the firt or the second player
        if (games[_idGame].state == State.EndSecond) {
            games[_idGame].grid[_cell] = 1;
            games[_idGame].state = State.EndFirst;
            games[_idGame].timeStart = block.timestamp;
        } else if (games[_idGame].state == State.EndFirst) {
            games[_idGame].grid[_cell] = 2;
            games[_idGame].state = State.EndSecond;
            games[_idGame].timeStart = block.timestamp;
        }
        emit EventGame(_idGame, games[_idGame].state, games[_idGame].player1, games[_idGame].player2, _cell);
        this.isFinish(_idGame);
    }

    /// @notice Checking status of the game. Paying for winning. Sending commission on wallet.
    /// @param _idGame Id game
    function isFinish(uint256 _idGame) external outOfRange(_idGame) {
        require(games[_idGame].state == State.EndFirst || games[_idGame].state == State.EndSecond, "Game is not active");
        if (checkingCombinations(games[_idGame].grid) == false) {
            // There is the winning combination on the field
            games[_idGame].state = nominationWinner(games[_idGame].state); // Who has won the game
            emit EventGame(_idGame, games[_idGame].state, games[_idGame].player1, games[_idGame].player2, 0);

            if (games[_idGame].betERC != 0) {
                returnWinERC(pickWinner(games[_idGame]), 2 * games[_idGame].betERC);
            } else {
                returnWinETH(pickWinner(games[_idGame]), 2 * games[_idGame].betETH);
            }
            return;
        }

        if (checkingDraw(games[_idGame].grid) == false) {
            // There is the draw combination on the field
            games[_idGame].state = State.Draw;
            emit EventGame(_idGame, games[_idGame].state, games[_idGame].player1, games[_idGame].player2, 1);

            if (games[_idGame].betERC != 0) {
                returnWinERC(games[_idGame].player1, games[_idGame].betERC);
                returnWinERC(games[_idGame].player2, games[_idGame].betERC);
            } else {
                returnWinETH(games[_idGame].player1, games[_idGame].betETH);
                returnWinETH(games[_idGame].player2, games[_idGame].betETH);
            }
            return;
        }

        if (checkingTimeOut(games[_idGame].timeStart + games[_idGame].timeWait) == false) {
            // Waiting time of the opponent's move is over
            games[_idGame].state = nominationWinner(games[_idGame].state); // Who has won the game
            emit EventGame(_idGame, games[_idGame].state, games[_idGame].player1, games[_idGame].player2, 2);

            if (games[_idGame].betERC != 0) {
                returnWinERC(pickWinner(games[_idGame]), 2 * games[_idGame].betERC);
            } else {
                returnWinETH(pickWinner(games[_idGame]), 2 * games[_idGame].betETH);
            }
            return;
        }
        return;
    }

    /// @notice Get the wallet address
    /// @return address Wallet address
    function getWallet() external view onlyOwner returns (address) {
        return wallet;
    }

    /// @notice Get commission
    /// @return uint256 Commission
    function getCommission() external view onlyOwner returns (uint256) {
        return commission;
    }

    /// @notice Get number of the holding ERC
    /// @return uint256 Holding ERC
    function getHeldERC() external view onlyOwner returns (uint256) {
        return heldERC;
    }

    /// @notice Get number of the holding ETH
    /// @return uint256 Holding ETH
    function getHeldETH() external view onlyOwner returns (uint256) {
        return heldETH;
    }

    /// @notice Get player's balance in ERC
    /// @param _player Player's address
    /// @return uint256 Balance in ERC
    function balancePlayer(address _player) external view returns (uint256) {
        uint256 balance = token.balanceOf(_player);
        return balance;
    }

    /// @notice Searching a new game
    /// @param _indexBegin Id game to begin the search
    /// @param _timeMin Minimum of waiting time of the move
    /// @param _timeMax Maximum of waiting time of the move
    /// @param _betMin Minimum bet
    /// @param _betMax Maximum bet
    /// @return index Id of finding
    function findOneGame(
        uint256 _indexBegin,
        uint256 _timeMin,
        uint256 _timeMax,
        uint256 _betMin,
        uint256 _betMax
    ) external view returns (uint256) {
        require(_indexBegin >= 0 && _indexBegin < games.length && _timeMin >= 0 && _timeMax >= _timeMin && _betMin >= 0 && _timeMax >= _betMin, "The input parameters are not correct");
        for (uint256 i = _indexBegin; i < games.length; i++) {
            if (games[i].player1 != msg.sender && games[i].state == State.FindPlayers && games[i].timeWait >= _timeMin && games[i].timeWait <= _timeMax && games[i].betERC >= _betMin && games[i].betERC <= _betMax) return i;
        }
        require(false, "There are no games with such parameters.");
        return 0;
    }

    /// @notice Getting information of the game
    /// @param _idGame Game Id
    /// @return Game Full information of the game
    function getOneGame(uint256 _idGame) external view outOfRange(_idGame) returns (Game memory) {
        return games[_idGame];
    }

    /// @notice Geting all the games of the player
    /// @param _player The address of the player
    /// @return GamesId Ids of games of the player
    function getGamesByPlayer(address _player) external view returns (uint256[] memory) {
        require(playerGamesCount[_player] > 0, "Player hasn't any games");
        uint256[] memory arrayId = new uint256[](playerGamesCount[_player]);
        uint256 index = 0;
        for (uint256 i = 0; i < games.length; i++) {
            if (games[i].player1 == _player || games[i].player2 == _player) {
                arrayId[index] = i;
                index++;
            }
        }
        return arrayId;
    }

    /// @notice Getting statistics of the player
    /// @param _player The address player
    /// @return StatisticPlayer [number of games, % of winning games, % of losing games , % of drawing games, % of active games]
    function statisticsPlayer(address _player) external view returns (uint256[] memory) {
        require(playerGamesCount[_player] > 0, "Player hasn't any games");
        uint256[] memory statistics = new uint256[](5); // [number of games, % of winning games, % of losing games , % of drawing games, % of active games]
        statistics[0] = playerGamesCount[_player];

        for (uint256 i = 0; i < games.length; i++) {
            if (games[i].player1 == _player) {
                if (games[i].state == State.WinFirst) {
                    statistics[1]++;
                } else if (games[i].state == State.WinSecond) {
                    statistics[2]++;
                } else if (games[i].state == State.Draw) {
                    statistics[3]++;
                } else {
                    statistics[4]++;
                }
            } else if (games[i].player2 == _player) {
                if (games[i].state == State.WinFirst) {
                    statistics[2]++;
                } else if (games[i].state == State.WinSecond) {
                    statistics[1]++;
                } else if (games[i].state == State.Draw) {
                    statistics[3]++;
                } else {
                    statistics[4]++;
                }
            }
        }
        for (uint256 i = 1; i < statistics.length; i++) statistics[i] = (statistics[i] * 100) / statistics[0]; // Calculation of percent
        return statistics;
    }

    /// @notice Getting statistics of all games
    /// @return StatisticGames [number of games, % of winning the first player, % of winning the second player, % of drawing games, % of active games]
    function statisticsGames() external view returns (uint256[] memory) {
        require(games.length > 0, "Such games are not exist!");
        uint256[] memory statistics = new uint256[](5); // [number of games, % of winning the first player, % of winning the second player, % of drawing games, % of active games]
        statistics[0] = games.length;

        for (uint256 i = 0; i < games.length; i++) {
            if (games[i].state == State.WinFirst) {
                statistics[1]++;
            } else if (games[i].state == State.WinSecond) {
                statistics[2]++;
            } else if (games[i].state == State.Draw) {
                statistics[3]++;
            } else {
                statistics[4]++;
            }
        }
        for (uint256 i = 1; i < statistics.length; i++) statistics[i] = (statistics[i] * 100) / statistics[0]; // Calculation of percent
        return statistics;
    }

    /// @notice Pay the winning to the player. Send the commission to the wallet. (In ETH)
    /// @param _winner Player address
    /// @param _doubleBetETH Winning (betx2)
    function returnWinETH(address _winner, uint256 _doubleBetETH) private nonReentrant {
        uint256 amountPlayerWin = (_doubleBetETH * (100 - commission)) / 100; // Calculate the player's winning (in ETH)
        uint256 amountCommission = _doubleBetETH - amountPlayerWin; // Calculate the commission (in ERC)
        require(amountPlayerWin > 0, "The winning > 0");
        require(amountCommission > 0, "The commission > 0");

        uint256 AvailableETH = address(this).balance; // Number of available contract's ETH
        require(AvailableETH >= _doubleBetETH, "Not enough ETH on contract #2");
        require(heldETH >= amountPlayerWin, "Not enough ETH on contract #3");
        heldETH = heldETH - amountPlayerWin;
        (bool sent, ) = (_winner).call{value: amountPlayerWin}(""); // ETH transaction from contract to player's account
        require(sent, "ETH transaction is not successful");

        require(heldETH >= amountCommission, "Not enough ETH on contract #3");
        heldETH = heldETH - amountCommission;
        (sent, ) = wallet.call{value: amountCommission}(""); // ETH transaction from contract to wallet
        require(sent, "ETH transaction is not successful");
    }

    /// @notice Player does the bet
    /// @param _player Player's address
    /// @param _bet Bet
    function placeBet(address _player, uint256 _bet) private {
        require(_bet > 0, "Need to ERC > 0");
        uint256 playerBalanceERC = token.balanceOf(_player); // Number of available player's ERC
        require(playerBalanceERC >= _bet, "Yours ERC balance is less, than you can put a bet");
        heldERC = heldERC + _bet; // Holding player's ERC
        bool sent = token.transferFrom(_player, address(this), _bet); // ERC transaction from player's account to contract
        require(sent, "ERC transaction is not successful");

        emit PlaceBet(_player, _bet);
    }

    /// @notice Pay the winning to the player. Send the commission to the wallet.
    /// @param _player Player address
    /// @param _doubleBet Winning (betx2)
    function returnWinERC(address _player, uint256 _doubleBet) private {
        uint256 amountPlayerWin = (_doubleBet * (100 - commission)) / 100; // Calculate the player's winning
        uint256 amountCommission = _doubleBet - amountPlayerWin; // Calculate the commission
        require(amountPlayerWin > 0, "The winning > 0");
        require(amountCommission > 0, "The commission > 0");
        uint256 AvailableERC = token.balanceOf(address(this)); // Number of available contract's ERC
        require(heldERC >= amountPlayerWin, "Not enough holding ERC on contract");
        require(AvailableERC >= heldERC, "Not enough ERC on contract");
        heldERC = heldERC - _doubleBet; // Unholding ERC to the player
        bool sent = token.transfer(_player, amountPlayerWin); // ERC transaction from contract to player's account contract
        require(sent, "ERC transaction is not successful");

        takeCommission(amountCommission); // Send the commission to the wallet
        require(sent, "ETH transaction is not successful");

        emit ReturnWinERC(_player, _doubleBet);
    }

    /// @notice Send the commission to the wallet
    /// @param _Commission Commission
    function takeCommission(uint256 _Commission) private nonReentrant {
        require(_Commission > 0, "The commission > 0");
        uint256 amountETH = _Commission * ethPerErc; // Total number of ETH
        uint256 AvailableETH = address(this).balance; // Number of available contract's ETH
        require(AvailableETH >= amountETH, "Not enough ETH on contract #8");
        (bool sent, ) = wallet.call{value: amountETH}(""); // ETH transaction from contract to wallet
        require(sent, "ETH transaction is not successful");
        emit TakeCommission(_Commission);
    }

    /// @notice Checking the winning combination on the field
    /// @param _grid Playing field
    /// @return bool Result of checking (inverse)
    function checkingCombinations(uint8[9] storage _grid) private view returns (bool) {
        for (uint256 i = 0; i < winCombinations.length; i++) {
            if ((_grid[winCombinations[i][0]] == uint256(1) && _grid[winCombinations[i][1]] == uint256(1) && _grid[winCombinations[i][2]] == uint256(1)) || (_grid[winCombinations[i][0]] == uint256(2) && _grid[winCombinations[i][1]] == uint256(2) && _grid[winCombinations[i][2]] == uint256(2)))
                return false;
        }
        return true;
    }

    /// @notice Checking the drawing combination on the field
    /// @param _grid Playing field
    /// @return bool Result of checking (inverse)
    function checkingDraw(uint8[9] storage _grid) private view returns (bool) {
        for (uint256 i = 0; i < _grid.length; i++) {
            if (_grid[i] == 0) return true;
        }
        return false;
    }

    /// @notice Checking the waiting time of the opponent's move is over
    /// @param _timeNow  Time of the beginning move + time of doing move
    /// @return bool Result of checking
    function checkingTimeOut(uint256 _timeNow) private view returns (bool) {
        return (block.timestamp <= _timeNow);
    }

    /// @notice Who has won the game
    /// @param _game Game
    /// @return address Winner's address
    function pickWinner(Game storage _game) private view returns (address) {
        if (_game.state == State.WinFirst) return _game.player1;
        if (_game.state == State.WinSecond) return _game.player2;
        return address(0);
    }

    /// @notice Who has won the game
    /// @param _state Status of the game
    /// @return newState New status of the game
    function nominationWinner(State _state) private pure returns (State) {
        if (_state == State.EndFirst) return State.WinFirst;
        if (_state == State.EndSecond) return State.WinSecond;
        return _state;
    }
}