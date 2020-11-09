import React from 'react';
import { Form, Input, Button, Col } from 'antd';
import { DesktopOutlined, UserOutlined } from '@ant-design/icons';

import { Redirect } from 'react-router-dom';
import { socket } from "./api";

const layout = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 16,
    },
};
const tailLayout = {
    wrapperCol: {
        offset: 8,
        span: 16,
    },
};

class SignIn extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            submitted: false
        }
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        // this.props.history.goForward();
    }

    handleSubmit = (values) => {
        console.log('Success:', values);
        const nickname = values.nickname;
        const room = values.room;
        console.log(`login with nickname ${nickname} to room ${room}`);
        socket.emit('join_room_player', { username: nickname, room_id : room });
        this.props.cb(nickname, room);
        this.setState({submitted:true})
    };

    onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };


    render() {
        const submitted = this.state.submitted;
        if (submitted) {
            return (
                <Redirect to="/game" />
            )
        }
        return (
            <div>
                <Form
                    {...layout}
                    name="basic"
                    onFinish={this.handleSubmit}
                    onFinishFailed={this.onFinishFailed}>

                    <Form.Item
                        label="nickname"
                        name="nickname"
                        rules={[
                            {
                                required: true,
                                message: 'Please input your nickname!',
                            },
                        ]}>
                        <Col span={6}>
                            <Input
                                size="large"
                                placeholder="Enter your nickname"
                                prefix={<UserOutlined className="site-form-item-icon" />}
                                allowClear
                            />
                        </Col>
                    </Form.Item>
                    <Form.Item
                        label="room id"
                        name="room"
                        rules={[
                            {
                                required: true,
                                message: 'Please input room id!',
                            },
                        ]}>
                        <Col span={6}>
                            <Input
                                size="large"
                                placeholder="Enter game room id"
                                prefix={<DesktopOutlined className="site-form-item-icon" />}
                                allowClear
                            />
                        </Col>
                    </Form.Item>
                    <Form.Item {...tailLayout}>
                        <Button type="primary" size='large' htmlType="submit">
                            Login
                    </Button>
                    </Form.Item>
                </Form>
            </div>
        )
    }
}

export default SignIn;