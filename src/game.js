import React from 'react';
import Board from '@sabaki/go-board';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import { Button, Switch, Row, Col, Card, Popconfirm, Select, message, notification, Statistic, Modal, Badge, Skeleton, List, Form, Input, Descriptions } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import Countdown, { zeroPad } from 'react-countdown';
import { socket, server_url } from "./api";
import Chatbox from './view/chatbox';

import moveSound0 from './data/0.mp3'
import moveSound1 from './data/1.mp3'
import moveSound2 from './data/2.mp3'
import moveSound3 from './data/3.mp3'
import moveSound4 from './data/4.mp3'
import { Redirect } from 'react-router';
import { startMap, colorToSign, generateMarkerMap, minToMS, MSToMinString, MSToSecString } from './utils';


// const { Countdown } = Statistic;
const { Option } = Select;
const moveAudio0 = new Audio(moveSound0)
const moveAudio1 = new Audio(moveSound1)
const moveAudio2 = new Audio(moveSound2)
const moveAudio3 = new Audio(moveSound3)
const moveAudio4 = new Audio(moveSound4)
const moveAudios = [moveAudio0, moveAudio1, moveAudio2, moveAudio2, moveAudio3, moveAudio4]
const defaultSize = 19

const createTwoWaySwitch = component => ({ stateKey, text, checked }) => {
    return (
        <label>
            <Switch
                checkedChildren={<CheckOutlined />}
                unCheckedChildren={<CloseOutlined />}
                defaultChecked={checked}
                onClick={() => component.setState(s => ({ [stateKey]: !s[stateKey] }))}
            />
            <span>{text}</span>
        </label>
    )
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            joinFailed: false,
            gameStart: false,
            board: new Board(startMap(defaultSize)),
            influenceMap: [],
            markerMap: [],
            dimmedStones: [],
            currentTurn: 1,
            locked: true,
            end: false,
            boardSize: defaultSize,
            showCoordinates: true,
            animated: false,
            realisticPlacement: false,
            room_id: '',
            player1: { username: 'waiting', color: 'white' },
            player2: { username: 'waiting', color: 'black' },
            myname: localStorage.getItem('username'),
            mycolor: '',
            score1: 0,
            score2: 0,
            scoreDiff: 0,
            winner: '',
            lastMove: undefined,
            scoreModalVisible: false,
            regretModalVisible: false,
            gameEndModalVisible: false,
            gameStartResponseModalVisible: false,
            chats: [],
            bystanders: [],
            isBystander: false,
            timeLeft1: 1,
            timeLeft2: 1,
            reservedTimeLeft1: 1,
            reservedTimeLeft2: 1,
            countdownLeft1: 3,
            countdownLeft2: 3,
            markLastMove: false,
            showDimmedStones: false,
            showInfluenceMap: false,
        }
        this.toggleSwitch = createTwoWaySwitch(this);
    }

    formRef = React.createRef();

    setRef1 = (countdown) => {
        if (countdown) {
            this.countdownApi1 = countdown.getApi();
        }
    };

    setRef2 = (countdown) => {
        if (countdown) {
            this.countdownApi2 = countdown.getApi();
        }
    };

    componentDidMount() {
        this.configureSocket();
        // if (this.props.location.state) {
        //     this.setState({
        //         myname: this.props.location.state.username
        //     })
        // }
    }

    componentWillUnmount() {
        // this.props.history.goForward();
    }

    playMoveAudio = () => {
        let index = Math.floor(Math.random() * 5);
        moveAudios[index].play();
    }

    configureSocket = () => {
        socket.on('connect_error', () => {
            console.log('connect_error');
        })
        socket.on('reconnect_error', () => {
            console.log('reconnect_error')
        })
        socket.on('connect', () => { console.log(socket.id) });
        // receive uptated board from server
        socket.on('move', async (data) => {
            const room = JSON.parse(data);
            console.log(`received move`);
            if (room.lastMove.vertex[0] === -1 && this.getCurrPlayer().username !== this.state.myname) {
                message.info('Player passed')
            } else {
                let newBoard = this.state.board.makeMove(room.lastMove.sign, room.lastMove.vertex);
                this.setState({
                    board: newBoard,
                    showDimmedStones: false,
                    showInfluenceMap: false,
                })
                if (room.lastMove && room.lastMove.vertex && room.lastMove.vertex.length > 0) {
                    this.setState({
                        lastMove: room.lastMove,
                        markerMap: generateMarkerMap(this.state.boardSize, room.lastMove.vertex)
                    })
                }
                this.playMoveAudio();
            }
            this.setState({
                currentTurn: room.currentTurn
            })
            console.log('color change')
            if (this.getCurrPlayer().username === this.state.myname && !this.state.isBystander) {
                this.setState({
                    locked: false
                })
            }
            this.pauseTimer1();
            this.pauseTimer2();
            this.setState({
                timeLeft1: room.players[0].reservedTimeLeft,
                timeLeft2: room.players[1].reservedTimeLeft,
                reservedTimeLeft1: Date.now() + room.players[0].reservedTimeLeft,
                reservedTimeLeft2: Date.now() + room.players[1].reservedTimeLeft,
                countdownLeft1: room.players[0].countdownLeft,
                countdownLeft2: room.players[1].countdownLeft,
            })
            if (this.isPlayerTurn(0)) {
                this.startTimer1();
            } else {
                this.startTimer2();
            }
        })
        socket.on('info', (data) => {
            const { username } = data;
            this.setState({ myname: username });
        })

        socket.on('room bystander change', async (data) => {
            console.log('room bystander change');
            const room = JSON.parse(data);
            let { room_id, players, gameStarted, bystanders, boardSize, handicap, komi, countdown, countdownTime, reservedTime, randomPlayerColor } = room;
            this.setState({
                room_id: room_id,
                gameStart: gameStarted,
                bystanders: bystanders,
                komi: komi,
                boardSize: boardSize,
                handicap: handicap,
                countdownChance: countdown,
                countdownTime: countdownTime,
                reservedTime: reservedTime,
                randomPlayerColor: randomPlayerColor,
            })
            if (gameStarted) {
                const map = JSON.parse(room.currentBoardSignedMap);
                this.setState({
                    board: new Board(map),
                    timeLeft1: players[0].reservedTimeLeft,
                    reservedTimeLeft1: Date.now() + players[0].reservedTimeLeft,
                    countdownLeft1: players[0].countdownLeft,
                    timeLeft2: players[1].reservedTimeLeft,
                    reservedTimeLeft2: Date.now() + players[1].reservedTimeLeft,
                    countdownLeft2: players[1].countdownLeft,
                })
                if (room.lastMove && room.lastMove.vertex && room.lastMove.vertex.length > 0) {
                    this.setState({
                        lastMove: room.lastMove,
                        markerMap: generateMarkerMap(this.state.boardSize, room.lastMove.vertex)
                    })
                }
            }
            if (players[0]) {
                this.setState({
                    player1: players[0],
                })
            }
            if (players[1]) {
                this.setState({
                    player2: players[1],
                })
            }
            if (this.state.myname !== this.state.player1.username && this.state.myname !== this.state.player2.username) {
                this.setState({
                    mycolor: 'undefined',
                    isBystander: true
                })
            }
            const endpoint = server_url + 'message/room';
            fetch(`${endpoint}/${encodeURIComponent(room_id)}`, {
                method: 'GET',
                headers: {
                    Authorization: `bearer`,
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
            }).then(response => response.json())
                .then(data => {
                    console.log(data);
                    let chats = [];
                    data.forEach(chat => {
                        chats.push(chat)
                    });
                    this.setState({
                        chats: chats
                    })
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        })

        socket.on('room player change', async (data) => {
            console.log('room player change');
            const room = JSON.parse(data);
            console.log(room)
            let { room_id, players, gameStarted, bystanders, boardSize, handicap, komi, countdown, countdownTime, reservedTime, randomPlayerColor } = room;
            this.setState({
                room_id: room_id,
                gameStart: gameStarted,
                bystanders: bystanders,
                komi: komi,
                boardSize: boardSize,
                handicap: handicap,
                countdownChance: countdown,
                countdownTime: countdownTime,
                reservedTime: reservedTime,
                randomPlayerColor: randomPlayerColor,
            })
            if (gameStarted) {
                const map = JSON.parse(room.currentBoardSignedMap);
                this.setState({
                    board: new Board(map),
                    currentTurn: room.currentTurn,
                    locked: !(room.players[room.currentTurn].username === this.state.myname) || this.state.isBystander,
                    timeLeft1: players[0].reservedTimeLeft,
                    reservedTimeLeft1: Date.now() + players[0].reservedTimeLeft,
                    countdownLeft1: players[0].countdownLeft,
                    timeLeft2: players[1].reservedTimeLeft,
                    reservedTimeLeft2: Date.now() + players[1].reservedTimeLeft,
                    countdownLeft2: players[1].countdownLeft,
                })
                if (room.lastMove && room.lastMove.vertex && room.lastMove.vertex.length > 0) {
                    this.setState({
                        lastMove: room.lastMove,
                        markerMap: generateMarkerMap(this.state.boardSize, room.lastMove.vertex)
                    })
                }
            } else {
                this.setState({
                    board: new Board(startMap(room.boardSize)),
                })
            }
            if (players[0]) {
                this.setState({
                    player1: players[0],
                })
            }
            if (players[1]) {
                this.setState({
                    player2: players[1],
                })
            }
            if (this.state.myname === this.state.player1.username) {
                this.setState({ mycolor: this.state.player1.color })
            } else {
                this.setState({ mycolor: this.state.player2.color })
            }
            const endpoint = server_url + 'message/room';
            fetch(`${endpoint}/${encodeURIComponent(room_id)}`, {
                method: 'GET',
                headers: {
                    Authorization: `bearer`,
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
            }).then(response => response.json())
                .then(data => {
                    console.log(data);
                    let chats = [];
                    data.forEach(chat => {
                        chats.push(chat)
                    });
                    this.setState({
                        chats: chats
                    })
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        })

        socket.on('game start', (data) => {
            // this.resetBoard();
            const room = JSON.parse(data);
            let { room_id, players, currentTurn } = room;
            this.setState({
                gameStart: true,
                room_id: room_id,
                player1: players[0],
                player2: players[1],
                end: false,
                currentTurn: currentTurn,
                showDimmedStones: false,
                showInfluenceMap: false,
            })
            const initBoardSignedMap = JSON.parse(room.initBoardSignedMap)
            this.setState({
                timeLeft1: players[0].reservedTimeLeft,
                timeLeft2: players[1].reservedTimeLeft,
                reservedTimeLeft1: Date.now() + players[0].reservedTimeLeft,
                reservedTimeLeft2: Date.now() + players[1].reservedTimeLeft,
                countdownLeft1: players[0].countdownLeft,
                countdownLeft2: players[1].countdownLeft,
                countdownTime: room.countdownTime,
                komi: room.komi,
                handicap: room.handicap,
                randomPlayerColor: room.randomPlayerColor,
                boardSize: room.boardSize,
                board: new Board(initBoardSignedMap),
            })

            if (this.state.myname === this.state.player1.username) {
                this.setState({ mycolor: this.state.player1.color })
            } else {
                this.setState({ mycolor: this.state.player2.color })
            }
            if (this.getCurrPlayer().username === this.state.myname && !this.state.isBystander) {
                this.setState({
                    locked: false
                })
            }
            if (this.isPlayerTurn(0)) {
                this.startTimer1();
            } else {
                this.startTimer2();
            }
        })

        socket.on('game start init', (data) => {
            if (!this.state.isBystander) {
                const room = JSON.parse(data);
                console.log(room.players);
                this.setState({
                    countdownTime: room.countdownTime,
                    countdownChance: room.countdown,
                    komi: room.komi,
                    handicap: room.handicap,
                    randomPlayerColor: room.randomPlayerColor,
                    boardSize: room.boardSize,
                    reservedTime: room.reservedTime,
                    player1: room.players[0],
                    player2: room.players[1],
                }, () => this.setState({
                    gameStartResponseModalVisible: true
                }))
            }
        })

        socket.on('game end init', () => {
            // TODO implement game end 
            if (!this.state.isBystander) {
                this.setState({
                    gameEndModalVisible: true
                })
            }
        })

        socket.on('game end result', (data) => {
            const room = JSON.parse(data);
            console.log('game ended');
            this.setState({
                end: room.gameFinished,
                winner: room.winner,
                gameStart: !room.gameFinished,
            })
            if (this.state.end) {
                const { player1, player2, myname } = this.state;
                if ((room.winner === 0 && player1.username === myname) || (room.winner === 1 && player2.username === myname)) {
                    message.success('You Won!');
                } else if ((room.winner === 1 && player1.username === myname) || (room.winner === 0 && player2.username === myname)) {
                    message.error('You Lost');
                }
            }
        })

        /**
         * handle opponent resigned
         */
        socket.on('game ended', (data) => {
            const room = JSON.parse(data);
            this.setState({
                end: true,
                winner: room.winner,
                gameStart: false
            })
            const { player1, player2, myname } = this.state;
            if ((room.winner === 0 && player1.username === myname) || (room.winner === 1 && player2.username === myname)) {
                message.success('You Won!');
            } else if ((room.winner === 1 && player1.username === myname) || (room.winner === 0 && player2.username === myname)) {
                message.error('You Lost');
            }
        })

        socket.on('calc score', (data) => {
            // TODO implement terr count 
            const scoreResult = JSON.parse(data);
            console.log('calc score' + scoreResult);
            const { player1 } = this.state;
            if (player1.color === 'black') {
                this.setState({
                    score1: scoreResult.territory[0],
                    score2: scoreResult.territory[1],
                    scoreDiff: scoreResult.territoryScore
                })
            } else {
                this.setState({
                    score1: scoreResult.territory[1],
                    score2: scoreResult.territory[0],
                    scoreDiff: scoreResult.territoryScore
                })
            }
            if (!this.state.isBystander) {
                this.setState({
                    scoreModalVisible: true
                })
            }
        })

        socket.on('resign', () => {
            // TODO implment win message
            console.log('opponent resigned')
            this.setState({
                end: true,
                gameStart: false
            })
        })

        socket.on('regret init', (data) => {
            const room = JSON.parse(data);
            if (room.room_id === this.state.room_id && !this.state.isBystander) {
                this.setState({
                    regretModalVisible: true
                })
            }
        })

        socket.on('regret result', (data) => {
            const room = JSON.parse(data);
            if (room.room_id === this.state.room_id) {
                if (room.currentBoardSignedMap === JSON.stringify(this.state.board.signMap)) {
                    // no regret 
                    message.error('opponent refused your regret request');
                } else {
                    this.setState({
                        currentTurn: room.currentTurn,
                        board: new Board(JSON.parse(room.currentBoardSignedMap)),
                        locked: !(room.players[room.currentTurn].username === this.state.myname) || this.state.isBystander,
                        showDimmedStones: false,
                        showInfluenceMap: false,
                    })
                    if (room.lastMove && room.lastMove.vertex && room.lastMove.vertex.length > 0) {
                        this.setState({
                            lastMove: room.lastMove,
                            markerMap: generateMarkerMap(this.state.boardSize, room.lastMove.vertex)
                        })
                    }
                    message.success('Opponent accept your regret request');
                }
            }
        })

        socket.on('new message', (data) => {
            const message = JSON.parse(data);
            let chats = this.state.chats;
            chats.push(message)
            this.setState({
                chats: chats
            })
        })

        socket.on('debug', (debug_message) => {
            message.error(debug_message);
        })
    }

    /**
     * fetch game analysis from server
     * @param {Number} komi Komi for white player
     * @param {Number} handicap 
     * @param {2D-Array} signMap 
     */
    fetchAnalysisData = (komi, handicap, signMap) => {
        const endpoint = server_url + 'game/analysis/';
        const data = {
            komi: komi,
            handicap: handicap,
            signMap: signMap
        }
        fetch(`${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            body: JSON.stringify(data),
        }).then(response => response.json())
            .then(data => {
                console.log('Analysis fetch success', data);
                this.setState({
                    dimmedStones: data.deadStoneVertices,
                    influenceMap: data.areaMap,
                    showDimmedStones: true,
                    showInfluenceMap: true,
                    score1: data.scoreResult.territory[0],
                    score2: data.scoreResult.territory[1],
                    scoreDiff: data.scoreResult.territoryScore
                })
                let winnerNote = ''
                if (data.scoreResult.territoryScore > 0) {
                    winnerNote = `black has a lead of ${data.scoreResult.territoryScore}`;
                } else if (data.scoreResult.territoryScore < 0) {
                    winnerNote = `white has a lead of ${-data.scoreResult.territoryScore}`;
                } else {
                    winnerNote = `Situation is a stalemate`;
                }
                const result = {
                    message: 'Current Score',
                    description:
                        `Black have ${data.scoreResult.territory[0]} territories \n 
                        white have ${data.scoreResult.territory[1]} territories \n
                        ${winnerNote}`,
                    duration: 20,
                    style: {
                        'whiteSpace': 'pre-line'
                    }
                }
                notification.open(result);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    showAnalysis = () => {
        if (this.state.showDimmedStones) {
            this.setState({
                showDimmedStones: false,
                showInfluenceMap: false,
            })
        } else {
            this.fetchAnalysisData(this.state.komi, this.state.handicap, this.state.board.signMap);
        }
    }

    getCurrSign = () => {
        return colorToSign(this.getCurrPlayer().color)
    }

    /**
     * reset the board, used for debug purpose, 
     * shouldn't be exposed in production
     */
    resetBoard = () => {
        let newMap = startMap(defaultSize)
        this.setState({
            board: new Board(newMap),
            end: false
        })
    }

    /**
     * used when mouse clicked on board, used by Board's onVertexMouseUp
     * @param {*} evt mouse event
     * @param {*} x coord pair
     * @param {*} y coord pair
     */
    mouseClick = (evt, [x, y]) => {
        let sign = this.getCurrSign();
        if (!this.state.locked && !this.state.end) {
            try {
                this.state.board.makeMove(sign, [x, y], { preventOverwrite: true, preventKo: true })
                this.setState({
                    locked: true
                })
                if (this.isPlayerTurn(0)) {
                    this.pauseTimer1();
                    setTimeout(() => {
                        socket.emit('move', {
                            room_id: this.state.room_id,
                            sign: sign,
                            vertex: [x, y],
                            reservedTimeLeft: this.state.timeLeft1,
                            countdownLeft: this.state.countdownLeft1
                        })
                    }, 100)
                } else if (this.isPlayerTurn(1)) {
                    this.pauseTimer2();
                    setTimeout(() => {
                        socket.emit('move', {
                            room_id: this.state.room_id,
                            sign: sign,
                            vertex: [x, y],
                            reservedTimeLeft: this.state.timeLeft2,
                            countdownLeft: this.state.countdownLeft2
                        })
                    }, 100)
                }

                console.log('sent move to server');
            } catch (e) {
                console.error(e);
            }
        }

    }

    /**
     * current player choose to pass
     */
    pass = () => {
        this.setState({
            locked: true
        })
        if (this.isPlayerTurn(0)) {
            this.pauseTimer1();
            setTimeout(() => {
                socket.emit('move', {
                    room_id: this.state.room_id,
                    sign: this.getCurrSign(),
                    vertex: [-1, -1],
                    reservedTimeLeft: this.state.timeLeft1,
                    countdownLeft: this.state.countdownLeft1
                })
            }, 100)
        } else if (this.isPlayerTurn(1)) {
            this.pauseTimer2();
            setTimeout(() => {
                socket.emit('move', {
                    room_id: this.state.room_id,
                    sign: this.getCurrSign(),
                    vertex: [-1, -1],
                    reservedTimeLeft: this.state.timeLeft2,
                    countdownLeft: this.state.countdownLeft2
                })
            }, 100)
        }
        // socket.emit('move', { room_id: this.state.room_id, sign: this.getCurrSign(), vertex: [-1, -1] })
        console.log(`you passed`);
        message.info('You passed');
    }

    /**
     * current player wish to resign
     */
    resign = () => {
        this.setState({
            end: true,
            gameStart: false
        })
        socket.emit('resign', { room_id: this.state.room_id, username: this.state.myname });
        message.warn('You choose to resign');
        console.log(`you resigned`);
    }

    /**
     * current player runout of alloted time
     */
    playerTimeout = () => {
        this.setState({
            end: true,
            gameStart: false,
        })
        socket.emit('timeout', { room_id: this.state.room_id, username: this.state.myname });
        message.error('You time run out');
        console.log(`you timed out`);
    }

    /**
     * current player initiate a count territory request
     */
    calcScore = () => {
        socket.emit('calc score', { room_id: this.state.room_id });
    }

    /**
     * current player initiate a regret request
     */
    regret = () => {
        socket.emit('regret init', { room_id: this.state.room_id, username: this.state.myname });
    }

    /**
     * getter for state.locked 
     */
    getLocked = () => {
        return (this.state.locked)
    }

    gameStart = () => {
        this.setState({
            gameStartInitModalVisible: true
        })
    }

    /**
     * game start init settings confirmed, send to server
     */
    gameStartConfirm = (value) => {
        const { myname, room_id } = this.state;
        const { boardSize, handicap, komi, countdownChance, countdownTime, reservedTime, playerColor } = value;
        let randomPlayerColor;
        if (playerColor === 'random') {
            randomPlayerColor = true;
        } else {
            randomPlayerColor = false;
        }
        const otherColor = playerColor === 'black' ? 'white' : 'black';
        const otherName = this.state.player1.username === myname ? this.state.player2.username : this.state.player1.username;
        const gameStartSetting = {
            username: myname,
            room_id: room_id,
            boardSize,
            handicap,
            komi,
            countdown: countdownChance,
            countdownTime,
            reservedTime,
            randomPlayerColor,
            [myname]: { color: playerColor },
            [otherName]: { color: otherColor },
        }
        console.log(gameStartSetting)
        socket.emit('game start init', gameStartSetting);
        this.setState({
            gameStartInitModalVisible: false
        })
    }

    /**
     * game start init canceled
     */
    gameStartCancel = () => {
        this.setState({
            gameStartInitModalVisible: false
        })
    }

    /**
     * used when regret request is denied
     */
    regretHandleCancel = () => {
        this.setState({
            regretModalVisible: false,
        });
        socket.emit('regret response', {
            username: this.state.myname,
            room_id: this.state.room_id,
            answer: false
        })
    };

    /**
     * used when regret request is accepted
     */
    regretHandleOk = () => {
        this.setState({
            regretModalVisible: false
        });
        socket.emit('regret response', {
            username: this.state.myname,
            room_id: this.state.room_id,
            answer: true
        })
    }

    /**
     * used when count territory request is accepted
     */
    countHandleOk = () => {
        this.setState({
            scoreModalVisible: false
        })
        socket.emit('game end init', { room_id: this.state.room_id, username: this.state.myname });
    }

    /**
     * used when count territory request is denied
     */
    countHandleCancel = () => {
        this.setState({
            scoreModalVisible: false
        })
    }

    /**
     * used when game end request is accepted
     */
    gameEndHandleOk = () => {
        this.setState({
            gameEndModalVisible: false
        })
        socket.emit('game end response', { room_id: this.state.room_id, username: this.state.myname, answer: true });
    }

    /**
     * used when game end request is denied
     */
    gameEndHandleCancel = () => {
        this.setState({
            gameEndModalVisible: false
        })
        socket.emit('game end response', { room_id: this.state.room_id, username: this.state.myname, answer: false })
    }

    /**
     * used when game start request is accepted
     */
    gameStartHandleOk = () => {
        this.setState({
            gameStartResponseModalVisible: false
        })
        socket.emit('game start response', { room_id: this.state.room_id, username: this.state.myname, answer: true });
    }

    /**
     * used when game start request is denied
     */
    gameStartHandleCancel = () => {
        this.setState({
            gameStartResponseModalVisible: false
        })
        socket.emit('game start response', { room_id: this.state.room_id, username: this.state.myname, answer: false })
    }

    /**
     * check if it is currently this player's turn
     * @param {integer} player the index of player to be checked, 0 or 1
     */
    isPlayerTurn = (player) => {
        return player === this.state.currentTurn;
    }

    /**
     * return the current player
     */
    getCurrPlayer = () => {
        return this.state.currentTurn === 0 ? this.state.player1 : this.state.player2;
    }

    /**
     * used to send message to the room
     * @param {string} message message to be sent
     */
    sendMessage = (message) => {
        const { myname } = this.state;
        socket.emit('new message', { username: myname, message: message, })
    }

    /**
     * start timer of player1
     */
    startTimer1 = () => {
        // console.log('timer1 start');
        this.countdownApi1 && this.countdownApi1.start();
    }

    /**
     * start timer of player2
     */
    startTimer2 = () => {
        // console.log('timer2 start');
        this.countdownApi2 && this.countdownApi2.start();
    }

    /**
     * pause timer of player1
     */
    pauseTimer1 = () => {
        // console.log('timer1 pause');
        this.countdownApi1 && this.countdownApi1.pause();
    };

    /**
     * pause timer of player2
     */
    pauseTimer2 = () => {
        // console.log('timer2 pause');
        this.countdownApi2 && this.countdownApi2.pause();
    };

    /**
     * custom renderer for Countdown component
     */
    countdownRenderer = ({ hours, minutes, seconds }) => (
        <Statistic title='Remaining Time' value={`${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}`} />
    );

    /**
     * callback function for Countdown onPause, pause the countdown
     * @param {integer} timerNo 
     */
    countdownPause = (timerNo) => ({ total }) => {
        this.setState(() => ({
            ['timeLeft' + timerNo]: total
        }))
    }

    countdownStop = () => {

    }

    render() {
        let {
            joinFailed,
            gameStart,
            board,
            locked,
            showCoordinates,
            realisticPlacement,
            animated,
            player1,
            player2,
            myname,
            end,
            score1,
            score2,
            scoreDiff,
            isBystander,
            markLastMove,
            markerMap,
            dimmedStones,
            influenceMap,
            showDimmedStones,
            showInfluenceMap,
        } = this.state;
        if (joinFailed) {
            return (
                <Redirect push to={{ pathname: "/joinroom", state: { username: myname } }} />
            );
        }
        const gameStartInitModal = (
            <Modal
                title="Game Start Request"
                visible={this.state.gameStartInitModalVisible}
                // onOk={this.formRef.current.submit}
                onCancel={this.gameStartCancel}
                footer={[
                    <Button key="Refuse" onClick={this.gameStartCancel}>
                        Cancel
                    </Button>,
                    <Button form="game_start_form" key="Accept" type="primary" htmlType="submit">
                        Start Game
                    </Button>,
                ]}
            >
                <Form id='game_start_form'
                    onFinish={this.gameStartConfirm}
                    initialValues={{
                        boardSize: this.state.boardSize,
                        handicap: this.state.handicap,
                        komi: this.state.komi,
                        reservedTime: this.state.reservedTime,
                        countdownChance: this.state.countdownChance,
                        countdownTime: this.state.countdownTime,
                        playerColor: 'random'
                    }}
                    ref={this.formRef}>
                    <Form.Item
                        name='boardSize'
                        label='Board Size'
                    >
                        <Select>
                            <Option value={9}>9</Option>
                            <Option value={13}>13</Option>
                            <Option value={19}>19</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='handicap'
                        label='Handicap'
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name='komi'
                        label='Komi'
                    >
                        <Select>
                            <Option value={6.5}>6.5</Option>
                            <Option value={7.5}>7.5</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='reservedTime'
                        label='Reserved Time'
                    >
                        <Select>
                            <Option value={minToMS(1)}> 1 minute</Option>
                            <Option value={minToMS(10)}>10 minutes</Option>
                            <Option value={minToMS(20)}>20 minutes</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='countdownChance'
                        label='Countdown Chance'
                    >
                        <Select>
                            <Option value={1}>1</Option>
                            <Option value={3}>3</Option>
                            <Option value={5}>5</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='countdownTime'
                        label='Countdown Time'
                    >
                        <Select>
                            <Option value={minToMS(0.5)}> 30 seconds</Option>
                            <Option value={minToMS(0.75)}>45 seconds</Option>
                            <Option value={minToMS(1)}>60 seconds</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name='playerColor'
                        label='Your Color'
                    >
                        <Select>
                            <Option value='black'>Black</Option>
                            <Option value='white'>White</Option>
                            <Option value='random'>Random</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        )
        const gameStartResponseModal = (
            <Modal
                title="Game Start Request"
                visible={this.state.gameStartResponseModalVisible}
                onOk={this.gameStartHandleOk}
                onCancel={this.gameStartHandleCancel}
                footer={[
                    <Button key="Refuse" onClick={this.gameStartHandleCancel}>
                        Not yet
                    </Button>,
                    <Button key="Accept" type="primary" onClick={this.gameStartHandleOk}>
                        Let's start!
                    </Button>,
                ]}
            >
                <p>Your opponent would like to start the game with the following settings, will you accept?</p>
                <Descriptions bordered>
                    <Descriptions.Item label='Board Size' span={3}>{this.state.boardSize}</Descriptions.Item>
                    <Descriptions.Item label='Komi'span={3}>{this.state.komi}</Descriptions.Item>
                    <Descriptions.Item label='Handicap'span={3}>{this.state.handicap}</Descriptions.Item>
                    <Descriptions.Item label='Reserved Time'span={3}>{`${MSToMinString(this.state.reservedTime)} minutes`}</Descriptions.Item>
                    <Descriptions.Item label='Countdown Time'span={3}>{`${MSToSecString(this.state.countdownTime)} seconds`}</Descriptions.Item>
                    <Descriptions.Item label='Countdown Chances'span={3}>{this.state.countdownChance}</Descriptions.Item>
                    <Descriptions.Item label='Random colors?'span={3}>{this.state.randomPlayerColor ? 'Yes' : 'No'}</Descriptions.Item>
                    {this.state.randomPlayerColor ? null: (
                            this.state.player1.username === myname ? (
                                <Descriptions.Item label='Your Color'span={3}>{this.state.player1.color}</Descriptions.Item>
                            ) : <Descriptions.Item label='Your Color'span={3}>{this.state.player2.color}</Descriptions.Item>
                        )
                    }
                </Descriptions>
            </Modal>
        )
        if (!gameStart) {
            return (
                <div>
                    {gameStartResponseModal}
                    {gameStartInitModal}
                    {/* <Skeleton active /> */}
                    <Row>
                        <Col flex='650px'>
                            <Goban vertexSize={30}
                                signMap={board.signMap}
                                showCoordinates={showCoordinates}
                                fuzzyStonePlacement={realisticPlacement}
                                animateStonePlacement={animated}
                                onVertexMouseUp={this.mouseClick} />
                        </Col>
                        <Col flex='100px'></Col>
                        <Col flex='auto'>
                            <Row>
                                <Statistic title='Game Room' value={this.state.room_id}></Statistic>
                            </Row>
                            <Row>
                                <Col>
                                    <Card title={player1.username} style={{ width: 300 }}
                                        headStyle={player1.username === myname ? { backgroundColor: "darkgrey" } : { backgroundColor: "white" }}
                                        bodyStyle={player1.username === myname ? { backgroundColor: "aliceblue" } : { backgroundColor: "white" }}>
                                        <Statistic title='Rank' value='1d'></Statistic>
                                        <Badge dot={this.isPlayerTurn(0)}>
                                            <Statistic title='Playing' value={player1.color}></Statistic>
                                        </Badge>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card title={player2.username} style={{ width: 300 }}
                                        headStyle={player2.username === myname ? { backgroundColor: "darkgrey" } : { backgroundColor: "white" }}
                                        bodyStyle={player2.username === myname ? { backgroundColor: "aliceblue" } : { backgroundColor: "white" }}>
                                        <Statistic title='Rank' value='1d'></Statistic>
                                        <Badge dot={this.isPlayerTurn(1)}>
                                            <Statistic title='Playing' value={player2.color}></Statistic>
                                        </Badge>
                                    </Card>
                                </Col>
                            </Row>
                            <Skeleton />
                            <Row>
                                <Button onClick={this.gameStart} disabled={isBystander || gameStart}>Start game</Button>
                            </Row>
                        </Col>
                    </Row>
                </div>

            )
        }

        return (
            <div>
                <Modal
                    title="Regret Request"
                    visible={this.state.regretModalVisible}
                    onOk={this.regretHandleOk}
                    onCancel={this.regretHandleCancel}
                    footer={[
                        <Button key="Refuse" onClick={this.regretHandleCancel}>
                            Refuse
                    </Button>,
                        <Button key="Accept" type="primary" onClick={this.regretHandleOk}>
                            Accept
                    </Button>,
                    ]}
                >
                    <p>Your opponent would like to regret the last move, will you accept?</p>
                </Modal>
                <Modal
                    title="Score Count Result"
                    visible={this.state.scoreModalVisible}
                    onOk={this.countHandleOk}
                    onCancel={this.countHandleCancel}
                    footer={[
                        <Button key="No" onClick={this.countHandleCancel}>
                            No
                    </Button>,
                        <Button key="Yes" type="primary" onClick={this.countHandleOk}>
                            Yes
                    </Button>,
                    ]}
                >
                    <p>Current score is </p>
                    <p>{player1.username} as {player1.color} with {score1} territories</p>
                    <p>{player2.username} as {player2.color} with {score2} territories</p>
                    <p> with a {scoreDiff > 0 ? 'black lead of' + scoreDiff + 'points' : 'white lead of ' + -1 * scoreDiff + 'points'}, </p>
                    <p> would you like to end the game now? </p>
                </Modal>
                <Modal
                    title="Game End Request"
                    visible={this.state.gameEndModalVisible}
                    onOk={this.gameEndHandleOk}
                    onCancel={this.gameEndHandleCancel}
                    footer={[
                        <Button key="Refuse" onClick={this.gameEndHandleCancel}>
                            Refuse
                    </Button>,
                        <Button key="Accept" type="primary" onClick={this.gameEndHandleOk}>
                            Accept
                    </Button>,
                    ]}
                >
                    <p>Your opponent would like to end the game with current board, will you accept?</p>
                </Modal>
                {gameStartResponseModal}
                <Row>
                    <Col flex='650px'>
                        <Goban vertexSize={30}
                            signMap={board.signMap}
                            markerMap={markLastMove && markerMap}
                            paintMap={showInfluenceMap && influenceMap}
                            dimmedStones={showDimmedStones ? dimmedStones : []}
                            showCoordinates={showCoordinates}
                            fuzzyStonePlacement={realisticPlacement}
                            animateStonePlacement={animated}
                            onVertexMouseUp={this.mouseClick} />
                    </Col>
                    <Col flex='100px'></Col>
                    <Col flex='auto'>
                        <Row>
                            <Statistic title='Game Room' value={this.state.room_id}></Statistic>
                        </Row>
                        <Row>
                            <Col>
                                <Card title={player1.username} style={{ width: 300 }}
                                    headStyle={player1.username === myname ? { backgroundColor: "darkgrey" } : { backgroundColor: "white" }}
                                    bodyStyle={player1.username === myname ? { backgroundColor: "aliceblue" } : { backgroundColor: "white" }}>
                                    <Statistic title='Rank' value='1d'></Statistic>
                                    <Statistic title='Remaining Countdown Chance' value={this.state.countdownLeft1}></Statistic>
                                    <Countdown
                                        date={this.state.reservedTimeLeft1}
                                        ref={this.setRef1}
                                        autoStart={false}
                                        onPause={this.countdownPause(1)}
                                        renderer={this.countdownRenderer}
                                    />
                                    <Badge dot={this.isPlayerTurn(0)}>
                                        <Statistic title='Playing' value={player1.color}></Statistic>
                                    </Badge>
                                </Card>
                            </Col>
                            <Col>
                                <Card title={player2.username} style={{ width: 300 }}
                                    headStyle={player2.username === myname ? { backgroundColor: "darkgrey" } : { backgroundColor: "white" }}
                                    bodyStyle={player2.username === myname ? { backgroundColor: "aliceblue" } : { backgroundColor: "white" }}>
                                    <Statistic title='Rank' value='1d'></Statistic>
                                    <Statistic title='Remaining Countdown Chance' value={this.state.countdownLeft2}></Statistic>
                                    {<Countdown
                                        date={this.state.reservedTimeLeft2}
                                        ref={this.setRef2}
                                        autoStart={false}
                                        onPause={this.countdownPause(2)}
                                        renderer={this.countdownRenderer}
                                    />}
                                    <Badge dot={this.isPlayerTurn(1)}>
                                        <Statistic title='Playing' value={player2.color}></Statistic>
                                    </Badge>
                                </Card>
                            </Col>
                            <Col>
                                <List
                                    className="bystander-list"
                                    itemLayout="vertical"
                                    bordered
                                    dataSource={this.state.bystanders}
                                    locale={{ emptyText: 'No bystander' }}
                                    renderItem={user => (
                                        <Statistic title='bystander' value={user.username}></Statistic>
                                    )}
                                />
                            </Col>
                        </Row>
                        <Row>
                            <this.toggleSwitch stateKey={'showCoordinates'} text={'show coordinates'} checked={true}></this.toggleSwitch>
                        </Row>
                        <Row>
                            <this.toggleSwitch stateKey={'realisticPlacement'} text={'realistic stone placement'} checked={false}></this.toggleSwitch>
                        </Row>
                        <Row>
                            <this.toggleSwitch stateKey={'animated'} text={'animated stone placement'} checked={false}></this.toggleSwitch>
                        </Row>
                        <Row>
                            <this.toggleSwitch stateKey={'markLastMove'} text={'mark last move'} checked={false}></this.toggleSwitch>
                        </Row>
                        <Row>
                            <Col>
                                <Popconfirm placement="left" title='Are you sure to pass?' onConfirm={this.pass} okText="Yes" cancelText="No" disabled={locked || end || isBystander}>
                                    <Button disabled={locked || end || isBystander}>Pass</Button>
                                </Popconfirm>
                            </Col>
                            <Col>
                                <Button onClick={this.regret} disabled={end || isBystander}>Regret</Button>
                            </Col>
                            <Col>
                                <Popconfirm placement="top" title='Are you sure to resign?' onConfirm={this.resign} okText="Yes" cancelText="No" disabled={end || isBystander}>
                                    <Button disabled={end || isBystander}>Resign</Button>
                                </Popconfirm>
                            </Col>
                            <Col>
                                <Button onClick={this.calcScore} disabled={end || isBystander}>Calculate Score</Button>
                            </Col>
                            <Col>
                                <Button onClick={this.gameStart} disabled={isBystander || gameStart}>Start game</Button>
                            </Col>
                            <Col>
                                <Button onClick={this.showAnalysis} disabled={!gameStart}>Show Analysis</Button>
                            </Col>
                        </Row>
                        <Row>
                            <Chatbox chats={this.state.chats} username={this.state.myname} room_id={this.state.room_id}></Chatbox>
                        </Row>
                    </Col>
                </Row>
            </div>
        )
    }
}

export default Game;