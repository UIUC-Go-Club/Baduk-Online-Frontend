import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import { Button, Col, Empty, Row, Timeline } from 'antd';
import React from 'react'
import { Link } from 'react-router-dom';
import { socket, server_url } from "./api";
import { startMap, getCurrentBoard, signToColor, vertexToString } from './utils'

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
            signMap: startMap(19),
            scoreResult: {},
            player1: [],
            player2: [],
            boardSize: 19,
            komi: 7.5,
            handicap: 0,
            showCoordinates: true,
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
                    signMap: getCurrentBoard(data.pastMoves, data.boardSize, data.pastMoves.length),
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

    handleClick = (index) => () => {
        const newBoard = getCurrentBoard(this.state.allMoves, this.state.boardSize, index)
        this.setState({
            signMap: newBoard,
        })
    }

    render() {
        let {
            loading,
            show,
            signMap,
            showCoordinates,
            player1,
            player2,
            myname,
            end,
            score1,
            score2,
            scoreDiff,
            allMoves,
            markLastMove,
            markerMap,
            dimmedStones,
            probMap,
            showDimmedStones,
            showProbMap,
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
                    <Col flex='650px'>
                        <Goban vertexSize={30}
                            signMap={signMap}
                            markerMap={markLastMove && markerMap}
                            paintMap={showProbMap && probMap}
                            dimmedStones={showDimmedStones ? dimmedStones : []}
                            showCoordinates={showCoordinates}
                            onVertexMouseUp={this.mouseClick} 
                            style={{marginRight: 20, marginBottom: 20, flexWrap: 'wrap'}} />
                    </Col>
                    <Col flex='auto'>
                        <Timeline>
                            {allMoves.map(({ vertex, sign }, index) => (
                                <div key={index} onClick={this.handleClick(index+1)}>
                                    <Timeline.Item key={index} >
                                        Move {index} : {vertexToString(vertex)} by {signToColor(sign)}
                                    </Timeline.Item>
                                </div>
                            ))}
                        </Timeline>
                    </Col>
                </Row>
            </div>
        )
    }
}

export default GameReview;