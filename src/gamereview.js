import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import Board from '@sabaki/go-board';
import { Button, Col, Empty, message, notification, Row, Timeline } from 'antd';
import { StepBackwardOutlined, StepForwardOutlined, FastBackwardOutlined, FastForwardOutlined } from '@ant-design/icons'
import { Scrollbars } from 'react-custom-scrollbars';
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
            username: localStorage.getItem('username'),
            room_id: props.room_id ? props.room_id : '32df',
            game_id: '0',
            loading: true,
            allMoves: [],
            currentTurn: 0,
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
            initBoardSignedMap: [],
            dimmedStones: [],
            showDimmedStones: false,
            showInfluenceMap: false,
        }
    }

    componentDidMount() {
        if (this.props.location.state) {
            this.setState({
                room_id: this.props.location.state.room_id,
                game_id: this.props.location.state.id
            }, this.fetchRoomData);
        }

    }

    /**
     * fetch the current game data from restful api
     */
    fetchRoomData = () => {
        const endpoint = server_url + 'game/room';
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
                for (let game of data) {
                    if (game._id === this.state.game_id) {
                        console.log('game found')
                        const pastMoves = JSON.parse(game.gameTree);
                        this.setState({
                            loading: false,
                            allMoves: pastMoves,
                            currentTurn: pastMoves.length,
                            board: new Board(getCurrentBoard(pastMoves, game.boardSize, pastMoves.length, JSON.parse(game.initBoardSignedMap))),
                            initBoardSignedMap: JSON.parse(game.initBoardSignedMap),
                            sign: pastMoves.length === 0 ? 1 : pastMoves[pastMoves.length - 1].sign,
                            lastMove: pastMoves[pastMoves.length - 1],
                            markerMap: generateMarkerMap(game.boardSize, pastMoves[pastMoves.length - 1].vertex),
                            scoreResult: game.scoreResult,
                            player1: game.players[0],
                            player2: game.players[1],
                            boardSize: game.boardSize,
                            komi: game.komi,
                            handicap: game.handicap,
                            winner: game.winner
                        })
                        break;
                    }
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    handleTreeClick = (index) => () => {
        const newSignmap = getCurrentBoard(this.state.allMoves, this.state.boardSize, index, this.state.initBoardSignedMap)
        const newBoard = new Board(newSignmap)
        this.setState({
            board: newBoard,
            sign: this.state.allMoves[index - 1].sign,
            lastMove: this.state.allMoves[index - 1],
            currentTurn: index,
            markerMap: generateMarkerMap(this.state.boardSize, this.state.allMoves[index - 1].vertex),
            showDimmedStones: false,
            showInfluenceMap: false,
        })
    }

    /**
     * go back to first move
     */
    fastBackword = () => {
        const newSignmap = getCurrentBoard(this.state.allMoves, this.state.boardSize, 1, this.state.initBoardSignedMap);
        this.setState({
            board: new Board(newSignmap),
            sign: this.state.allMoves[0].sign,
            lastMove: this.state.allMoves[0],
            currentTurn: 1,
            markerMap: generateMarkerMap(this.state.boardSize, this.state.allMoves[0].vertex),
            showDimmedStones: false,
            showInfluenceMap: false,
        })
    }

    /**
     * go to last move (index - 1)
     */
    stepBackword = () => {
        if (this.state.currentTurn <= 1) {
            message.warning('first turn');
            return;
        }
        const lastTurn = this.state.currentTurn - 1;
        const newSignmap = getCurrentBoard(this.state.allMoves, this.state.boardSize, lastTurn, this.state.initBoardSignedMap);
        this.setState({
            board: new Board(newSignmap),
            sign: this.state.allMoves[lastTurn - 1].sign,
            lastMove: this.state.allMoves[lastTurn - 1],
            currentTurn: lastTurn,
            markerMap: generateMarkerMap(this.state.boardSize, this.state.allMoves[lastTurn - 1].vertex),
            showDimmedStones: false,
            showInfluenceMap: false,
        })
    }

    /**
     * go to next move (index + 1)
     */
    stepForword = () => {
        if (this.state.currentTurn >= this.state.allMoves.length) {
            message.warning('last turn');
            return;
        }
        const nextTurn = this.state.currentTurn + 1;
        const newSignmap = getCurrentBoard(this.state.allMoves, this.state.boardSize, nextTurn, this.state.initBoardSignedMap);
        this.setState({
            board: new Board(newSignmap),
            sign: this.state.allMoves[nextTurn - 1].sign,
            lastMove: this.state.allMoves[nextTurn - 1],
            currentTurn: nextTurn,
            markerMap: generateMarkerMap(this.state.boardSize, this.state.allMoves[nextTurn - 1].vertex),
            showDimmedStones: false,
            showInfluenceMap: false,
        })
    }

    /**
     * go to final move
     */
    fastForward = () => {
        const lastTurn = this.state.allMoves.length;
        const newSignmap = getCurrentBoard(this.state.allMoves, this.state.boardSize, lastTurn, this.state.initBoardSignedMap);
        this.setState({
            board: new Board(newSignmap),
            sign: this.state.allMoves[lastTurn - 1].sign,
            lastMove: this.state.allMoves[lastTurn - 1],
            currentTurn: lastTurn,
            markerMap: generateMarkerMap(this.state.boardSize, this.state.allMoves[lastTurn - 1].vertex),
            showDimmedStones: false,
            showInfluenceMap: false,
        })
    }

    mouseClick = (evt, [x, y]) => {
        let sign = this.state.sign * -1;
        try {
            const newBoard = this.state.board.makeMove(sign, [x, y], { preventOverwrite: true, preventSuicide: true, preventKo: true })
            this.setState({
                board: newBoard,
                sign: sign,
                lastMove: { vertex: [x, y], sign: sign },
                markerMap: generateMarkerMap(this.state.boardSize, [x, y]),
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
        if (this.state.showDimmedStones) {
            this.setState({
                showDimmedStones: false,
                showInfluenceMap: false,
            })
        } else {
            this.fetchAnalysisData(this.state.komi, this.state.handicap, this.state.board.signMap);
        }
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
                            markerMap={markerMap}
                            paintMap={showInfluenceMap && influenceMap}
                            dimmedStones={showDimmedStones ? dimmedStones : []}
                            showCoordinates={showCoordinates}
                            onVertexMouseUp={this.mouseClick}
                            style={{ marginRight: 20, marginBottom: 20, flexWrap: 'wrap' }} />
                    </Col>
                    <Col flex='200px'>
                        <Scrollbars style={{ height: 650 }} autoHide>
                            <Timeline>
                                {allMoves.map(({ vertex, sign }, index) => (
                                    <div key={index} onClick={this.handleTreeClick(index + 1)}>
                                        <Timeline.Item key={index} >
                                            Move {index} : {vertexToString(vertex)} by {signToColor(sign)}
                                        </Timeline.Item>
                                    </div>
                                ))}
                            </Timeline>
                        </Scrollbars>
                    </Col>
                </Row>
                <Row>
                    <Col span={1} >
                        <Button size='large' icon={<FastBackwardOutlined />} onClick={this.fastBackword}></Button>
                    </Col>
                    <Col span={1} offset={1}>
                        <Button size='large' icon={<StepBackwardOutlined />} onClick={this.stepBackword}></Button>
                    </Col>
                    <Col span={1} offset={1}>
                        <Button size='large' icon={<StepForwardOutlined />} onClick={this.stepForword}></Button>
                    </Col>
                    <Col span={1} offset={1}>
                        <Button size='large' icon={<FastForwardOutlined />} onClick={this.fastForward}></Button>
                    </Col>
                </Row>
                <Row>
                    <Col span={2}>
                        <Button onClick={this.showAnalysis}>Show Analysis</Button>
                    </Col>
                </Row>
            </div>
        )
    }
}

export default GameReview;