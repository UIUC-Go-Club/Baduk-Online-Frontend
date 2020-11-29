import { Goban } from '@sabaki/shudan'
import '@sabaki/shudan/css/goban.css';
import { Button, Col, Empty, Row } from 'antd';
import React from 'react'
import { Link } from 'react-router-dom';
import { socket, server_url } from "./api";
import { startMap, getCurrentBoard } from './utils'

/**
 * Game review screen
 */
class GameReview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: props.username,
            room_id: props.room_id,
            loading: true,
            allMoves: [],
            currMoves: [],
            scoreResult: {},
            player1: [],
            player2: [],
            showCoordinates: true,
        }
    }

    componentDidMount() {
        if (this.props.location.state) {
            this.setState({
                room_id: this.props.location.state.room_id
            })
        }
        this.fetchRoomData();
    }

    /**
     * fetch the current game data from restful api
     */
    fetchRoomData = () => {
        const endpoint = server_url + 'room/';
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
                    allMoves: data.lastMove,
                    currMoves: data.lastMove,
                    scoreResult: data.scoreResult,
                    player1: data.players[0],
                    player2: data.players[1],
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

    render() {
        let {
            loading,
            show,
            board,
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
        if (this.state.loading) {
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
                            signMap={board.signMap}
                            markerMap={markLastMove && markerMap}
                            paintMap={showProbMap && probMap}
                            dimmedStones={showDimmedStones ? dimmedStones : []}
                            showCoordinates={showCoordinates}
                            onVertexMouseUp={this.mouseClick} />
                    </Col>
                </Row>
            </div>
        )
    }
}

export default GameReview;