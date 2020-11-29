import influence from '@sabaki/influence';
import Board from '@sabaki/go-board';
import deadstones from '@sabaki/deadstones';
deadstones.useFetch('./node_modules/@sabaki/deadstones/wasm/deadstones_bg.wasm')

export function startMap(size) {
    return new Array(size).fill(0).map(() => new Array(size).fill(0));
}

export const getCurrentBoard = (pastMoves, boardSize) => {
    let board = new Board(startMap(boardSize));
    for (let move of pastMoves) {
        board = board.makeMove(move.sign, move.vertex)
    }
    return board.signMap;
}

/**
 * calc the score and find the winner
 * same function used in backend
 * @param scoreBoardCopy
 * @param iterations number of iterations use to guess
 * @param komi
 * @param handicap
 * @returns {Promise<void>}
 */
export async function calcScoreHeuristic(scoreBoard, {iterations = 100, komi = 7.5, handicap = 0} = {}) {
    let scoreBoardCopy = scoreBoard.clone()
    try {
        let result = await deadstones
            .guess(scoreBoardCopy.signMap, {
                finished: true,
                iterations
            })
        for (let vertex of result) {
            let sign = scoreBoardCopy.get(vertex)
            if (sign === 0) {
                continue
            }
            scoreBoardCopy.setCaptures(-sign, x => x + 1)
            scoreBoardCopy.set(vertex, 0)
        }
        let areaMap = influence.map(scoreBoardCopy.signMap, {discrete: true})

        let r1 = getScore(scoreBoardCopy, areaMap, {komi: komi, handicap: handicap})
        console.log(r1)
        return r1
    } catch (error) {
        console.log(error)
    }
}

/**
 * get deadstones from signMap
 * @param signMap
 * @param iterations number of iterations use to guess
 * @returns {Promise<void>}
 */
export async function getDeadstones(signMap, {iterations = 100} = {}) {
    try {
        let result = await deadstones
            .guess(signMap, {
                finished: true,
                iterations
            })
        return result;
    } catch (error) {
        console.log(error)
    }
}

/**
 * get probability map from signMap
 * @param signMap
 * @param iterations number of iterations use to guess
 * @returns {Promise<void>}
 */
export async function getProbMap(signMap, {iterations = 100} = {}) {
    try {
        let result = await deadstones
            .getProbabilityMap(signMap, {
                iterations
            })
        return result;
    } catch (error) {
        console.log(error)
    }
}

/**
 * This function helps to count the score and find the winner
 * same function used in backend
 * @param board
 * @param areaMap
 * @param komi
 * @param handicap
 * @returns {{area: number[], captures: *[], territory: number[]}}
 */
export function getScore(board, areaMap, {komi = 0, handicap = 0} = {}) {
    let score = {
        area: [0, 0],
        territory: [0, 0],
        captures: [1, -1].map(sign => board.getCaptures(sign))
    }

    for (let x = 0; x < board.width; x++) {
        for (let y = 0; y < board.height; y++) {
            let z = areaMap[y][x]
            let index = z > 0 ? 0 : 1

            score.area[index] += Math.abs(Math.sign(z))
            if (board.get([x, y]) === 0)
                score.territory[index] += Math.abs(Math.sign(z))
        }
    }

    score.area = score.area.map(Math.round)
    score.territory = score.territory.map(Math.round)

    score.areaScore = score.area[0] - score.area[1] - komi - handicap
    score.territoryScore =
        score.territory[0] -
        score.territory[1] +
        score.captures[0] -
        score.captures[1] -
        komi

    return score
}