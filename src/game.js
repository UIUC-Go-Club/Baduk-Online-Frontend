import React from 'react';
import Board from '@sabaki/go-board';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import '@sabaki/go-board';
import { Button } from 'antd';

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
            boardSize: defaultSize
        }
    }

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

    getPlayer = () => {
        if (this.state.currPlayer === 1) {
            return "Black";
        } else {
            return 'White';
        }
    }

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