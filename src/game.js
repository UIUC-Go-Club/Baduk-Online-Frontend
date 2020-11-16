import React from 'react';
import Board from '@sabaki/go-board';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import '@sabaki/go-board';
import { Button, Switch, Row, Col, Card, Popconfirm, message, Statistic, Modal, Badge, Skeleton } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { socket } from "./api";
import Chatbox from './view/chatbox';

import moveSound0 from './data/0.mp3'
import moveSound1 from './data/1.mp3'
import moveSound2 from './data/2.mp3'
import moveSound3 from './data/3.mp3'
import moveSound4 from './data/4.mp3'

const { Countdown } = Statistic;
const moveAudio0 = new Audio(moveSound0)
const moveAudio1 = new Audio(moveSound1)
const moveAudio2 = new Audio(moveSound2)
const moveAudio3 = new Audio(moveSound3)
const moveAudio4 = new Audio(moveSound4)
const moveAudios = [moveAudio0,moveAudio1,moveAudio2,moveAudio2,moveAudio3,moveAudio4]
const defaultSize = 19

export function startMap(size) {
    return new Array(size).fill(0).map(() => new Array(size).fill(0));
}

export function signToColor(sign) {
    if (sign === 1) {
        return "black";
    } else {
        return 'white';
    }
}

