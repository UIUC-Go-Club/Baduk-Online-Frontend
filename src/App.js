import React from 'react';
import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css'
import '@sabaki/go-board'
import GoBoard from '@sabaki/go-board';

const signMap = [
    [ 0, 0, 0,-1,-1,-1, 1, 0, 1, 1,-1,-1, 0,-1, 0,-1,-1, 1, 0],
    [ 0, 0,-1, 0,-1, 1, 1, 1, 0, 1,-1, 0,-1,-1,-1,-1, 1, 1, 0],
    [ 0, 0,-1,-1,-1, 1, 1, 0, 0, 1, 1,-1,-1, 1,-1, 1, 0, 1, 0],
    [ 0, 0, 0, 0,-1,-1, 1, 0, 1,-1, 1, 1, 1, 1, 1, 0, 1, 0, 0],
    [ 0, 0, 0, 0,-1, 0,-1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0],
    [ 0, 0,-1, 0, 0,-1,-1, 1, 0,-1,-1, 1,-1,-1, 0, 1, 0, 0, 1],
    [ 0, 0, 0,-1,-1, 1, 1, 1, 1, 1, 1, 1, 1,-1,-1,-1, 1, 1, 1],
    [ 0, 0,-1, 1, 1, 0, 1,-1,-1, 1, 0, 1,-1, 0, 1,-1,-1,-1, 1],
    [ 0, 0,-1,-1, 1, 1, 1, 0,-1, 1,-1,-1, 0,-1,-1, 1, 1, 1, 1],
    [ 0, 0,-1, 1, 1,-1,-1,-1,-1, 1, 1, 1,-1,-1,-1,-1, 1,-1,-1],
    [-1,-1,-1,-1, 1, 1, 1,-1, 0,-1, 1,-1,-1, 0,-1, 1, 1,-1, 0],
    [-1, 1,-1, 0,-1,-1,-1,-1,-1,-1, 1,-1, 0,-1,-1, 1,-1, 0,-1],
    [ 1, 1, 1, 1,-1, 1, 1, 1,-1, 1, 0, 1,-1, 0,-1, 1,-1,-1, 0],
    [ 0, 1,-1, 1, 1,-1,-1, 1,-1, 1, 1, 1,-1, 1,-1, 1, 1,-1, 1],
    [ 0, 0,-1, 1, 0, 0, 1, 1,-1,-1, 0, 1,-1, 1,-1, 1,-1, 0,-1],
    [ 0, 0, 1, 0, 1, 0, 1, 1, 1,-1,-1, 1,-1,-1, 1,-1,-1,-1, 0],
    [ 0, 0, 0, 0, 1, 1, 0, 1,-1, 0,-1,-1, 1, 1, 1, 1,-1,-1,-1],
    [ 0, 0, 1, 1,-1, 1, 1,-1, 0,-1,-1, 1, 1, 1, 1, 0, 1,-1, 1],
    [ 0, 0, 0, 1,-1,-1,-1,-1,-1, 0,-1,-1, 1, 1, 0, 1, 1, 1, 0]
]
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            board: new GoBoard(signMap),
            currPlayer : 1
        }
    }

    componentDidMount() {

    }

    mouseClick = (evt, [x, y]) => {
        let sign = this.state.currPlayer;
        try {
            let newBoard = this.state.board.makeMove(sign, [x, y], {preventOverwrite:true})
            this.setState({
                board: newBoard,
                currPlayer: this.state.currPlayer * -1
            })
        } catch (e) {
            console.error(e);
        }
    }

    getPlayer = () => {
        if (this.state.currPlayer === 1) {
            return "Black";
        } else {
            return 'White';
        }
    }

    render() {
        return (
            <div className="App">
                <Goban vertexSize={24} signMap={this.state.board.signMap} onVertexMouseUp={this.mouseClick}/>
                <div>
                    Current Player is {this.getPlayer()}
                </div>
            </div>
        );
    }
}
export default App;
