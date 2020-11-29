import React from 'react';
import { Form, Input, Button, Col, message } from 'antd';
import { DesktopOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';

import { Redirect } from 'react-router-dom';
import { server_url } from "./api";

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

class Signup extends React.Component {
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
        const username = values.username;
        const password = values.password;
        console.log(`login with username: ${username} and password: ${password}`);
        // socket.emit('join_room_player', { username: nickname, room_id : room });
        const endpoint = server_url + 'auth/signup';
        // console.log(endpoint)
        const signupData = {
            username: username,
            password: password
        }
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            body: JSON.stringify(signupData)
        }).then(response => response.json())
        .then(data => {
            console.log('signup success:', data);
            message.success('signup success');
            this.setState({ submitted: true })
        })
        .catch((error) => {
            console.error('signup error:', error);
            message.error('signup failed');
        });
    };

    onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };


    render() {
        const submitted = this.state.submitted;
        if (submitted) {
            return (
                <Redirect push to="/" />
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
                        label="username"
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: 'Please input your username!',
                            },
                        ]}>
                        <Col span={6}>
                            <Input
                                size="large"
                                placeholder="Enter your username"
                                prefix={<UserOutlined className="site-form-item-icon" />}
                                allowClear
                            />
                        </Col>
                    </Form.Item>
                    <Form.Item
                        label="password"
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Please input password!',
                            },
                        ]}>
                        <Col span={6}>
                            <Input.Password
                                size="large"
                                placeholder="Enter your password"
                                prefix={<DesktopOutlined className="site-form-item-icon" />}
                                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                allowClear
                            />
                        </Col>
                    </Form.Item>
                    <Form.Item {...tailLayout}>
                        <Button type="primary" size='large' htmlType="submit">
                            Signup
                    </Button>
                    </Form.Item>
                </Form>
            </div>
        )
    }
}

export default Signup;