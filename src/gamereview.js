import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import Board from '@sabaki/go-board';
import { Button, Col, Empty, message, notification, Row, Timeline } from 'antd';
import React from 'react'
import { Link } from 'react-router-dom';
import { server_url } from "./api";
import { startMap, getCurrentBoard, signToColor, vertexToString, generateMarkerMap } from './utils'

/**
 * Game review screen
 */
class GameReview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: props.username,
            room_id: props.room_id ? props.room_id : '32df',
            loading: true,
            allMoves: [],
            board: new Board(startMap(19)),
            signMap: startMap(19),
            scoreResult: {},
            player1: [],
            player2: [],
            boardSize: 19,
            komi: 7.5,
            handicap: 0,
            showCoordinates: true,
            influenceMap: [],
            markerMap: [],
            dimmedStones: [],
            showDimmedStones: false,
            showInfluenceMap: false,
        }
    }

    componentDidMount() {
        if (this.props.location.state) {
            this.setState({
                room_id: this.props.location.state.room_id
            }, this.fetchRoomData);
        }
        
    }

    /**
     * fetch the current game data from restful api
     */
    fetchRoomData = () => {
        const endpoint = server_url + 'room';
        console.log(`${endpoint}/${encodeURIComponent(this.state.room_id)}`);
        fetch(`${endpoint}/${encodeURIComponent(this.state.room_id)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
        }).then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                this.setState({
                    loading: false,
                    allMoves: data.pastMoves,
                    board: new Board(getCurrentBoard(data.pastMoves, data.boardSize, data.pastMoves.length)),
                    sign: data.pastMoves.length === 0 ? 1 : data.pastMoves[data.pastMoves.length-1].sign,
                    scoreResult: data.scoreResult,
                    player1: data.players[0],
                    player2: data.players[1],
                    boardSize: data.boardSize,
                    komi: data.komi,
                    handicap: data.handicap,
                    winner: data.winner,
                    currentTurn: data.currentTurn,
                })
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    handleTreeClick = (index) => () => {
        const newSignmap = getCurrentBoard(this.state.allMoves, this.state.boardSize, index)
        const newBoard = new Board(newSignmap)
        this.setState({
            board: newBoard,
            sign: this.state.allMoves[index-1].sign,
        })
    }

    mouseClick = (evt, [x, y]) => {
        let sign = this.state.sign * -1;
            try {
                const newBoard = this.state.board.makeMove(sign, [x, y], { preventOverwrite: true, preventSuicide: true, preventKo: true })
                this.setState({
                    board: newBoard,
                    sign: sign,
                    lastMove: {vertex: [x,y], sign: sign},
                    markerMap: generateMarkerMap(this.state.boardSize, [x,y]),
                    showDimmedStones: false,
                    showInfluenceMap: false,
                })
            } catch (e) {
                console.error(e);
            }

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
        this.fetchAnalysisData(this.state.komi, this.state.handicap, this.state.board.signMap);
    }

    render() {
        let {
            loading,
            board,
            showCoordinates,
            player1,
            player2,
            room_id,
            allMoves,
            markLastMove,
            markerMap,
            dimmedStones,
            influenceMap,
            showDimmedStones,
            showInfluenceMap,
        } = this.state;
        if (loading) {
            return (
                <Empty description={
                    <span>
                        Please select a room to review from profile
                    </span>
                }>
                    <Link to='/profile'><Button type="primary">Go to profile</Button></Link>
                </Empty>
            )
        }

        return (
            <div>
                <Row>
                    <h2>Game between {player1.username} and {player2.username} in room {room_id} </h2>
                </Row>
                <Row>
                    <Col flex='650px'>
                        <Goban vertexSize={30}
                            signMap={board.signMap}
                            markerMap={markLastMove && markerMap}
                            paintMap={showInfluenceMap && influenceMap}
                            dimmedStones={showDimmedStones ? dimmedStones : []}
                            showCoordinates={showCoordinates}
                            onVertexMouseUp={this.mouseClick} 
                            style={{marginRight: 20, marginBottom: 20, flexWrap: 'wrap'}} />
                    </Col>
                    <Col flex='auto'>
                        <Timeline>
                            {allMoves.map(({ vertex, sign }, index) => (
                                <div key={index} onClick={this.handleTreeClick(index+1)}>
                                    <Timeline.Item key={index} >
                                        Move {index} : {vertexToString(vertex)} by {signToColor(sign)}
                                    </Timeline.Item>
                                </div>
                            ))}
                        </Timeline>
                    </Col>
                </Row>
                <Row>
                <Col>
                                <Button onClick={this.showAnalysis}>Show Analysis</Button>
                            </Col>
                </Row>
            </div>
        )
    }
}

export default GameReview;