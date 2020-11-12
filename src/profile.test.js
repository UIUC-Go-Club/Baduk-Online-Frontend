import renderer  from 'react-test-renderer';
import React from 'react';
import Profile from './profile';
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
    const route = '/profile'
    history.push(route)
    const profile = renderer.create(<Router history={history}><Profile username='testuser'></Profile></Router>).toJSON();
    expect(profile).toMatchSnapshot();
})