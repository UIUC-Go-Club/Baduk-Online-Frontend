import React from 'react';
import PropTypes from 'prop-types';

class Player extends React.Component{
    constructor(props) {
        super(props);
        this.username = this.props.username;
        this.type = this.props.player;
    }
}

Player.defaultProps = {
    username: 'username',
}

Player.propTypes = {
    username: PropTypes.string,
} 

export default Player;