export function colorToSign(color) {
    return (color === 'black' ? 1 : -1);
}

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
            gameStart: false,
            board: new Board(startMap(defaultSize)),
            currColor: 1,
            locked: true,
            end: false,
            boardSize: defaultSize,
            showCoordinates: true,
            animated: false,
            realisticPlacement: false,
            room_id: '',
            player1: { username: 'player1', color: 'white' },
            player2: { username: 'player2', color: 'black' },
            myname: '',
            mycolor: '',
            score1: 0,
            score2: 0,
            scoreDiff: 0,
            winner: '',
            scoreModalVisible: false,
            regretModalVisible: false,
            gameEndModalVisible: false,
            gameStartModalVisible: false,
            chats : []
        }
        this.toggleSwitch = createTwoWaySwitch(this);
    }

    totalTime1;
    totalTime2;
    countdownApi1 = null;
    countdownApi2 = null;

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
        socket.on('move', (data) => {
            const room = JSON.parse(data);
            const map = JSON.parse(room.currentBoardSignedMap);
            console.log(`received move`);
            console.log(room.currentBoardSignedMap)
            console.log(map)
            if (room.currentBoardSignedMap === JSON.stringify(this.state.board.signMap) && signToColor(this.state.currColor) !== this.state.mycolor) {
                message.info('Your opponent choose to pass')
            } else {
                let newBoard = new Board(map)
                this.setState({
                    board: newBoard
                })
                this.playMoveAudio();
            }
            this.setState({currColor: this.state.currColor * -1});
            if (signToColor(this.state.currColor) === this.state.mycolor) {
                this.setState({
                    locked: false
                })
            }
            if (this.isPlayerTurn(0)) {
                this.startTimer1();
                this.pauseTimer2();
            } else {
                this.startTimer2();
                this.pauseTimer1();
            }
        })
        socket.on('info', (data) => {
            const { username } = data;
            this.setState({ myname: username });
        })
        socket.on('game start', (data) => {
            const room = JSON.parse(data);
            let { room_id, players } = room;
            this.setState({
                gameStart: true,
                room_id: room_id,
                player1: players[0],
                player2: players[1],
            })
            this.totalTime1 = Date.now() + 1000 * players[0].initial_time;
            this.totalTime2 = Date.now() + 1000 * players[1].initial_time;
            if (this.state.myname === this.state.player1.username) {
                this.setState({ mycolor: this.state.player1.color })
            } else {
                this.setState({ mycolor: this.state.player2.color })
            }
            if (this.state.mycolor === 'black') {
                this.setState({
                    locked: false
                })
            }
            if (this.isPlayerTurn(0)) {
                this.startTimer1();
                this.pauseTimer2();
            } else {
                this.startTimer2();
                this.pauseTimer1();
            }
        })

        socket.on('game start init', ()=> {
            this.setState({
                gameStartModalVisible: true
            })
        })

        socket.on('game rejoin', (data)=> {
            const room = JSON.parse(data);
            let { room_id, players } = room;
            this.setState({
                gameStart: true,
                room_id: room_id,
                player1: players[0],
                player2: players[1],
                board: new Board(JSON.parse(room.currentBoardSignedMap)),
                locked: !(room.players[room.currentTurn].username === this.state.myname)
            })
            this.totalTime1 = Date.now() + 1000 * players[0].initial_time;
            this.totalTime2 = Date.now() + 1000 * players[1].initial_time;
            if (this.state.myname === this.state.player1.username) {
                this.setState({ mycolor: this.state.player1.color })
            } else {
                this.setState({ mycolor: this.state.player2.color })
            }
            this.setState({
                currColor: colorToSign(room.players[room.currentTurn].color)
            })
        })

        socket.on('game end init', () => {
            // TODO implement game end 
            this.setState({
                gameEndModalVisible: true
            })
        })

        socket.on('game end result', (data) => {
            const room = JSON.parse(data);
            console.log('game ended');
            this.setState({
                end: true,
                winner: room.winner
            })
            const {player1, player2, myname} = this.state;
            if ((room.winner === 0 && player1.username === myname) || (room.winner === 1 && player2.username === myname)) {
                message.success('You Won!');
            } else {
                message.error('You Lost');
            }
        })

        /**
         * handle opponent resigned
         */
        socket.on('game ended', (data) => {
            const room = JSON.parse(data);
            this.setState({
                end: true,
                winner: room.winner
            })
            const {player1, player2, myname} = this.state;
            if ((room.winner === 0 && player1.username === myname) || (room.winner === 1 && player2.username === myname)) {
                message.success('You Won!');
            } else {
                message.error('You Lost');
            }
        })

        socket.on('calc score', (data) => {
            // TODO implement terr count 
            const scoreResult = JSON.parse(data);
            console.log('calc score' + scoreResult);
            const {player1} = this.state;
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
            this.setState({
                scoreModalVisible: true
            })
        })

        socket.on('resign', () => {
            // TODO implment win message
            console.log('opponent resigned')
            this.setState({
                end: true
            })
        })

        socket.on('regret init', (data) => {
            const room = JSON.parse(data);
            if (room.room_id === this.state.room_id) {
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
                    if (room.currentTurn === 0) {
                        this.setState({
                            currColor: colorToSign(this.state.player1.color)
                        })
                    } else {
                        this.setState({
                            currColor: colorToSign(this.state.player2.color)
                        })
                    }
                    this.setState({
                        board: new Board(JSON.parse(room.currentBoardSignedMap)),
                        locked: !(room.players[room.currentTurn].username === this.state.myname)
                    })
                    message.success('Opponent accept your regret request');
                }
            }
        })

        socket.on('new message', (data)=>{
            const message = JSON.parse(data);
            let chats = this.state.chats;
            chats.push(message)
            this.setState({
                chats : chats
            })
        })

        socket.on('debug', (debug_message) => {
            message.error(debug_message);
        })
    }

    

    getNextPlayer = () => { }

    /**
     * used when mouse clicked on board, used by Board's onVertexMouseUp
     * @param {*} evt mouse event
     * @param {*} x coord pair
     * @param {*} y coord pair
     */
    mouseClick = (evt, [x, y]) => {
        let sign = this.state.currColor;
        if (!this.state.locked && !this.state.end) {
            try {
                this.state.board.makeMove(sign, [x, y], { preventOverwrite: true, preventKo: true})
                this.setState({
                    locked: true
                })
                socket.emit('move', { room_id: this.state.room_id, sign: sign, vertex: [x, y] })
                console.log('sent move to server');
            } catch (e) {
                console.error(e);
            }
        }

    }

    /**
     * reset the board, used for debug purpose, 
     * shouldn't be exposed in production
     */
    resetBoard = () => {
        let newMap = startMap(defaultSize)
        this.setState({
            board: new Board(newMap),
            currColor: 1,
            locked: false,
            end: false
        })
    }

    pass = () => {
        this.setState({
            locked: true
        })
        socket.emit('move', { room_id: this.state.room_id, sign: 0, vertex: [-1, -1] })
        console.log(`you passed`);
        message.info('You passed');
    }

    resign = () => {
        this.setState({
            end: true
        })
        socket.emit('resign', {room_id : this.state.room_id});
        message.warn('You choose to resign');
        console.log(`you resigned`);
    }

    calcScore = () => {
        socket.emit('calc score', {room_id : this.state.room_id});
    }

    regret = () => {
        socket.emit('regret init', {room_id : this.state.room_id, username: this.state.myname});
    }

    /**
     * player color toString
     */
    getPlayer = () => {
        return (signToColor(this.state.currColor) === this.state.player1.color ? 0 : 1);
    }

    getMyIndex = () => {
        return (this.state.myname === this.state.player1.username ? 1 : 0);
    }

    /**
     * getter for state.locked 
     */
    getLocked = () => {
        return (this.state.locked)
    }

    restartTimer = (startTime) => {
        return (Date.now() + 1000 * startTime)
    }

    gameStart = () => {
        socket.emit('game start init', {username: this.state.myname, room_id: this.state.room_id});
    }

    regretHandleCancel = component => {
        console.log(component);
        this.setState({
            regretModalVisible: false,
        });
        socket.emit('regret response', {
            username: this.state.myname,
            room_id: this.state.room_id,
            answer: false
        })
    };

    regretHandleOk = component => {
        console.log(component);
        this.setState({
            regretModalVisible: false
        });
        socket.emit('regret response', {
            username: this.state.myname,
            room_id: this.state.room_id,
            answer: true
        })
    }

    countHandleOk = component => {
        console.log(component);
        this.setState({
            scoreModalVisible: false
        })
        socket.emit('game end init', {room_id : this.state.room_id, username: this.state.myname});
    }

    countHandleCancel = component => {
        console.log(component);
        this.setState({
            scoreModalVisible: false
        })
    }

    gameEndHandleOk = component => {
        console.log(component);
        this.setState({
            gameEndModalVisible: false
        })
        socket.emit('game end response', {room_id : this.state.room_id, username: this.state.myname, ackGameEnd : true});
    }

    gameEndHandleCancel = component => {
        console.log(component);
        this.setState({
            gameEndModalVisible: false
        })
        socket.emit('game end response', {room_id : this.state.room_id, username: this.state.myname, ackGameEnd : false})
    }

    gameStartHandleOk = component => {
        console.log(component);
        this.setState({
            gameEndModalVisible: false
        })
        socket.emit('game end response', {room_id : this.state.room_id, username: this.state.myname, answer : true});
    }

    gameStartHandleCancel = component => {
        console.log(component);
        this.setState({
            gameEndModalVisible: false
        })
        socket.emit('game end response', {room_id : this.state.room_id, username: this.state.myname, answer : false})
    }

    isPlayerTurn = (player) => {
        if (player === 0) {
            return (signToColor(this.state.currColor)) === this.state.player1.color;
        } else {
            return (signToColor(this.state.currColor)) === this.state.player2.color;
        }
    }

    sendMessage = (message) => {
        const {myname} = this.state;
        socket.emit('new message', {username: myname, message: message, })
    }

    startTimer1 = () => {
        this.countdownApi && this.countdownApi.start();
    }

    startTimer2 = () => {
        this.countdownApi2 && this.countdownApi2.start();
    }

    handleUpdate = () => {
        this.forceUpdate();
    };

    pauseTimer1 = () => {
        this.countdownApi && this.countdownApi.pause();
    };

    pauseTimer2 = () => {
        this.countdownApi2 && this.countdownApi2.pause();
    };

    render() {
        let {
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
            scoreDiff
        } = this.state;
        if (!gameStart) {
            return (
                <div>
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
                                <Col>
                                    <Card title=' ' style={{ width: 300 }} loading>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card title=' ' style={{ width: 300 }} loading>
                                    </Card>
                                </Col>
                            </Row>
                            <Skeleton />
                            <Row>
                                <Col>
                                    <Skeleton.Button />
                                </Col>
                                <Col>
                                <Skeleton.Button />
                                </Col>
                                <Col>
                                <Skeleton.Button />
                                </Col>
                                <Col>
                                <Skeleton.Button />
                                </Col>
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
                    <p>Current score is {player1.username} {score1}, {player2.username} {score2}, </p> 
                    <p> with a {scoreDiff > 0 ? 'black lead of' + scoreDiff + 'points': 'white lead of ' + -1*scoreDiff + 'points'}, </p> 
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
                <Modal
                    title="Game Start Request"
                    visible={this.state.gameStartModalVisible}
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
                    <p>Your opponent would like to start the game, will you accept?</p>
                </Modal>
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
                            <Col>
                                <Card title={player1.username} style={{ width: 300 }}
                                    headStyle={player1.username === myname ? { backgroundColor: "darkgrey" } : { backgroundColor: "white" }}
                                    bodyStyle={player1.username === myname ? { backgroundColor: "aliceblue" } : { backgroundColor: "white" }}>
                                    <Statistic title='Rank' value='1d'></Statistic>
                                    <Countdown
                                        date={this.totalTime1}
                                        ref={this.setRef1}
                                        autoStart={false}
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
                                    <Countdown
                                        date={this.totalTime2}
                                        ref={this.setRef2}
                                        autoStart={false}
                                    />
                                    <Badge dot={this.isPlayerTurn(1)}>
                                        <Statistic title='Playing' value={player2.color}></Statistic>
                                    </Badge>
                                </Card>
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
                            <Col>
                                <Popconfirm placement="left" title='Are you sure to pass?' onConfirm={this.pass} okText="Yes" cancelText="No" disabled={locked || end}>
                                    <Button disabled={locked || end}>Pass</Button>
                                </Popconfirm>
                            </Col>
                            <Col>
                                <Button onClick={this.regret} disabled={end}>Regret</Button>
                            </Col>
                            <Col>
                                <Popconfirm placement="top" title='Are you sure to resign?' onConfirm={this.resign} okText="Yes" cancelText="No" disabled={end}>
                                    <Button disabled={end}>Resign</Button>
                                </Popconfirm>
                            </Col>
                            <Col>
                                <Button onClick={this.calcScore} disabled={end}>Calculate Score</Button>
                            </Col>
                            <Col>
                                <Button onClick={this.gameStart} >Start game</Button>
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