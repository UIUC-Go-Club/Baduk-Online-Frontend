import React from 'react';
import Board from '@sabaki/go-board';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import '@sabaki/go-board';
import { Button, Switch } from 'antd';
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

const createTwoWaySwitch = component => ({ stateKey, text, checked}) => {
    return(
        <label>
            <Switch
                        checkedChildren={<CheckOutlined />}
                        unCheckedChildren={<CloseOutlined />}
                        defaultChecked={checked}
                        onClick={() => component.setState(s => ({[stateKey]: !s[stateKey]}))}
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
            locked: false,
            boardSize: defaultSize,
            showCoordinates: true,
            animated: false,
            realisticPlacement: false
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
            console.log(`opponent name is ${opponent} playing `);
            if (currSign === 1) {
                this.setState({
                    opponent: opponent,
                    player1: currPlayer,
                    player2: opponent
                })
            } else {
                this.setState({
                    opponent: opponent,
                    player2: currPlayer,
                    player1: opponent
                })
            }
        })

        socket.on('game end')
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

    /**
     * player color toString
     */
    getPlayer = () => {
        if (this.state.currPlayer === 1) {
            return "Black";
        } else {
            return 'White';
        }
    }

    /**
     * getter for state.locked 
     */
    getLocked = () => {
        return (signToColor(this.state.currPlayer))
    }

    render() {
        let {
            board,
            showCoordinates,
            realisticPlacement,
            animated
          } = this.state
        return (
            <div>
                <div>
                    <this.toggleSwitch stateKey={'showCoordinates'} text={'show coordinates'} checked={true}></this.toggleSwitch>
                    <this.toggleSwitch stateKey={'realisticPlacement'} text={'realistic stone placement'} checked={false}></this.toggleSwitch>
                    <this.toggleSwitch stateKey={'animated'} text={'animated stone placement'} checked={false}></this.toggleSwitch>
                </div>
                <div class='board'>
                    <Goban vertexSize={30} 
                    signMap={board.signMap} 
                    showCoordinates={showCoordinates}
                    fuzzyStonePlacement={realisticPlacement}
                    animateStonePlacement={animated}
                    onVertexMouseUp={this.mouseClick} />
                </div>
                <div>
                    Current Player is {this.getPlayer()}
                    <br />
                    Board is {this.getLocked()}
                </div>
                <Button onClick={this.resetBoard}>Debug.reset</Button>
            </div>

        )
    }
}

export default Game;