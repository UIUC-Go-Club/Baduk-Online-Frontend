import renderer  from 'react-test-renderer';
import React from 'react';
import Signin from './signinpage';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history'

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
});

test('profile render correctly', () => {
    const history = createMemoryHistory();
    const route = '/home'
    history.push(route)
    const signin = renderer.create(<Router history={history}><Signin></Signin></Router>).toJSON();
    expect(signin).toMatchSnapshot();
})