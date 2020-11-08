import clientio  from 'socket.io-client';
import {SERVER_URL} from './config.js';

export const socket = clientio(SERVER_URL);