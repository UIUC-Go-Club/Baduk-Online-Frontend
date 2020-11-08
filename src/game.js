import React from 'react';
import Board from '@sabaki/go-board';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import '@sabaki/go-board';
import { Button, Switch, Row, Col, Card } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { socket } from "./api";

const defaultSize = 19
// const signMap = startMap(defaultSize)

function startMap(size) {
    return new Array(size).fill(0).map(() => new Array(size).fill(0));
}

function signToColor(sign) {
    if (sign === 1) {
        return "Black";
    } else {
        return 'White';
    }
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
            board: new Board(startMap(defaultSize)),
            currPlayer: 1,
            locked: true,
            boardSize: defaultSize,
            showCoordinates: true,
            animated: false,
            realisticPlacement: false,
            player1: 'player1',
            player2: 'player2',
            sign1: 1,
            sign2: -1
        }
        this.toggleSwitch = createTwoWaySwitch(this);
    }

    componentDidMount() {
        this.configureSocket();
    }

    configureSocket = () => {

        socket.on('connect_error', () => {
            console.log('connect_error');
        })
        socket.on('reconnect_error', () => {
            console.log('reconnect_error')
        })
        socket.on('connect', () => { console.log(socket.id) });
        socket.on('move', (data) => {
            const { sign, x, y } = data;
            console.log(`received move sign: ${sign}, [x,y]: [${x}, ${y}]`);
            let newBoard = this.state.board.makeMove(sign, [x, y])
            this.setState({
                board: newBoard,
                currPlayer: this.state.currPlayer * -1,
                locked: false
            })
        })
        socket.on('game start', (data) => {
            const { currPlayer, currSign, opponent } = data;
            console.log(`opponent name is ${opponent}`);
            if (currSign === 1) {
                this.setState({
                    opponent: opponent,
                    player1: currPlayer,
                    player2: opponent,
                    locked: false
                })
                console.log('you go first')
            } else {
                this.setState({
                    opponent: opponent,
                    player2: currPlayer,
                    player1: opponent,
                    locked: true
                })
                console.log('opponent go first')
            }
        })

        socket.on('pass', () => {
            console.log('opponent passed');
            this.setState({
                currPlayer: this.state.currPlayer * -1,
                locked: false
            })
        })

        socket.on('game end', () => {
            // TODO implement game end 
            console.log('game end agreed by both player');
            this.setState({
                end: true
            })
        })

        socket.on('terr count', () => {
            // TODO implement terr count 
            console.log('opponent propose to count territories');
        })

        socket.on('resign', () => {
            // TODO implment win message
            console.log('opponent resigned')
            this.setState({
                end: true
            })
        })
    }

    /**
     * used when mouse clicked on board, used by Board's onVertexMouseUp
     * @param {*} evt mouse event
     * @param {*} x coord pair
     * @param {*} y coord pair
     */
    mouseClick = (evt, [x, y]) => {
        let sign = this.state.currPlayer;
        if (!this.state.locked && !this.state.end) {
            try {
                let newBoard = this.state.board.makeMove(sign, [x, y], { preventOverwrite: true })
                this.setState({
                    board: newBoard,
                    currPlayer: this.state.currPlayer * -1,
                    locked: true
                })
                socket.emit('move', { sign: sign, x: x, y: y })
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
            currPlayer: 1,
            locked: false,
            end: false
        })
    }

    pass = () => {
        this.setState({
            currPlayer: this.state.currPlayer * -1,
            locked: true
        })
        socket.emit('pass');
        console.log(`you passed`);
    }

    resign = () => {
        this.setState({
            end: true
        })
        socket.emit('resign');
        console.log(`you resigned`);
    }

    countTerr = () => {
        this.setState({
            locked: true
        })
        socket.emit('terr count');
    }

    regret = () => {
        socket.emit('regret');
    }

    /**
     * player color toString
     */
    getPlayer = () => {
        return (signToColor(this.state.currPlayer));
    }

    /**
     * getter for state.locked 
     */
    getLocked = () => {
        return (this.state.locked)
    }

    render() {
        let {
            board,
            showCoordinates,
            realisticPlacement,
            animated,
            player1,
            player2,
            sign1,
            sign2
        } = this.state
        return (
            <Row>
                <Col span={12}>
                    <Goban vertexSize={30}
                        signMap={board.signMap}
                        showCoordinates={showCoordinates}
                        fuzzyStonePlacement={realisticPlacement}
                        animateStonePlacement={animated}
                        onVertexMouseUp={this.mouseClick} />
                </Col>
                <Col span={12}>
                    <Row>
                        <Col>
                            <Card title={player1} style={{ width: 300 }}>
                                <p>Rank: </p>
                                <p>Remaining Time: 10:00</p>
                                <p>Playing {signToColor(sign1)}</p>
                            </Card>
                        </Col>
                        <Col>
                            <Card title={player2} style={{ width: 300 }}>
                                <p>Rank: </p>
                                <p>Remaining Time: 10:00</p>
                                <p>Playing {signToColor(sign2)}</p>
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
                        Current Player is {this.getPlayer()}
                    </Row>
                    <Row>
                        Board is {this.getLocked()}
                    </Row>
                    <Row>
                        <Col>
                        <Button onClick={this.pass}>Pass</Button>
                        </Col>
                        <Col>
                        <Button onClick={this.regret}>Regret</Button>
                        </Col>
                        <Col>
                        <Button onClick={this.resign}>Resign</Button>
                        </Col>
                        <Col>
                        <Button onClick={this.countTerr}>Count Territories</Button>
                        </Col>
                    </Row>
                    <Row>
                        <Button onClick={this.resetBoard}>Debug.reset</Button>
                    </Row>
                </Col>

            </Row>

        )
    }
}

export default Game;