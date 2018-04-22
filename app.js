const express = require('express');
const socket = require('socket.io');
const shortid = require('shortid');
const app = express();

// view engine
app.use('/public', express.static(process.cwd() + '/public'));
app.set('view engine', 'ejs');

//routes
app.get('/', function (req, res) {
    res.render('index');
});

//App setup
var server = app.listen(3000, function () {
    console.log('Server 3000');
});

//Socket setup
const io = socket(server);
var game = {};
let winningCombinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function checkForWinners(symbol, room) {
    for (var a = 0; a < winningCombinations.length; a++) {
        if (game[room]['gameDashbord'][winningCombinations[a][0]] == symbol && game[room]['gameDashbord'][winningCombinations[a][1]] == symbol && game[room]['gameDashbord'][winningCombinations[a][2]] == symbol) {
            game[room]['winner'] = true;
        }
    }
}

//Socket event
io.on('connection', function (socket) {
    socket.on('creat-room', function () {
        const room = shortid.generate();
        socket.join(room);
        game[room] = {
            player1: socket.id,
        }
        game[room]['currentPlayer'] = socket.id;
        game[room]['winner'] = false;
        socket.emit('room-created', room, socket.id);
    });

    socket.on('join-room', function (room) {
        io.of('/').in(room).clients(function (error, clients) {

            if (clients.length === 1) {
                socket.join(room);
                game[room]['player2'] = socket.id;
                game[room]['gameDashbord'] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                game[room]['step'] = 0;
                io.sockets.in(room).emit('game-start', room, socket.id);
            }

        });
    });

    socket.on('step', function (room, squareId) {
        io.of('/').in(room).clients(function (error, clients) {

            if (game[room]['currentPlayer'] === socket.id) {
                let icon;
                game[room]['step'] = game[room]['step'] + 1;

                if (socket.id == game[room]['player1']) {
                    icon = 'X';

                    if (game[room]['gameDashbord'][squareId] == 0) {
                        game[room]['gameDashbord'][squareId] = icon;
                        checkForWinners(icon, room);
                        game[room]['currentPlayer'] = game[room]['player2'];
                    }

                } else if (socket.id == game[room]['player2']) {
                    icon = 'O';

                    if (game[room]['gameDashbord'][squareId] == 0) {
                        game[room]['gameDashbord'][squareId] = icon;
                        checkForWinners(icon, room);
                        game[room]['currentPlayer'] = game[room]['player1'];
                    }

                }

                let result = game[room]['winner'];

                if (game[room]['step'] == 9 && !result) {
                    result = 'DRAW';
                }
                
                io.sockets.in(room).emit('add-step', squareId, icon, result);
            }

        });
    });

    socket.on('new-game', function (room) {
        io.of('/').in(room).clients(function (error, clients) {
            game[room]['currentPlayer'] = game[room]['player1'];
            game[room]['gameDashbord'] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
            game[room]['winner'] = false;
            game[room]['step'] = 0;
            io.sockets.in(room).emit('start-new-game');
        });

    });
});
