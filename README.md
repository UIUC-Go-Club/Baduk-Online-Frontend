# Baduk-Online-Frontend

The game room of Baduk online

## This project is using create-react-app with craco

## Tools Used

- React
- Sabuki
- SocketIO
- Electron

## To setup dependencies

```bash
yarn
```

## To start in browser

```bash
yarn start
```

It may took some time to build the application

## To start in electron app

```bash
yarn estart
```

## To generate production build

```bash
yarn build
```

This will build both react and electron part.
Electron app executables can be found in the "dist" directory.

## To test

```bash
yarn test
```

Due to we aliasing preact to react, the test are not all passed for now.
