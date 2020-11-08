import React from 'react';
import Board from '@sabaki/go-board';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import '@sabaki/go-board';
import { Button } from 'antd';
import clientio  from 'socket.io-client';
import {SERVER_ADDRESS} from './config.js';

const defaultSize = 19
// const signMap = startMap(defaultSize)

function startMap(size) {
    return new Array(size).fill(0).map(() => new Array(size).fill(0));
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            board: new Board(startMap(defaultSize)),
            currPlayer: 1,
            locked: false,
            boardSize: defaultSize,
        }
    }

    socket;

    componentDidMount() {
        this.configureSocket();
    }

    configureSocket = () => {
        var socket = clientio(SERVER_ADDRESS);
        socket.on('connect_error', () => {
            console.log('connect_error');
        })
        socket.on('reconnect_error', () => {
            console.log('reconnect_error')
        })
        socket.on('connect', () => {console.log(socket.id)});
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
        this.socket = socket;
    }

    /**
     * used when mouse clicked on board, used by Board's onVertexMouseUp
     * @param {*} evt mouse event
     * @param {*} x coord pair
     * @param {*} y coord pair
     */
    mouseClick = (evt, [x, y]) => {
        let sign = this.state.currPlayer;
        if (!this.state.locked) {
            try {
                let newBoard = this.state.board.makeMove(sign, [x, y], { preventOverwrite: true })
                this.setState({
                    board: newBoard,
                    currPlayer: this.state.currPlayer * -1,
                    locked: true
                })
                this.socket.emit('move', {sign: sign, x: x, y: y})
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
            locked: false
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
        if (this.state.locked === true) {
            return "locked";
        } else {
            return "not locked";
        }
    }

    render() {
        return (
            <div>
                <Goban vertexSize={24} signMap={this.state.board.signMap} onVertexMouseUp={this.mouseClick} />
                <div>
                    Current Player is {this.getPlayer()}
                    <br/>
                    Board is {this.getLocked()}
                </div>
                <Button onClick={this.resetBoard}>Debug.reset</Button>
            </div>
            
        )
    }
}

export default Game;